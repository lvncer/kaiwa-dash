# セットアップガイド - Kaiwa Dash

このドキュメントでは、Kaiwa Dash の開発環境を構築するための詳細な手順を説明します。

## 前提条件

### 必要なソフトウェア

| ソフトウェア | バージョン  | 説明                               |
| ------------ | ----------- | ---------------------------------- |
| Node.js      | 18.0.0 以上 | JavaScript ランタイム              |
| Bun          | 1.0.0 以上  | パッケージマネージャー・ランタイム |
| Git          | 2.0.0 以上  | バージョン管理                     |

### 推奨環境

- **OS**: macOS, Linux, Windows
- **メモリ**: 8GB 以上
- **ストレージ**: 2GB 以上の空き容量

## OpenAI API Key の取得

1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. アカウントを作成またはログイン
3. API Keys ページに移動
4. 「Create new secret key」をクリック
5. キー名を入力（例: `kaiwa-dash-dev`）
6. 生成された API キーをコピー（**重要**: このキーは再表示されません）

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd kaiwa-dash
```

### 2. 依存関係のインストール

```bash
# Bunを使用して依存関係をインストール
bun install

# または、npmを使用する場合
npm install
```

### 3. 環境変数の設定

```bash
# 環境変数ファイルをコピー
cp .env.example .env.local
```

`.env.local`ファイルを編集し、以下の内容を設定：

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# 開発環境設定
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 開発サーバーの起動

```bash
# Bunを使用する場合
bun dev

# npmを使用する場合
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてアプリケーションが正常に動作することを確認してください。

## トラブルシューティング

### よくある問題と解決方法

#### 1. OpenAI API Key エラー

**エラー**: `OpenAI API key is not configured`

**解決方法**:

- `.env.local`ファイルに`OPENAI_API_KEY`が正しく設定されているか確認
- API キーに余分なスペースや改行が含まれていないか確認
- OpenAI アカウントに十分なクレジットがあるか確認

#### 2. 依存関係のインストールエラー

**エラー**: `Failed to install dependencies`

**解決方法**:

```bash
# キャッシュをクリア
bun pm cache rm
# または
npm cache clean --force

# node_modulesを削除して再インストール
rm -rf node_modules
bun install
```

#### 3. ポートが使用中

**エラー**: `Port 3000 is already in use`

**解決方法**:

```bash
# 別のポートで起動
bun dev --port 3001
# または
npm run dev -- --port 3001
```

#### 4. TypeScript エラー

**エラー**: TypeScript の型エラー

**解決方法**:

```bash
# 型チェックを実行
bun run type-check
# または
npx tsc --noEmit
```

## 🏗️ ビルドとデプロイ

### ローカルビルド

```bash
# プロダクションビルド
bun build

# ビルド結果を確認
bun start
```

### Vercel へのデプロイ

1. [Vercel](https://vercel.com/)にアカウントを作成
2. GitHub リポジトリを連携
3. 環境変数を設定：
   - `OPENAI_API_KEY`: OpenAI API キー
   - `NODE_ENV`: `production`
4. デプロイを実行

```bash
# Vercel CLIを使用する場合
npx vercel --prod
```

## テストの実行（未実装）

### 単体テスト

```bash
# Vitestでテストを実行
bun test

# ウォッチモードでテスト
bun test --watch
```

### E2E テスト

```bash
# PlaywrightでE2Eテストを実行
bun test:e2e

# UIモードでテスト
bun test:e2e:ui
```

## 📊 開発ツール

### リントとフォーマット

```bash
# リント実行
bun lint

# 自動修正
bun lint --fix

# コードフォーマット
bun format
```

### 型チェック

```bash
# TypeScriptの型チェック
bun type-check
```

## 🔍 デバッグ

### 開発者ツール

- **ブラウザ**: Chrome DevTools、Firefox Developer Tools
- **React**: React Developer Tools
- **Next.js**: Next.js DevTools

### ログの確認

```bash
# 詳細なログを表示
DEBUG=* bun dev

# 特定のモジュールのログ
DEBUG=next:* bun dev
```

## 📝 開発のベストプラクティス

### コードスタイル

- ESLint と Prettier の設定に従う
- TypeScript の型定義を適切に使用
- コンポーネントは小さく、再利用可能に設計

### Git ワークフロー

```bash
# 機能ブランチを作成
git checkout -b feature/new-feature

# 変更をコミット
git add .
git commit -m "feat: add new feature"

# プッシュ
git push origin feature/new-feature
```

### 環境の分離

- **開発環境**: `localhost:3000`
- **ステージング環境**: Vercel Preview
- **本番環境**: Vercel Production

## 🆘 サポート

問題が解決しない場合は、以下の情報を含めて Issue を作成してください：

- OS とバージョン
- Node.js と Bun のバージョン
- エラーメッセージの全文
- 実行したコマンド
- 期待される動作と実際の動作
