const STORAGE_KEY = "kakeibo-simple-from-2026-05";
const API_KEY_STORAGE_KEY = "kakeibo-openai-api-key";
const START_MONTH = "2026-05";

const form = document.getElementById("entryForm");
const monthFilter = document.getElementById("monthFilter");
const fields = {
  date: document.getElementById("date"),
  source: document.getElementById("source"),
  kind: document.getElementById("kind"),
  amount: document.getElementById("amount"),
  payer: document.getElementById("payer"),
  bearer: document.getElementById("bearer"),
  category: document.getElementById("category"),
  memo: document.getElementById("memo"),
  status: document.getElementById("status")
};
const aiFields = {
  apiKey: document.getElementById("apiKey"),
  model: document.getElementById("model"),
  bulkType: document.getElementById("bulkType"),
  bulkMonth: document.getElementById("bulkMonth"),
  bulkText: document.getElementById("bulkText"),
  status: document.getElementById("aiStatus"),
  previewRows: document.getElementById("previewRows")
};

let entries = loadEntries();
let previewEntries = [];

function todayValue() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const date = `${yyyy}-${mm}-${dd}`;
  return date < "2026-05-01" ? "2026-05-01" : date;
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function yen(value) {
  return `${Number(value || 0).toLocaleString("ja-JP")}円`;
}

function monthOf(date) {
  return String(date || "").slice(0, 7);
}

function sourceLabel(value) {
  return {
    receipt: "レシート/LINE",
    epos: "エポス",
    bank: "口座",
    manual: "臨時"
  }[value] || value;
}

function kindLabel(value) {
  return {
    expense: "支出",
    income: "収入",
    transfer: "口座移動"
  }[value] || value;
}

function currentMonthEntries() {
  return entries.filter((entry) => monthOf(entry.date) === monthFilter.value);
}

function addEntry(event) {
  event.preventDefault();
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: fields.date.value,
    source: fields.source.value,
    kind: fields.kind.value,
    amount: Number(fields.amount.value),
    payer: fields.payer.value,
    bearer: fields.bearer.value,
    category: fields.category.value,
    memo: fields.memo.value.trim(),
    status: fields.status.value
  };
  entries.push(entry);
  saveEntries();
  form.reset();
  fields.date.value = todayValue();
  fields.source.value = "receipt";
  fields.kind.value = "expense";
  fields.payer.value = "美樹";
  fields.bearer.value = "家族";
  fields.category.value = "食費";
  fields.status.value = "OK";
  render();
}

function deleteEntry(id) {
  entries = entries.filter((entry) => entry.id !== id);
  saveEntries();
  render();
}

function render() {
  const rows = currentMonthEntries();
  renderCards(rows);
  renderQuestions(rows);
  renderRows(rows);
  renderPreview();
}

function renderCards(rows) {
  const familyExpense = rows
    .filter((entry) => entry.kind === "expense" && entry.bearer === "家族" && entry.status !== "要確認")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const income = rows
    .filter((entry) => entry.kind === "income" && entry.status !== "要確認")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const honamiWork = rows
    .filter((entry) => entry.kind === "expense" && entry.bearer === "穂波" && entry.category === "仕事" && entry.status !== "要確認")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const pending = rows.filter((entry) => needsQuestion(entry)).length;

  document.getElementById("cards").innerHTML = [
    ["家族費", yen(familyExpense)],
    ["収入", yen(income)],
    ["穂波仕事費", yen(honamiWork)],
    ["要確認", `${pending}件`]
  ]
    .map(([label, value]) => `<div class="card"><small>${label}</small><strong>${value}</strong></div>`)
    .join("");
}

function needsQuestion(entry) {
  return (
    entry.status === "要確認" ||
    entry.bearer === "要確認" ||
    (entry.kind === "transfer" && (!entry.memo || entry.bearer === "口座移動"))
  );
}

function renderQuestions(rows) {
  const questions = rows.filter(needsQuestion);
  const target = document.getElementById("questions");
  if (!questions.length) {
    target.innerHTML = "<p>確認が必要なものはありません。</p>";
    return;
  }

  target.innerHTML = questions
    .map((entry) => {
      const reason = entry.kind === "transfer"
        ? "このお金の移動は何のためかをメモしてください。例: 穂波から家族口座へ生活費、美樹へ精算、ATM入金は誰の現金か。"
        : "家族費、個人費、仕事費、除外のどれかを決めてください。";
      return `<div class="question">
        <strong>${entry.date} ${yen(entry.amount)} ${entry.category}</strong><br>
        ${sourceLabel(entry.source)} / ${kindLabel(entry.kind)} / ${entry.memo || "メモなし"}<br>
        ${reason}
      </div>`;
    })
    .join("");
}

function renderRows(rows) {
  document.getElementById("count").textContent = `${rows.length}件`;
  document.getElementById("rows").innerHTML = rows
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => `<tr>
      <td>${entry.date}</td>
      <td>${sourceLabel(entry.source)}</td>
      <td>${kindLabel(entry.kind)}</td>
      <td>${yen(entry.amount)}</td>
      <td>${entry.payer}</td>
      <td>${entry.bearer}</td>
      <td>${entry.category}</td>
      <td>${entry.memo || ""}</td>
      <td><button class="delete" type="button" data-id="${entry.id}">削除</button></td>
    </tr>`)
    .join("");
}

function renderPreview() {
  aiFields.previewRows.innerHTML = previewEntries
    .map((entry) => `<tr>
      <td>${entry.date}</td>
      <td>${sourceLabel(entry.source)}</td>
      <td>${kindLabel(entry.kind)}</td>
      <td>${yen(entry.amount)}</td>
      <td>${entry.payer}</td>
      <td>${entry.bearer}</td>
      <td>${entry.category}</td>
      <td>${entry.memo || ""}</td>
      <td>${entry.status}</td>
    </tr>`)
    .join("");
}

