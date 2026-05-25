# 家計簿ミニマム

GitHub Pagesだけで動く、最小構成の家計簿・口座移動サマリーです。

最初から大きな家計簿システムにせず、以下の入力をブラウザ上で統合します。

- レシートを撮影、テキスト化してLINEで記録した月次サマリー
- エポスカード明細
- 口座明細
- 臨時出費
- 臨時収入
- 口座間移動の意味づけメモ

## 使い方

1. `index.html` をブラウザで開く
2. 各タブにCSVを貼る
3. 集計月を選ぶ
4. `サマリー更新` を押す
5. `質問リスト` に出た unknown / pending を確認する
6. 口頭で意味づけを決めたら、該当CSVまたは `口座移動メモ` に反映する
7. 必要なら Markdown / JSON を出力する

入力内容はブラウザの `localStorage` に保存されます。GitHub Pages上で使う場合も、入力データは基本的に自分のブラウザ内に残ります。

## GitHub Pagesで公開する

1. GitHubで新規リポジトリを作る
2. このフォルダの中身をアップロードする
3. リポジトリの `Settings` → `Pages`
4. `Deploy from a branch` を選ぶ
5. `main` / `/root` を選んで保存

## 入力CSV

### レシートLINE

```csv
month,person,category,amount,memo
2026-04,美樹,食費1 スーパー等,33126,LINE集計
2026-04,穂波,空手,4000,月謝
```

### エポス

```csv
date,month,card_owner,amount,description,category,bearer,status,memo
2026-04-22,2026-04,美樹,8500,スーパー,家族費,family,approved,
```

`bearer` は最終負担者です。

- `family`: 家族費
- `honami`: 穂波個人/仕事費
- `miki`: 美樹個人
- `unknown`: 要確認

### 口座

```csv
date,month,account,amount,direction,description,type,meaning,status,memo
2026-04-30,2026-04,family_bank,50000,in,ATM入金,transfer,unknown,pending,誰の現金か確認
```

口座移動は支出ではなく `type=transfer` にします。意味が未確定なら `meaning=unknown` として質問リストに出します。

`meaning` に `肩代わり` が含まれる口座行は、アプリ内では支出ではなく精算用の `advance` として扱います。エポス明細と口座引落を両方入れたときの二重計上を避けるためです。

### 臨時出費

```csv
date,month,person,amount,category,bearer,description,status,memo
2026-04-20,2026-04,美樹,12000,医療費,family,子ども病院,approved,臨時出費
```

### 臨時収入

```csv
date,month,receiver,account,amount,source,meaning,status,memo
2026-04-15,2026-04,family,family_bank,10000,児童手当,家族収入,approved,臨時収入
```

## 運用ルール

- 不明なものは `unknown` または `pending` のままにする
- アプリは不明データを質問リストに出す
- 金額の最終確定、精算済み判定、相殺判断は人間が確認する
- 口座間移動は支出に混ぜない
- ATM入金は必ず誰の現金かメモする
- 臨時出費、臨時収入は手入力で追記する

## 次に足すなら

- CSVファイルのドラッグ&ドロップ
- GitHub上のCSVファイル読み込み
- OpenAI API/OCRでカテゴリ候補を作る
- 月別レポートをリポジトリに保存する運用
