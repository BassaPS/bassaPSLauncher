# BASSAPS Launcher UI/UX 実装記録

対象はユーザー指定により、指示書のWebサイトから既存Windowsランチャーへ読み替えています。register.bassaps.comの別リポジトリは変更していません。

## 調査と維持した構成

- Go / Wails v3、React 19、TypeScript 6、Vite 8、Tailwind CSS 4、DaisyUI 5。npm / package-lock.json。
- 既存のMotion、Lucide、Zustandを再利用。Next.jsなどへの移行は行っていません。
- TanStack Routerの `/`、`/news`、`/howto`、`/language`、`/diff`、`/analysis`、`/srtools`、`/about`、`/console` を維持。
- ホームはゲーム起動・接続設定、ニュースは配信済み情報、ガイド・分析・言語・差分は既存ツール、コンソールは管理者専用、Aboutはクレジット。
- Webサイト用のCloudflare Pages設定は対象外。WailsはViteのdistを実行ファイルへ埋め込みます。
- 既存のゲーム起動・更新、UID認証、ブラウザーデバイス認証、登録サイトのURL、Goの管理者認可、接続先・ゲームパスの保存形式は変更していません。
- 自己更新先未設定時の停止も維持しています。

## 採用した公式コンポーネント

公式レジストリJSONを取得し、全ソースと依存を確認して手動導入しました。既存プロジェクトにshadcn設定がないため、CLIのinitによるテーマ・既存CSSの上書きを避けています。

| コンポーネント | 公式取得元 | 使用箇所・調整 |
|---|---|---|
| Bento Grid | https://magicui.design/r/bento-grid.json | ホームのゲーム・接続情報。Grid部分のみを抽出し、固定高さを廃止。未使用のBentoCard・別ボタンシステム・Radix Iconsは導入していません。 |
| Magic Card | https://magicui.design/r/magic-card.json | ホームのゲームカード。gradientモードを小さなハイライトへ調整。next-themes・orb演出・全体イベントは不採用。テーマのCSS変数と既存Motion値を利用し、ポインター移動でReact再レンダリングを発生させません。 |
| Blur Fade | https://magicui.design/r/blur-fade.json | ルート初期表示。280ms、位置移動なし、blur 2px。OSのreduced-motion時は初期状態を表示済みにし、アニメーションを停止。 |
| Split Showcase | https://www.obsidianui.dev/r/split-showcase.json | ホーム下部の既存ガイドと登録サイト導線。デモスポンサー・ロゴ・外部追跡URLを除去。縦積み対応、ホバー移動は2pxへ抑制。 |

通常ボタンの拡大・回転演出を削除。Border Beam、Shimmer Button、Grid Pattern、Text Animateは、機能画面に不要な装飾となるため不採用。Hover ImageとArt Galleryは新たに紹介するプロジェクト画像がないため不採用。Marqueeは実績紹介がないため不採用。管理画面用Dashboard Shellを一般ユーザーの画面へ追加していません。

Magic UIとObsidianUIのMIT全文をpublic/licensesに保持し、既存Cyreneの著作権・MITとともにアプリ内のライセンスダイアログにも掲載しています。

## デザイン基盤と動作

- `styles/tokens.css`：ライト／ダークの色、8pxベースの余白、文字サイズ・行間、14pxのカード角丸を集約。
- `themeStore.ts`：UIテーマだけを専用キー `bassaps-ui-preferences` で保存。既存 `setting-storage` を移行せず保持。
- `useTheme.ts`：ライト／ダーク／OS連動。初回HTMLでも同じ保存値を読み、テーマ適用のちらつきを抑制。
- 狭幅ではネイティブdialogのメニューへ切り替え。幅320px以上のレイアウトに対応。Wailsのリサイズを有効化、最小幅320px／最小高さ560px。
- 設定・終了確認・更新・背景選択は共通ModalFrame。Escape、Tab境界のフォーカス循環、閉じた後の操作元へのフォーカス復帰を実装。
- 一般ユーザーの管理者コンソール拒否は維持。UIテストの管理者・ユーザー情報はテスト用Wails応答のみで、本番には組み込んでいません。