function exportCsv() {
  const header = ["date", "source", "kind", "amount", "payer", "bearer", "category", "memo", "status"];
  const lines = [
    header.join(","),
    ...entries.map((entry) =>
      header.map((key) => csvEscape(key === "source" ? sourceLabel(entry[key]) : key === "kind" ? kindLabel(entry[key]) : entry[key])).join(",")
    )
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "kakeibo-from-2026-05.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function saveApiKey() {
  localStorage.setItem(API_KEY_STORAGE_KEY, aiFields.apiKey.value.trim());
  setAiStatus("APIキーをこのブラウザに保存しました。");
}

function setAiStatus(message) {
  aiFields.status.textContent = message;
}

async function classifyWithAi() {
  const apiKey = aiFields.apiKey.value.trim();
  const text = aiFields.bulkText.value.trim();
  if (!apiKey) {
    setAiStatus("OpenAI APIキーを入力してください。");
    return;
  }
  if (!text) {
    setAiStatus("分類したいテキストやCSVを貼ってください。");
    return;
  }

  setAiStatus("LLMで分類中です...");
  document.getElementById("aiImportBtn").disabled = true;
  try {
    const result = await callOpenAiClassifier({
      apiKey,
      model: aiFields.model.value.trim() || "gpt-4o-mini",
      month: aiFields.bulkMonth.value || START_MONTH,
      bulkType: aiFields.bulkType.value,
      text
    });
    previewEntries = result.entries.map(normalizeAiEntry).filter(Boolean);
    renderPreview();
    setAiStatus(`${previewEntries.length}件の候補を作りました。内容を見てから「候補を取り込む」を押してください。`);
  } catch (error) {
    setAiStatus(`分類に失敗しました: ${error.message}`);
  } finally {
    document.getElementById("aiImportBtn").disabled = false;
  }
}

async function callOpenAiClassifier({ apiKey, model, month, bulkType, text }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
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
          schema: {
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
          }
        }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI API error ${response.status}`);
  }
  const outputText = data.output
    ?.flatMap((item) => item.content || [])
    .find((content) => content.type === "output_text")?.text;
  if (!outputText) throw new Error("JSON出力を取得できませんでした。");
  return JSON.parse(outputText);
}

function normalizeAiEntry(entry) {
  const date = String(entry.date || `${aiFields.bulkMonth.value || START_MONTH}-01`);
  const normalized = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    date: date < "2026-05-01" ? `${aiFields.bulkMonth.value || START_MONTH}-01` : date,
    source: normalizeChoice(entry.source, ["receipt", "epos", "bank", "manual"], "manual"),
    kind: normalizeChoice(entry.kind, ["expense", "income", "transfer"], "expense"),
    amount: Number(entry.amount || 0),
    payer: normalizeChoice(entry.payer, ["美樹", "穂波", "家族口座", "穂波個人口座", "その他"], "その他"),
    bearer: normalizeChoice(entry.bearer, ["家族", "穂波", "美樹", "口座移動", "要確認"], "要確認"),
    category: normalizeChoice(entry.category, ["食費", "外食", "日用品", "子ども", "医療", "仕事", "家賃/固定費", "臨時出費", "臨時収入", "送金/ATM", "その他"], "その他"),
    memo: String(entry.memo || ""),
    status: normalizeChoice(entry.status, ["OK", "要確認"], "要確認")
  };
  if (!normalized.amount) return null;
  return normalized;
}

function normalizeChoice(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function importPreview() {
  if (!previewEntries.length) {
    setAiStatus("取り込む候補がありません。");
    return;
  }
  entries = [...entries, ...previewEntries];
  previewEntries = [];
  saveEntries();
  setAiStatus("候補を家計簿に取り込みました。");
  render();
}

function clearPreview() {
  previewEntries = [];
  renderPreview();
  setAiStatus("候補をクリアしました。");
}

function clearAll() {
  if (!confirm("このブラウザに保存した家計簿データをすべて削除します。")) return;
  entries = [];
  saveEntries();
  render();
}

function syncKindDefaults() {
  if (fields.kind.value === "income") {
    fields.bearer.value = "家族";
    fields.category.value = "臨時収入";
  }
  if (fields.kind.value === "transfer") {
    fields.bearer.value = "口座移動";
    fields.category.value = "送金/ATM";
    fields.status.value = "要確認";
  }
}

fields.date.value = todayValue();
if (monthOf(fields.date.value) > START_MONTH) monthFilter.value = monthOf(fields.date.value);
aiFields.bulkMonth.value = monthFilter.value;
aiFields.apiKey.value = localStorage.getItem(API_KEY_STORAGE_KEY) || "";

form.addEventListener("submit", addEntry);
monthFilter.addEventListener("change", () => {
  aiFields.bulkMonth.value = monthFilter.value;
  render();
});
fields.kind.addEventListener("change", syncKindDefaults);
document.getElementById("exportBtn").addEventListener("click", exportCsv);
document.getElementById("clearBtn").addEventListener("click", clearAll);
document.getElementById("saveKeyBtn").addEventListener("click", saveApiKey);
document.getElementById("aiImportBtn").addEventListener("click", classifyWithAi);
document.getElementById("importPreviewBtn").addEventListener("click", importPreview);
document.getElementById("clearPreviewBtn").addEventListener("click", clearPreview);
document.getElementById("rows").addEventListener("click", (event) => {
  if (event.target.matches(".delete")) deleteEntry(event.target.dataset.id);
});

render();
