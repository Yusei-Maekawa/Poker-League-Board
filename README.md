# Rivalt

Rivalt は、Discord の友達内で行うポーカーの試合結果を記録し、ランキング・個人成績・過去試合を管理する Web アプリです。

## アプリ名について

本アプリの名称は **Rivalt** です。

Rivalt は、以下の言葉を組み合わせた造語です。

- **Rival**：ライバル、競い合う相手
- **Result**：試合結果、リザルト
- **Vault**：記録を保管する場所

ポーカーチェイスなどで遊んだ試合結果を記録し、友達やグループ内でランキングとして共有するアプリであることから、  
「ライバルとのリザルトを保管し、リーグのように楽しむ場所」という意味を込めています。

## コンセプト

**ポーカーリザルトを、仲間とリーグ化する。**

Rivalt は、単に勝敗を記録するだけではなく、順位・ポイント・優勝回数・平均順位などを可視化し、友達内で継続的に楽しめるポーカー成績管理アプリを目指します。

## 概要

ポーカーチェイスなどの既存アプリで遊んだ試合結果を入力すると、ポイント・優勝回数・平均順位・入賞率などを自動集計し、Discord で共有しやすい形で表示します。

## バージョン

現在のソースは **v0.4.0**（`package.json`）。シーズン管理・お知らせ UI 刷新・アクティビティ Hub などを含む。以降は [`docs/roadmap.md`](./docs/roadmap.md) を参照。

## 主な機能

- Google ログイン・新規登録（**1 アカウント = 1 プレイヤー**）
- プロフィール（名前・アイコン・メモ）の編集・**退会**
- 試合結果の入力・**編集・削除**（管理者）、第〇戦番号・開催日時・**CPU 参加者**
- プレイヤー **BAN**（管理者・無効化）
- **シーズン別ランキング**（公式）と **通算成績（参考）** の分離
- シーズンごとの **ポイントルール**（管理者が `/admin/seasons` で設定）
- 個人成績（シーズン / 通算、直近試合、連続入賞など）
- **お知らせ**（ヘッダーから一覧・詳細、未読バッジ・種別）
- **アクティビティ**（参加・試合追加のタイムライン、ヘッダー Hub + ホーム新着告知）
- Discord 共有文生成
- Firebase Security Rules による書き込み制限（要デプロイ）

## 技術構成

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication（Google）
- Cloud Firestore
- Vitest（ユニットテスト）

データの中心は `src/context/AppProvider.tsx`（リアルタイム購読と書き込み API）。構造の地図は [`docs/architecture.md`](./docs/architecture.md)。

## ディレクトリ構造

