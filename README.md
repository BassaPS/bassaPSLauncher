# BASSAPS Launcher

Cyrene Launcherをベースにした、Go / Wails v3 / React製のゲームランチャーです。
ゲーム選択・起動、プロキシ、ローカルサーバー、パッチ、更新、リモートコンソールの既存処理を利用しています。

## UIと接続先

- ダークテーマ、ミントのアクセント、常設サイドバーを採用。
- ゲームとコンソールの標準接続先: `https://hsr.bassaps.com`。
- Webアカウント・ニュースの接続先も同一ホスト。
- ローカル環境・カスタム接続先と既存の保存設定は維持。
- 一般ユーザー向け登録画面は、ブラウザーで `https://hsr.bassaps.com/register` を開きます。パスワードをランチャーに保存しません。

## アカウントサーバーとの連携条件

追加実装: 隣接する `regiister` プロジェクトがM7H標準の登録・プレイヤーログインを使うポータルAPIを提供します。WebBaseURLは `https://register.bassaps.com` に変更済み。ゲーム接続先は従来どおりです。ポータル側のHTTPS経路・D1・Secretsを設定して有効化し、このLauncherを再ビルドしてください。ログイン承認にはゲームUIDと同じパスワードを使用します。以下は当初の契約の記録です。実運用手順はポータルREADMEを参照してください。

このリポジトリにはアカウントサーバーは含まれていません。実運用では以下をBASSAPS側で提供してください。

- `GET /register`: 一般ユーザー登録ページ。登録時のロールはサーバー側で一般ユーザーに固定。
- 既存のデバイス認証API: `POST /api/launcher/device/code`、`POST /api/launcher/device/token`。
- `GET /api/launcher/me`: Bearerトークンを検証し、`{"user":{"id":"...","name":"...","image":"...","role":"user"}}` を返す。管理者のみ `role: "admin"`。
- `POST /api/launcher/heartbeat`、`POST /api/launcher/logout`。
- ニュース: `GET /api/launcher/news`。

登録ページと認証APIが実際に存在するかは、この変更では未確認です。登録完了後はランチャーに戻り、既存のブラウザーデバイス認証でログインします。

## 管理者コンソール

ナビゲーションとコンソール画面は `role === "admin"` の利用者に限定します。直接ルートを開いても一般ユーザーには拒否画面を表示し、ログアウトするとコンソール状態を破棄します。

Goの `Execute` と `SelfReset` も、毎回アカウントサーバーへロールを再照会します。未ログイン、一般ユーザー、認証APIへの接続失敗ではゲームサーバーにリクエストを送りません。既存のUID・パスワードによるゲームサーバー認証はそのまま使用します。

配布されたデスクトップクライアント自体は改変可能です。ゲームサーバーの `/console/*` でも必ず管理者認可を実施してください。ランチャーの制御だけで外部からの直接HTTPアクセスを禁止することはできません。

## 開発と検証（Windows）

Go 1.26.1、Node.js（Vite 8対応版）、Wails v3が必要です。

```powershell
cd frontend
npm.cmd ci
npm.cmd run build
cd ..
go test ./...
wails3 dev
# 配布用ビルド
wails3 build
```

認可テストは一般ユーザー・未認証時の送信拒否、管理者の実行、HTTPエラー拒否、管理者の降格・オフライン時の拒否を検証します。

手動確認:
1. 保存設定なしで起動し、標準接続先がBASSAPSになっていることを確認。
2. 登録画面からブラウザーの登録ページへ進み、登録後にデバイス認証でログイン。
3. 一般ユーザーとゲストで `/console` を直接開き、拒否されることを確認。
4. 管理者でUID・パスワード接続、コマンド実行、確認ダイアログ付きリセットを確認。
5. Web側で管理者ロールを剥奪し、次のコンソール操作が拒否されることを確認。
6. Star Rail / Genshinの既存ゲーム選択・起動・更新を実機で確認。

ランチャーの自己更新は、BASSAPS専用の配布先が未設定のため無効です。上流Cyreneの実行ファイルで上書きされることを防ぐため、確認処理・更新実行処理の両方で停止しています。有効にする場合は `pkg/constant/constant.go` の `LauncherGitUrl` をBASSAPS専用のリリースURLに設定し、配布するファイル名を `LauncherFile` に合わせてください。ゲーム・ローカルサーバーの更新処理は引き続き利用できます。

## Credits / License

Cyrene Launcher / Mar7thDev、原作者 AzenKain、および既存の貢献者に感謝します。
MIT License。詳細は [LICENSE](LICENSE) を参照してください。

## クレジットとUIの参考

アプリのサイドバーとログイン画面から、Cyrene Launcherのクレジット、元リポジトリ、MITライセンス全文を確認できます。「このアプリについて」画面にも全文を掲載し、ライセンスは実行ファイルに埋め込んでいます。配布フォルダーの `LICENSE` も保持してください。

- 元プロジェクト: https://github.com/Mar7thDev/CyreneLauncher
- 著作権表記: Copyright (c) 2025 Firefly Shelter
- ナビゲーションの参考: [ObsidianUI Dashboard Shell](https://www.obsidianui.dev/docs/dashboard-shell)。ホームではMagic UIとObsidianUIの公式コンポーネントを調整して利用しています。両ライブラリのMIT全文もライセンスダイアログと配布フォルダーの `licenses/` に含めています。

## UI/UX拡張（ランチャー版）

Magic UI / ObsidianUIの公式レジストリから必要なソースを取り込み、ライト・ダーク・OS連動テーマ、狭幅メニュー、キーボード対応ダイアログ、最適化カバー画像を追加しました。変更ファイル、採用コンポーネント、依存、検証、未対応項目は [実装記録](docs/ui-implementation.md) を参照してください。

## Windowsのゲーム起動エラー740（requires elevation）

ゲーム側が管理者権限を要求すると、通常権限のCreateProcessでは起動できません。Star Railでは一時停止起動→フック読込→再開が必要なので、ゲームだけをShellExecuteで開く方式には変更していません。

ランチャーのmainで最初にWindowsトークンを確認し、非昇格なら同じランチャーを `runas` で再起動します。作業フォルダーと起動引数を保持し、プロキシ・ローカルサービスを作る前に旧プロセスを終了します。UACをキャンセルした場合は起動せず終了します。昇格が成立しない場合の再起動ループも防止します。Webアカウントの管理者ロールやコンソール認可とは別のWindows権限制御です。

修正版の `bin/BASSAPSLauncher.exe` を開き直し、表示されたUACを許可してからゲームを起動してください。

ビルドスクリプトとTaskfileの出力名は `BASSAPSLauncher.exe` に統一し、`scripts/verify-windows-build.mjs` が実行ファイルのPEリソースから管理者権限の要求設定を検査します。`go test ./...` では昇格済み・未昇格・UACキャンセル・再起動ループ防止・引数保持を確認しています。実ゲームとUACの対話的な動作は自動テストの対象外です。

## Release用の配布物

Go（go.mod指定版）、Node.js、npm、GitがPATHにあるWindowsで `scripts/build-release.ps1 -RunUiTests` を実行します。初回のみ `cd frontend; npx.cmd playwright install chromium` が必要です。Wails CLIはgo.modで固定したバージョンを使用します。

`bin/release/` に実行ファイル、ライセンス入りZIP、SHA256SUMS.txt、GitHubへ貼り付けるRELEASE_NOTES.mdを生成します。ビルドしたコミットと作業ツリーの変更有無はZIP内のBUILD-INFO.txtに記録されます。ゲーム・サーバー・アカウント・個人設定は含めません。Releaseへのアップロードや公開は別操作です。
