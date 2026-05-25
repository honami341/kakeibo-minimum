# 5月からのシンプル家計簿

2026年5月から使うための、GitHub Pagesだけで動く家計簿ページです。

公開URL:

https://honami341.github.io/kakeibo-minimum/

## 入力場所

画面の `入力する` に1件ずつ入れます。

### レシート/LINE

現金払い、レシート撮影、LINEで残した支出。

例:

- スーパー
- 外食
- 日用品
- 子ども用品

### エポス

エポスカードで払ったもの。

例:

- スーパー
- Amazon
- LMSなどの仕事費

### 口座

家族口座や個人口座の入出金。

例:

- 家賃
- 水道光熱費
- ATM入金
- 穂波から家族口座への送金
- 家族口座から美樹/穂波への精算

口座間の移動は `種類=口座移動` にします。

### 臨時

あとから手で足したいもの。

例:

- 臨時出費
- 臨時収入
- 医療費
- お祝い金
- 返金

## 最終負担/意味

- `家族`: 家族費
- `穂波`: 穂波個人、穂波仕事費
- `美樹`: 美樹個人
- `口座移動`: 支出ではなくお金の移動
- `要確認`: 後で確認

## 使い方

### 1件ずつ入力する場合

1. 日付、入力元、種類、金額を入れる
2. 払った人/口座を選ぶ
3. 最終負担/意味を選ぶ
4. メモを書く
5. 迷ったら `要確認` にする
6. 月末に `確認すること` を見て意味づけする
7. 必要なら `保存用CSV` を出力する

### LLMで一括入力する場合

1. `Worker URL` にCloudflare WorkersのURLを入れる
2. `取り込み種類` を選ぶ
3. `対象月` を選ぶ
4. 1か月分のレシートテキスト、エポス明細、口座明細を貼る
5. `LLMで分類` を押す
6. 候補一覧を確認する
7. よければ `候補を取り込む` を押す

LLM分類は補助です。金額、負担者、口座移動の意味は必ず確認してください。

入力データはGitHubには自動保存されません。ブラウザの中に保存されます。

## LLM一括入力で貼る例

### レシート1か月分

```text
2026/05/01 スーパー 1,280円
2026/05/02 ドラッグストア 2,430円
2026/05/03 外食 4,800円
```

### エポス明細

```csv
利用日,利用先,金額
2026/05/04,スーパー,8500
2026/05/10,LMS,46200
```

### 口座明細

```csv
日付,摘要,入金,出金
2026/05/25,家賃,,80000
2026/05/28,穂波から振込,100000,
2026/05/30,ATM入金,50000,
```

ATM入金や送金は `要確認` として残し、あとで意味づけします。

## APIキーについて

このページはGitHub Pagesの静的ページです。OpenAI APIキーはGitHub Pagesには置きません。

OpenAI APIキーはCloudflare Workersのsecretとして保存し、GitHub PagesはWorker URLだけを呼びます。

OpenAI APIはStructured OutputsでJSON形式に固定しています。対応モデルとして `gpt-4o-mini` などが使えます。

## Cloudflare Workers設定

Workerは `worker/` に入っています。

初回だけCloudflareにログインします。

```powershell
npx wrangler login
```

OpenAI APIキーをCloudflare Workersのsecretに保存します。

```powershell
cd worker
npx wrangler secret put OPENAI_API_KEY
```

Workerを公開します。

```powershell
npx wrangler deploy
```

表示されたURLを、家計簿ページの `Worker URL` に入れて `URL保存` を押します。

例:

```text
https://kakeibo-ai-import.honami-kakeibo.workers.dev
```

動作確認:

```text
https://kakeibo-ai-import.honami-kakeibo.workers.dev/health
```

`{"ok":true}` が返ればWorkerは動いています。
