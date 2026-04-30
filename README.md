# 麻雀DANRAN

麻雀店向けの対戦成績管理Webアプリ。会員登録・対戦記録・ランキング・個人成績を管理できます。

## 機能

- 会員管理（登録・名前編集）
- 対戦記録（2〜4人戦、順位入力）
- 対戦履歴（全期間 / 今月）
- ランキング（累計ポイント順）
- 個人成績（本日 / 月間 / 年間 / 通算）
- 管理者 / 会員の2ロール構成

## 技術スタック

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Hosting**: Vercel

## フォルダ構成

```
.
├── src/                  # Reactソースコード
│   ├── pages/            # 各画面コンポーネント
│   ├── components/       # 共通コンポーネント
│   ├── context/          # AuthContext
│   ├── lib/              # Supabaseクライアント・DB関数
│   └── types.ts
├── public/               # 静的ファイル
├── supabase/
│   └── functions/        # Deno Edge Functions
│       └── create-member/
├── supabase_schema.sql
├── vercel.json
└── .env.example
```

## セットアップ

### 1. 環境変数

`.env.example` をコピーして `.env` を作成し値を設定します。

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. インストール・起動

```bash
npm install
npm run dev
```

### 3. DBセットアップ

Supabaseダッシュボード → SQL Editor で `supabase_schema.sql` を実行。

### 4. Edge Functionデプロイ

```bash
supabase functions deploy create-member
```

## ポイント計算

| 順位 | ポイント |
|------|---------|
| 1着  | +3 pt   |
| 2着  | +1 pt   |
| 3着  |  0 pt   |
| 4着  | -1 pt   |