```
Poker-League-Board/
├── .github/workflows/     # CI（build / test）
├── docs/                    # 設計・テスト・運用ドキュメント
├── public/                  # 静的アセット（favicon 等）
├── src/
│   ├── App.tsx              # ルーティング・スプラッシュ
│   ├── main.tsx             # エントリ（メンテモード分岐）
│   ├── firebase.ts          # Firebase 初期化・Firestore paths
│   ├── index.css            # グローバルスタイル
│   ├── components/          # UI コンポーネント
│   │   ├── home/            # お知らせ Hub・アクティビティ Hub 等
│   │   ├── Layout.tsx       # ヘッダー・フッター・ActivityHubProvider
│   │   ├── Header.tsx
│   │   ├── GameCard.tsx / RankingCard.tsx
│   │   └── …
│   ├── constants/           # アプリ定数（シーズン、pt ルール、CPU 等）
│   ├── config/              # 環境・メンテナンス設定
│   ├── context/
│   │   ├── AppProvider.tsx  # Firestore 購読・認証・CRUD の中心
│   │   └── ActivityHubContext.tsx
│   ├── hooks/               # Context の薄いラッパー + 一部独自購読
│   ├── pages/               # 画面（ルート 1 ファイル ≒ 1 ページ）
│   ├── types/               # 共有 TypeScript 型
│   └── utils/               # 集計・検証・フォーマット等（純関数）
├── tests/
│   ├── utils/               # Vitest ユニットテスト
│   └── helpers/             # テスト用フィクスチャ
├── firebase.json            # Hosting 設定
├── firestore.rules          # Security Rules（.gitignore の場合あり）
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### `src/pages/`（画面）

| ファイル | パス例 |
|----------|--------|
| `HomePage.tsx` | `/` |
| `RankingPage.tsx` | `/ranking` |
| `AllTimeRankingPage.tsx` | `/ranking/all-time` |
| `GamesPage.tsx` / `GameDetailPage.tsx` | `/games`, `/games/:id` |
| `NewGamePage.tsx` / `EditGamePage.tsx` | `/games/new`, `/games/:id/edit` |
| `PlayersPage.tsx` / `PlayerDetailPage.tsx` | `/players`, `/players/:id`, `/players/:id/all-time` |
| `LoginPage.tsx` / `RegisterPage.tsx` / `ProfilePage.tsx` | 認証・登録・プロフィール |
| `AdminAnnouncementsPage.tsx` | `/admin/announcements` |
| `AdminSeasonsPage.tsx` | `/admin/seasons` |
| `MaintenancePage.tsx` | メンテモード時のみ |

### `src/hooks/`

| hook | 役割 |
|------|------|
| `useAuth` | ログイン・管理者・BAN 判定 |
| `usePlayers` / `useGames` / `useResults` | リーグデータ + 書き込み |
| `useSeasons` | シーズン・`activeSeasonId`（独自 onSnapshot） |
| `useAnnouncements` / `useAnnouncementUnread` | お知らせ・既読 |
| `useActivities` | アクティビティ読み取り |
| `useAdmins` | 追加管理者（ブートストラップ時） |
| `useSplash` | 起動スプラッシュ |

### `src/utils/`（主要）

| ファイル | 役割 |
|----------|------|
| `ranking.ts` / `point.ts` | ランキング集計・順位→pt |
| `season.ts` / `seasonPeriod.ts` | シーズン絞り込み・期間・採番シーズン |
| `seasonPointRules.ts` | シーズン別 pt ルール |
| `playerStats.ts` | 個人成績・連続入賞 |
| `allocateGameNo.ts` | 第〇戦番号採番 |
| `discord.ts` / `gameParticipant.ts` | 共有文・参加者表示 |
| `activityFeed.ts` / `announcementRead.ts` | アクティビティ・お知らせ |

### `docs/`（ドキュメント）

| ファイル | 内容 |
|----------|------|
| [`architecture.md`](./docs/architecture.md) | **構造理解用メモ**（画面・hook・データの流れ） |
| [`design.md`](./docs/design.md) / [`design-v0.4.md`](./docs/design-v0.4.md) | 設計・v0.4 仕様 |
| [`design-announcements.md`](./docs/design-announcements.md) | お知らせ |
| [`status.md`](./docs/status.md) | 機能の現状 |
| [`roadmap.md`](./docs/roadmap.md) | 版計画 |
| [`setup.md`](./docs/setup.md) | 環境構築・リーグ ID |
| [`test-cases-v0.4.md`](./docs/test-cases-v0.4.md) | v0.4 手動テスト |
| [`release-v0.4.md`](./docs/release-v0.4.md) | v0.4 リリース・デプロイ |

## セットアップ

1. `.env.example` をコピーして `.env` を作成
2. Firebase の設定値と `VITE_ADMIN_UIDS` を入力
3. 本番データは `VITE_LEAGUE_ID=main`（テストだけ別リーグにしたいときは `dev` など — [`setup.md`](./docs/setup.md) 参照）
4. `npm install`
5. `npm run dev`

### 開発コマンド

| コマンド | 内容 |
|----------|------|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm test` | ユニットテスト（Vitest） |
| `npm run deploy:live` | 本番 Hosting デプロイ |
| `npm run deploy:maintenance` | メンテ画面のみデプロイ |

Firestore Rules はリポジトリ外の場合があるため、変更後は `firebase deploy --only firestore:rules` を忘れずに（[`test-cases-v0.4.md`](./docs/test-cases-v0.4.md) 参照）。

### Hosting の切り替え（メンテナンス / 再開）

| コマンド | 内容 |
|----------|------|
| `npm run deploy:live` | **本番アプリに再開**（通常ビルド + デプロイ） |
| `npm run deploy:maintenance` | メンテ画面のみをデプロイ |

詳細は [メンテナンスと本番の切り替え](./docs/maintenance-deploy.md) を参照。

## 注意事項

Rivalt は、友達内で行うポーカーの試合結果を記録し、ランキングや個人成績を管理するためのアプリです。

本アプリでは、リアルマネー、賭け金、精算金額、賞金、換金可能なポイント、金銭の授受に関する情報は扱いません。

記録するポイントは、アプリ内ランキング用のスコアであり、金銭的価値を持たないものとします。

## ドキュメント

### まず読むとよいもの

- [**アーキテクチャメモ**](./docs/architecture.md) — 画面・hook・Firestore の依存関係
- [機能ステータス](./docs/status.md)
- [セットアップ手順](./docs/setup.md)

### 設計・版

- [要件定義](./docs/requirements.md)
- [設計書](./docs/design.md)
- [v0.4 設計](./docs/design-v0.4.md)
- [お知らせ設計](./docs/design-announcements.md)
- [v0.3 設計](./docs/design-v0.3.md)
- [ロードマップ](./docs/roadmap.md)

### リリース・テスト

- [v0.4 リリースノート](./docs/release-v0.4.md)
- [v0.4 テストケース](./docs/test-cases-v0.4.md)
- [v0.3 リリースノート](./docs/release-v0.3.md)
- [v0.2 / v0.3 / v0.1 テストケース](./docs/test-cases-v0.2.md)

### その他

- [モック要件](./docs/mock.md)
- [メンテナンスと本番の切り替え](./docs/maintenance-deploy.md)
- [v0.2 公開前チェックリスト](./docs/release-checklist-v0.2.md)
- [使用した AI プロンプト](./docs/usedPrompt.md)
