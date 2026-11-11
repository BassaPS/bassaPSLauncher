# BASSAPS Launcher v1.1.2 — Windows x64

Cyrene LauncherをベースにしたBASSAPS向けランチャーです。

- ライト／ダーク／OS連動テーマ、ゲームライブラリ、狭幅ナビゲーションを追加。
- ゲーム起動、更新、言語・差分ツールなど既存機能を維持。
- 標準接続先をhsr.bassaps.com、登録・認証・お知らせをregister.bassaps.comへ設定。
- 管理者コンソールを一般ユーザーから制限し、バックエンドでも権限を再確認。
- 非昇格で起動された場合のUAC再起動を追加し、CreateProcessの権限不足を防止。
- 上流Cyreneの実行ファイルで上書きされないよう、専用配布先が未設定の自己更新を停止。
- Cyrene、Magic UI、ObsidianUIのMITライセンスを保持。

## ダウンロード

通常は `BASSAPSLauncher-1.1.2-windows-x64.zip` を選択し、展開後に `BASSAPSLauncher.exe` を起動してください。SHA-256は `SHA256SUMS.txt` で確認できます。

Windows x64 / WebView2 Runtimeが必要です。ゲーム・サーバー・個人設定は含みません。既存環境はバックアップし、サーバー設定を上書きせず更新してください。Windowsの管理者権限と、Webアカウントの管理者ロールは別です。

## 検証・制限

TypeScript、Lint、フロントエンド本番ビルド、UI回帰テスト13件、Goテスト、PEリソースの管理者権限要求を検証しています。UIテストはテスト専用のWails応答を使用しています。

実ゲーム接続・実アカウントでの承認は未検証です。実行ファイルは未署名です。
