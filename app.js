const STORAGE_KEY = "kakeibo-minimum-v1";

const sampleData = {
  receipt: `month,person,category,amount,memo
2026-01,美樹,食費1 スーパー等,34528,LINE集計
2026-01,美樹,外食,14642,LINE集計
2026-01,美樹,交際,6000,LINE集計
2026-01,美樹,保育園,6000,LINE集計
2026-01,美樹,日用,5911,LINE集計
2026-01,美樹,娯楽,1100,LINE集計
2026-01,穂波,現金支出,37788,穂波現金出費
2026-01,穂波,空手,4000,月謝
2026-02,美樹,食費1 スーパー等,42553,LINE集計
2026-02,美樹,外食,11653,LINE集計
2026-02,美樹,育児,11318,LINE集計
2026-02,美樹,保育園,6000,LINE集計
2026-02,美樹,日用,2841,LINE集計
2026-02,美樹,娯楽,1700,LINE集計
2026-02,穂波,現金支出,35265,穂波現金出費
2026-02,穂波,空手,14500,月謝+年会費+昇級試験
2026-03,美樹,食費1 スーパー等,43507,LINE集計
2026-03,美樹,食費3 まとめ買い,15598,LINE集計
2026-03,美樹,外食,14451,LINE集計
2026-03,美樹,育児,13106,LINE集計
2026-03,美樹,娯楽,7620,LINE集計
2026-03,美樹,交際,3270,LINE集計
2026-03,美樹,日用,2187,LINE集計
2026-03,美樹,保育園,2000,LINE集計
2026-03,美樹,食費4 その他,1425,LINE集計
2026-03,穂波,現金支出,55864,穂波現金出費
2026-03,穂波,空手,4000,月謝
2026-04,美樹,食費1 スーパー等,33126,LINE集計
2026-04,美樹,日用,14174,LINE集計
2026-04,美樹,育児,7120,LINE集計
2026-04,美樹,外食,5270,LINE集計
2026-04,美樹,学童,3800,LINE集計
2026-04,美樹,娯楽,3100,LINE集計
2026-04,美樹,食費4 その他,1706,LINE集計
2026-04,美樹,交際,648,LINE集計
2026-04,穂波,現金支出,40091,穂波現金出費
2026-04,穂波,空手,4000,月謝`,
  epos: `date,month,card_owner,amount,description,category,bearer,status,memo
2026-01-10,2026-01,穂波,46200,LMS,仕事費,honami,approved,家族口座が払った場合はbank側に入れる
2026-02-10,2026-02,穂波,36300,LMS,仕事費,honami,approved,
2026-03-10,2026-03,穂波,38500,LMS,仕事費,honami,approved,
2026-03-18,2026-03,穂波,18150,マハロ,仕事費,honami,approved,
2026-04-10,2026-04,穂波,29700,LMS,仕事費,honami,approved,
2026-04-22,2026-04,美樹,8500,スーパー,家族費,family,pending,家族費でよいか確認`,
  bank: `date,month,account,amount,direction,description,type,meaning,status,memo
2026-01-28,2026-01,family_bank,-46200,out,LMS引落,expense,家族口座が穂波仕事費を肩代わり,approved,
2026-02-28,2026-02,family_bank,-36300,out,LMS引落,expense,家族口座が穂波仕事費を肩代わり,approved,
2026-03-28,2026-03,family_bank,-56650,out,LMS+マハロ引落,expense,家族口座が穂波仕事費を肩代わり,approved,
2026-04-28,2026-04,family_bank,-29700,out,LMS引落,expense,家族口座が穂波仕事費を肩代わり,approved,
2026-04-30,2026-04,family_bank,50000,in,ATM入金,transfer,unknown,pending,誰の現金か確認`,
  temporaryExpenses: `date,month,person,amount,category,bearer,description,status,memo
2026-04-20,2026-04,美樹,12000,医療費,family,子ども病院,approved,臨時出費`,
  temporaryIncome: `date,month,receiver,account,amount,source,meaning,status,memo
2026-04-15,2026-04,family,family_bank,10000,児童手当,家族収入,approved,臨時収入`,
  movementNotes: `date,month,target,meaning,answered_by,memo
2026-04-30,2026-04,ATM入金50000,未確認,未回答,質問リスト対象`
};

const inputs = {
  receipt: document.getElementById("receiptInput"),
  epos: document.getElementById("eposInput"),
  bank: document.getElementById("bankInput"),
  temporaryExpenses: document.getElementById("temporaryExpensesInput"),
  temporaryIncome: document.getElementById("temporaryIncomeInput"),
  movementNotes: document.getElementById("movementNotesInput")
};

