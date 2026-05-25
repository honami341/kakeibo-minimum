const ALLOWED_ORIGINS = new Set([
  "https://honami341.github.io",
  "http://localhost:8787",
  "http://127.0.0.1:8787"
]);

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          date: { type: "string", description: "YYYY-MM-DD" },
          source: { type: "string", enum: ["receipt", "epos", "bank", "manual"] },
          kind: { type: "string", enum: ["expense", "income", "transfer"] },
          amount: { type: "integer" },
          payer: { type: "string", enum: ["美樹", "穂波", "家族口座", "穂波個人口座", "その他"] },
          bearer: { type: "string", enum: ["家族", "穂波", "美樹", "口座移動", "要確認"] },
          category: {
            type: "string",
            enum: ["食費", "外食", "日用品", "子ども", "医療", "仕事", "家賃/固定費", "臨時出費", "臨時収入", "送金/ATM", "その他"]
          },
          memo: { type: "string" },
          status: { type: "string", enum: ["OK", "要確認"] }
        },
        required: ["date", "source", "kind", "amount", "payer", "bearer", "category", "memo", "status"]
      }
    }
  },
  required: ["entries"]
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true }, headers);
    }

    if (url.pathname !== "/classify" || request.method !== "POST") {
      return json({ error: "Not found" }, headers, 404);
    }

    if (!env.OPENAI_API_KEY) {
      return json({ error: "OPENAI_API_KEY is not configured in Cloudflare Workers secrets." }, headers, 500);
    }

    try {
      const body = await request.json();
      const model = body.model || "gpt-4o-mini";
      const month = body.month || "2026-05";
      const bulkType = body.bulkType || "mixed";
      const text = String(body.text || "").slice(0, 120000);

      if (!text.trim()) {
        return json({ error: "text is required" }, headers, 400);
      }

      const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: [
                    "あなたは日本の家庭用家計簿データ整形アシスタントです。",
                    "入力されたレシートテキスト、カード明細、口座明細を、指定スキーマのJSONだけで返してください。",
                    "金額は必ず整数円にしてください。日付が不明な場合は対象月の1日にしてください。",
                    "推測に自信がない場合、statusは要確認、bearerは要確認にしてください。",
                    "口座間送金、ATM入金、精算送金はkind=transfer、bearer=口座移動、category=送金/ATMにしてください。",
                    "家族の生活費はbearer=家族。穂波の仕事費はbearer=穂波、category=仕事。美樹個人費はbearer=美樹。",
                    "sourceはreceipt/epos/bank/manualのどれかにしてください。"
                  ].join("\n")
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `対象月: ${month}\n入力種類: ${bulkType}\n\n${text}`
                }
              ]
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "kakeibo_import",
              strict: true,
              schema
            }
          }
        })
      });

      const data = await openaiResponse.json();
      if (!openaiResponse.ok) {
        return json({ error: data.error?.message || "OpenAI API request failed" }, headers, openaiResponse.status);
      }

      const outputText = data.output
        ?.flatMap((item) => item.content || [])
        .find((content) => content.type === "output_text")?.text;

      if (!outputText) {
        return json({ error: "OpenAI response did not include output_text." }, headers, 502);
      }

      return json(JSON.parse(outputText), headers);
    } catch (error) {
      return json({ error: error.message || "Unexpected worker error" }, headers, 500);
    }
  }
};

function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://honami341.github.io";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(value, headers, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