## 画像と性能

標準カバーの元JPEGは2,177,144 bytesです。既存背景選択の名前と元ファイルを残し、ホームの標準画像だけsrcSetで640px WebP（41,298 bytes）または1200px WebP（97,990 bytes）を使用します。1200px版は転送量を約95.5%削減。width/height、優先読み込み、WebP失敗時のJPEGへのフォールバックを設定しました。

再生成：`node frontend/scripts/optimize-cover.mjs`。既存の開発用Playwrightでローカル変換するため、画像処理用の実行時依存はありません。

Core Web Vitalsの数値は実測していません。Wails/WebView2を対象とするため、本番ゲーム環境のLCP/INP/CLSをブラウザーのモック試験から保証することはできません。

## 追加依存

- `clsx ^2.1.1`：公式ソースのクラス結合。
- `tailwind-merge ^3.7.0`：公式ソースのTailwindクラス競合解決。
- 開発専用 `@playwright/test ^1.65.0`：テーマ・ルート・狭幅・キーボード動作の回帰試験と画像生成。
- Motion、Lucideは既存依存を再利用。next-themes、Radix、別ルーターは追加していません。

## 検証コマンド

```powershell
npm.cmd ci --prefix frontend
npm.cmd run typecheck --prefix frontend
npm.cmd run lint --prefix frontend
npm.cmd run build --prefix frontend
# 初回にブラウザーがない場合：cd frontend; npx.cmd playwright install chromium
npm.cmd run test:ui --prefix frontend
go test ./...
```

UI試験はWails HTTP境界だけをテスト用に応答し、実アカウントの作成やゲームサーバーへの通信は行いません。320／768／1280／1920pxのライト・ダーク、テーマ保存、既存全ルートのモバイル表示、一般ユーザーの拒否、reduced-motion、ログイン前のライセンス、設定・終了ダイアログのフォーカス、画像失敗時のフォールバックを確認します。スクリーンショット・traceはgitignore対象です。

既存のLint設定がなかったためflat configを追加。既存の条件付きHook呼び出しを設定・終了確認コンポーネントで修正しました。型チェックは既存のtsc設定を維持しています。

実際のゲーム起動・サーバー接続・ログイン承認は、このUI検証では未実施です。Windows WebView2固有の表示、実タッチ端末の確認、WCAG全項目の監査、Lighthouse測定は未対応です。

## この作業の変更ファイル

- `.gitignore`、`main.go`、`README.md`、`docs/ui-implementation.md`
- `frontend/index.html`、`package.json`、`package-lock.json`、`eslint.config.js`、`playwright.config.ts`
- `frontend/public/bg-17-{640,1200}.webp`、`public/licenses/{MagicUI,ObsidianUI}.txt`
- `frontend/src/styles/{index,tokens}.css`
- `frontend/src/components/{header,accountButton,loginGate,footer,backgroudModal,settingModal,closeModal,updateModal}/index.tsx`
- `frontend/src/components/{themeSelect,modalFrame}/index.tsx`
- `frontend/src/components/ui/magic/{bento-grid,magic-card,blur-fade}.tsx`
- `frontend/src/components/ui/obsidian/split-showcase.tsx`
- `frontend/src/lib/utils.ts`、`hooks/useTheme.ts`、`stores/themeStore.ts`
- `frontend/src/pages/launcher/index.tsx`、`routes/__root.tsx`
- `frontend/e2e/ui.spec.ts`、`frontend/scripts/optimize-cover.mjs`

以前の作業による他の差分は維持しています。既存の未コミット変更を巻き戻す操作はしていません。

## 最終検証結果

- TypeScript `tsc --noEmit`：成功。
- ESLint：エラー・警告なし。
- Vite Production Build：成功（JS 743.05kB、gzip 222.98kB）。既存Motionの再利用と画像軽量化を優先しており、JS全体の分割は別途検討の余地があります。
- Playwright：13件成功。実行時のWails応答はモックです。
- Go `go test ./...`：成功。
- Windows x64 productionビルド：`bin/BASSAPSLauncher.exe`。通常のランチャーと同じ操作で起動できます。
- 静的差分の空白検査：成功。
