# 補修カウンター

現場の補修箇所をスマートフォンで数え、報告文を自動生成するWebアプリです。

## 主な機能

- 項目別のプラス／マイナスカウンター
- 数量の直接入力
- 項目の追加・編集・削除・並び替え
- 合計と報告文のリアルタイム生成
- 報告文のクリップボードコピー
- ブラウザのローカルストレージへの自動保存

データは利用中の端末とブラウザ内だけに保存されます。外部サーバーやAPIへは送信しません。

## GitHub Pages

`main`ブランチへ変更を反映すると、`.github/workflows/deploy-pages.yml`が静的サイトをビルドし、GitHub Pagesへ自動公開します。

初回のみ、GitHubのリポジトリ画面で `Settings` → `Pages` → `Source` を `GitHub Actions` に設定してください。

## ローカル確認

```bash
npm ci
GITHUB_PAGES=true GITHUB_REPOSITORY=hakumai35/repair-counter npm run build:pages
```

生成された静的サイトは `out/` に出力されます。