function yen(value) {
  return `${Math.round(Number(value || 0)).toLocaleString("ja-JP")}円`;
}

function parseAmount(value) {
  if (value === undefined || value === null) return 0;
  return Number(String(value).replace(/[,\s円]/g, "")) || 0;
}

function parseCsv(text) {
  const rows = [];
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");
  if (!lines.length) return rows;
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] === undefined ? "" : values[index].trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function getData() {
  return Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value]));
}

function setData(data) {
  Object.entries(inputs).forEach(([key, input]) => {
    input.value = data[key] || "";
  });
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    setData(JSON.parse(saved));
  } else {
    setData(sampleData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getData()));
  document.getElementById("summaryStatus").textContent = "保存しました";
}

function normalizeLedger(data) {
  const ledger = [];
  parseCsv(data.receipt).forEach((row, index) => {
    ledger.push({
      id: `receipt-${index + 1}`,
      source: "レシートLINE",
      date: row.month || "",
      month: row.month || "",
      actor: row.person || "",
      payer: row.person || "",
      bearer: familyCategory(row.category) ? "family" : "unknown",
      amount: parseAmount(row.amount),
      category: row.category || "unknown",
      description: row.memo || row.category || "",
      status: "approved",
      type: "expense"
    });
  });

  parseCsv(data.epos).forEach((row, index) => {
    ledger.push({
      id: `epos-${index + 1}`,
      source: "エポス",
      date: row.date || row.month || "",
      month: row.month || monthFromDate(row.date),
      actor: row.card_owner || "",
      payer: row.card_owner || "",
      bearer: row.bearer || "unknown",
      amount: parseAmount(row.amount),
      category: row.category || "unknown",
      description: row.description || "",
      status: row.status || "pending",
      type: "expense",
      memo: row.memo || ""
    });
  });

  parseCsv(data.bank).forEach((row, index) => {
    const amount = parseAmount(row.amount);
    const bankType = normalizeBankType(row.type, row.meaning);
    ledger.push({
      id: `bank-${index + 1}`,
      source: "口座",
      date: row.date || row.month || "",
      month: row.month || monthFromDate(row.date),
      actor: row.account || "",
      payer: row.account || "",
      bearer: bearerFromMeaning(row.meaning),
      amount: Math.abs(amount),
      signedAmount: amount,
      category: bankType,
      description: row.description || "",
      status: row.status || "pending",
      type: bankType,
      direction: row.direction || "",
      meaning: row.meaning || "unknown",
      memo: row.memo || ""
    });
  });

  parseCsv(data.temporaryExpenses).forEach((row, index) => {
    ledger.push({
      id: `temp-expense-${index + 1}`,
      source: "臨時出費",
      date: row.date || row.month || "",
      month: row.month || monthFromDate(row.date),
      actor: row.person || "",
      payer: row.person || "",
      bearer: row.bearer || "unknown",
      amount: parseAmount(row.amount),
      category: row.category || "unknown",
      description: row.description || "",
      status: row.status || "pending",
      type: "expense",
      memo: row.memo || ""
    });
  });

  parseCsv(data.temporaryIncome).forEach((row, index) => {
    ledger.push({
      id: `temp-income-${index + 1}`,
      source: "臨時収入",
      date: row.date || row.month || "",
      month: row.month || monthFromDate(row.date),
      actor: row.receiver || row.account || "",
      payer: row.source || "",
      bearer: row.receiver || "unknown",
      amount: parseAmount(row.amount),
      category: "income",
      description: row.source || "",
      status: row.status || "pending",
      type: "income",
      meaning: row.meaning || "",
      memo: row.memo || ""
    });
  });

  return ledger.filter((row) => row.month);
}

function monthFromDate(date) {
  const match = String(date || "").match(/^(\d{4}-\d{2})/);
  return match ? match[1] : "";
}

function familyCategory(category) {
  return !/仕事|個人/.test(String(category || ""));
}

function normalizeBankType(type, meaning) {
  const original = String(type || "unknown");
  if (/肩代わり/.test(String(meaning || ""))) return "advance";
  return original;
}

function bearerFromMeaning(meaning) {
  const text = String(meaning || "");
  if (/穂波仕事費|honami/.test(text)) return "honami";
  if (/美樹/.test(text)) return "miki";
  if (/家族|児童手当/.test(text)) return "family";
  return "unknown";
}

function uniqueMonths(ledger) {
  return [...new Set(ledger.map((row) => row.month).filter(Boolean))].sort();
}

function updateMonthSelect(ledger) {
  const select = document.getElementById("monthSelect");
  const current = select.value;
  const months = uniqueMonths(ledger);
  select.innerHTML = months.map((month) => `<option value="${month}">${month}</option>`).join("");
  select.value = months.includes(current) ? current : months[months.length - 1] || "";
}

