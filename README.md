# Task Manager (タスク管理アプリ)

これは、モダンなWeb開発技術を学ぶためのインターン生向けサンプルプロジェクトです。このプロジェクトを通して、実際の開発で使われる様々なツールの使い方を実践的に学ぶことができます。

## 🚀 このプロジェクトで学べること

- **Reactフレームワーク**: Viteを使った高速な開発環境
- **ファイルベースルーティング**: TanStack Routerによる直感的なページ管理
- **データ取得**: TanStack Queryを使ったモダンな非同期データ管理
- **データベース**: Drizzle ORM (ORM) とPostgreSQLによるデータベース操作
- **認証**: Better Authを使ったログイン機能の実装
- **UIコンポーネント**: Storybookを使ったコンポーネントのカタログ化とテスト
- **スタイリング**: Tailwind CSSによる効率的なUIデザイン
- **型安全なコード**: TypeScriptとZodによる堅牢なプログラミング

## 🛠️ 主な使用技術

<p align="center">
  <a href="https://vitejs.dev/" target="_blank"><img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff" alt="Vite"></a>
  <a href="https://react.dev/" target="_blank"><img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000" alt="React"></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff" alt="TypeScript"></a>
  <a href="https://tanstack.com/router" target="_blank"><img src="https://img.shields.io/badge/TanStack_Router-EF4444?logo=react-router&logoColor=fff" alt="TanStack Router"></a>
  <a href="https://tanstack.com/query" target="_blank"><img src="https://img.shields.io/badge/TanStack_Query-FF4154?logo=react-query&logoColor=fff" alt="TanStack Query"></a>
  <a href="https://orm.drizzle.team/" target="_blank"><img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?logo=postgresql&logoColor=000" alt="Drizzle ORM"></a>
  <a href="https://www.postgresql.org/" target="_blank"><img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=fff" alt="PostgreSQL"></a>
  <a href="https://tailwindcss.com/" target="_blank"><img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=fff" alt="Tailwind CSS"></a>
  <a href="https://storybook.js.org/" target="_blank"><img src="https://img.shields.io/badge/Storybook-FF4785?logo=storybook&logoColor=fff" alt="Storybook"></a>
</p>

## 📂 ディレクトリ構成

プロジェクトの主要なディレクトリと、その役割です。

```
/
├── public/              # faviconなど、ビルド時にコピーされる静的ファイル
├── src/
│   ├── components/      # アプリケーションで使われるUIコンポーネント
│   ├── db/              # Drizzle ORMのスキーマ定義や設定
│   ├── features/        # ログインなど、機能ごとのAPIロジック
│   ├── lib/             # 認証や外部ライブラリの共通設定
│   ├── middleware/      # ルーティングに適用するミドルウェア
│   ├── routes/          # TanStack Routerによるルーティング定義 (各ページの実態)
│   ├── router.tsx       # ルーターのエントリーポイント
│   └── styles.css       # グローバルなCSSスタイル
├── .env.local           # (自分で作成) 環境変数を定義するファイル
├── drizzle.config.ts    # Drizzle ORMの設定ファイル
├── package.json         # プロジェクトの依存関係やスクリプトを定義
└── vite.config.ts       # Viteの設定ファイル
```

## ▶️ セットアップと実行方法

### 1. 前提条件

- [Node.js](https://nodejs.org/) (v20以上を推奨)
- [pnpm](https://pnpm.io/ja/installation) (パッケージマネージャー)
- [Docker](https://www.docker.com/products/docker-desktop/) (PostgreSQLデータベースを簡単に起動するため)

### 2. プロジェクトのセットアップ

```bash
# 1. プロジェクトに必要な依存関係（ライブラリ）をインストールします。
pnpm install

# 2. 環境変数ファイルを作成します
# .env.local という名前のファイルを作成し、以下の内容をコピーしてください
```

#### `.env.local` ファイルの中身

```env
# 認証用の秘密鍵 (以下のコマンドで自動生成して設定)
BETTER_AUTH_SECRET=""

# データベース接続情報 (Dockerで起動する場合、このままでOK)
DATABASE_URL="postgres://postgres:password@localhost:5432/task-manager"
```

#### 3. 認証用の秘密鍵を生成

ターミナルで以下のコマンドを実行し、生成されたキーを `.env.local` の `BETTER_AUTH_SECRET` に貼り付けます。

```bash
pnpm dlx @better-auth/cli secret
```

### 4. データベースの起動と準備

```bash
# 2. Drizzle ORMのスキーマをデータベースに反映させます
pnpm db:push
```

### 5. 開発サーバーの起動

お疲れ様でした！これで準備は完了です。
以下のコマンドで開発サーバーを起動しましょう。

```bash
pnpm dev
```

ブラウザで `http://localhost:3000` を開くと、アプリケーションが表示されます。

## ✨ 学習のためのヒント

- **まずはUIコンポーネントを触ってみよう！**
  `pnpm storybook` を実行すると、UIコンポーネントの一覧が `http://localhost:6006` で確認できます。どのような部品でアプリが作られているか見てみましょう。
- **データベースの中身を覗いてみよう！**
  `pnpm db:studio` を実行すると、ブラウザ上でデータベースのテーブルやデータを確認できるツールが起動します。
- **コードはどこから読む？**
  `src/routes/` ディレクトリが各ページに対応しています。まずは `_layout/index.tsx` (トップページ) あたりからコードを読んで、どのようにデータを取得し表示しているか追ってみるのがおすすめです。

## ⚙️ コマンド一覧

`package.json` に定義されている主要なコマンドです。

| コマンド         | 説明                                              |
| :--------------- | :------------------------------------------------ |
| `pnpm dev`       | 開発サーバーを起動します                          |
| `pnpm build`     | 本番環境用にプロジェクトをビルドします            |
| `pnpm test`      | Vitestを使ってテストを実行します                  |
| `pnpm lint`      | ESlintでコードの問題点をチェックします            |
| `pnpm format`    | Prettierでコードをフォーマットします              |
| `pnpm check`     | `lint` と `format` を同時に実行し、自動修正します |
| `pnpm db:push`   | `src/db/schema.ts` の内容をDBに反映します         |
| `pnpm db:studio` | Drizzle Studio (DB管理画面) を起動します          |
| `pnpm storybook` | Storybook (UIコンポーネント一覧) を起動します     |
