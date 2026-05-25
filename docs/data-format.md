# データ形式

このアプリはCSVをブラウザ内で読み取り、月別に統合します。

## status

- `approved`: 集計対象
- `pending`: 質問リスト対象
- `excluded`: 集計対象外
- `settled`: 承認済み、精算済み

## bearer

- `family`: 家族が負担
- `honami`: 穂波が負担
- `miki`: 美樹が負担
- `unknown`: 未確定

## type

- `expense`: 支出
- `income`: 収入
- `transfer`: 口座間移動、ATM入金、精算送金など
- `advance`: 家族口座などが誰かの費用を肩代わりした記録

`transfer` は支出合計には入れません。意味づけだけ確認します。
`advance` も支出合計には入れず、精算候補の計算に使います。