function buildSummary() {
  const data = getData();
  const ledger = normalizeLedger(data);
  updateMonthSelect(ledger);
  const month = document.getElementById("monthSelect").value;
  const rows = ledger.filter((row) => row.month === month && row.status !== "excluded");
  const approvedRows = rows.filter((row) => row.status !== "pending");
  const questions = buildQuestions(rows);
  const summary = calculateSummary(approvedRows, month, questions);
  renderCards(summary);
  renderReport(summary);
  renderQuestions(questions);
  renderLedger(rows);
}

function calculateSummary(rows, month, questions) {
  const totals = {
    receipt: sumBySource(rows, "レシートLINE"),
    epos: sumBySource(rows, "エポス"),
    bankExpense: rows.filter((row) => row.source === "口座" && row.type === "expense").reduce((sum, row) => sum + row.amount, 0),
    temporaryExpense: sumBySource(rows, "臨時出費"),
    temporaryIncome: sumBySource(rows, "臨時収入")
  };
  const familyExpense = rows
    .filter((row) => row.type === "expense" && row.bearer === "family")
    .reduce((sum, row) => sum + row.amount, 0);
  const honamiWorkPaidByFamily = rows
    .filter((row) => row.source === "口座" && row.type === "advance" && row.bearer === "honami" && row.actor === "family_bank")
    .reduce((sum, row) => sum + row.amount, 0);
  const reimburseMiki = rows
    .filter((row) => row.type === "expense" && row.bearer === "family" && /美樹|miki/.test(row.payer))
    .reduce((sum, row) => sum + row.amount, 0);
  const reimburseHonami = rows
    .filter((row) => row.type === "expense" && row.bearer === "family" && /穂波|honami/.test(row.payer))
    .reduce((sum, row) => sum + row.amount, 0);
  const honamiNet = reimburseHonami - honamiWorkPaidByFamily;
  const byCategory = groupSum(rows.filter((row) => row.type === "expense"), "category");
  const byBearer = groupSum(rows.filter((row) => row.type === "expense"), "bearer");
  const transfers = rows.filter((row) => row.type === "transfer" || row.type === "advance");

  return {
    month,
    totals,
    familyExpense,
    honamiWorkPaidByFamily,
    reimburseMiki,
    reimburseHonami,
    honamiNet,
    byCategory,
    byBearer,
    transfers,
    questionCount: questions.length,
    rowCount: rows.length
  };
}

function sumBySource(rows, source) {
  return rows.filter((row) => row.source === source).reduce((sum, row) => sum + row.amount, 0);
}

function groupSum(rows, key) {
  return rows.reduce((map, row) => {
    const name = row[key] || "unknown";
    map[name] = (map[name] || 0) + row.amount;
    return map;
  }, {});
}

function buildQuestions(rows) {
  const questions = [];
  rows.forEach((row) => {
    if (row.status === "pending") {
      questions.push({
        id: row.id,
        title: `${row.source} ${row.date} ${yen(row.amount)}`,
        body: `status=pending です。承認、除外、修正のどれにしますか。内容: ${row.description || row.memo || ""}`
      });
    }
    if (row.bearer === "unknown") {
      questions.push({
        id: `${row.id}-bearer`,
        title: `${row.source} ${row.date} ${yen(row.amount)}`,
        body: `最終負担者が unknown です。family / honami / miki / excluded のどれですか。`
      });
    }
    if (row.source === "口座" && row.type === "transfer" && (!row.meaning || row.meaning === "unknown")) {
      questions.push({
        id: `${row.id}-meaning`,
        title: `口座移動 ${row.date} ${yen(row.amount)}`,
        body: `この金銭移動の意味を確認してください。例: 穂波から家族口座へ生活費、美樹の現金をATM入金、精算済み送金。`
      });
    }
  });
  return questions;
}

function renderCards(summary) {
  const cards = [
    ["家族費", summary.familyExpense],
    ["穂波仕事費 肩代わり", summary.honamiWorkPaidByFamily],
    ["美樹へ返す候補", summary.reimburseMiki],
    ["未確認", `${summary.questionCount}件`]
  ];
  document.getElementById("summaryCards").innerHTML = cards
    .map(([label, value]) => `<article class="card"><p class="card-label">${label}</p><p class="card-value">${typeof value === "number" ? yen(value) : value}</p></article>`)
    .join("");
}

function renderReport(summary) {
  const lines = [];
  lines.push(`# ${summary.month || "未選択"} 月次サマリー`);
  lines.push("");
  lines.push("## 入力元別");
  lines.push(`- レシートLINE: ${yen(summary.totals.receipt)}`);
  lines.push(`- エポス: ${yen(summary.totals.epos)}`);
  lines.push(`- 口座支出: ${yen(summary.totals.bankExpense)}`);
  lines.push(`- 臨時出費: ${yen(summary.totals.temporaryExpense)}`);
  lines.push(`- 臨時収入: ${yen(summary.totals.temporaryIncome)}`);
  lines.push("");
  lines.push("## 負担者別支出");
  objectLines(summary.byBearer).forEach((line) => lines.push(line));
  lines.push("");
  lines.push("## カテゴリ別支出");
  objectLines(summary.byCategory).forEach((line) => lines.push(line));
  lines.push("");
  lines.push("## 精算候補");
  lines.push(`- 家族口座 → 美樹: ${yen(summary.reimburseMiki)}`);
  lines.push(`- 家族口座 → 穂波: ${yen(summary.reimburseHonami)}`);
  lines.push(`- 穂波 → 家族口座: ${yen(summary.honamiWorkPaidByFamily)}`);
  lines.push(`- 穂波差引: ${summary.honamiNet >= 0 ? "家族口座 → 穂波" : "穂波 → 家族口座"} ${yen(Math.abs(summary.honamiNet))}`);
  lines.push("");
  lines.push("## 口座移動");
  if (summary.transfers.length) {
    summary.transfers.forEach((row) => lines.push(`- ${row.date} ${row.actor} ${yen(row.amount)}: ${row.meaning || row.description || "未確認"}`));
  } else {
    lines.push("- 口座移動なし");
  }
  lines.push("");
  lines.push("## 不足データ");
  lines.push(summary.questionCount ? `- 要確認 ${summary.questionCount}件` : "- なし");
  document.getElementById("monthlySummary").textContent = lines.join("\n");
  document.getElementById("summaryStatus").textContent = `対象 ${summary.rowCount}行`;
}

function objectLines(object) {
  const entries = Object.entries(object).sort((a, b) => b[1] - a[1]);
  return entries.length ? entries.map(([key, value]) => `- ${key}: ${yen(value)}`) : ["- なし"];
}

function renderQuestions(questions) {
  const target = document.getElementById("questions");
  if (!questions.length) {
    target.innerHTML = "<p>要確認はありません。</p>";
    return;
  }
  target.innerHTML = `<ul class="question-list">${questions
    .map((question) => `<li class="question"><strong>${question.title}</strong><br>${question.body}</li>`)
    .join("")}</ul>`;
}

function renderLedger(rows) {
  const tbody = document.querySelector("#ledgerTable tbody");
  tbody.innerHTML = rows
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map(
      (row) => `<tr>
        <td>${row.date || row.month}</td>
        <td>${row.source}</td>
        <td>${row.payer || row.actor}</td>
        <td>${row.bearer}</td>
        <td>${yen(row.amount)}</td>
        <td>${row.category}</td>
        <td>${row.description || row.meaning || ""}</td>
        <td class="status-${row.status || "unknown"}">${row.status || "unknown"}</td>
      </tr>`
    )
    .join("");
  document.getElementById("ledgerCount").textContent = `${rows.length}行`;
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadMarkdown() {
  const month = document.getElementById("monthSelect").value || "summary";
  download(`${month}-monthly-summary.md`, document.getElementById("monthlySummary").textContent, "text/markdown;charset=utf-8");
}

function downloadJson() {
  const data = getData();
  const ledger = normalizeLedger(data);
  const month = document.getElementById("monthSelect").value || "summary";
  const payload = {
    exportedAt: new Date().toISOString(),
    month,
    inputs: data,
    ledger: ledger.filter((row) => row.month === month)
  };
  download(`${month}-kakeibo.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}

function clearInputs() {
  if (!confirm("入力欄をすべて空にします。保存済みデータも消しますか？")) return;
  setData({});
  localStorage.removeItem(STORAGE_KEY);
  buildSummary();
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(`tab-${button.dataset.tab}`).classList.add("active");
  });
});

document.getElementById("saveBtn").addEventListener("click", saveData);
document.getElementById("loadSampleBtn").addEventListener("click", () => {
  setData(sampleData);
  buildSummary();
});
document.getElementById("clearBtn").addEventListener("click", clearInputs);
document.getElementById("buildBtn").addEventListener("click", buildSummary);
document.getElementById("monthSelect").addEventListener("change", buildSummary);
document.getElementById("downloadMdBtn").addEventListener("click", downloadMarkdown);
document.getElementById("downloadJsonBtn").addEventListener("click", downloadJson);
Object.values(inputs).forEach((input) => input.addEventListener("input", buildSummary));

loadData();
buildSummary();
