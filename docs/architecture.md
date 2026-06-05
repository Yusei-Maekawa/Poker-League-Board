# Rivalt アーキテクチャメモ

自分が「どの画面が何に依存しているか」を説明するためのメモ。  
完璧な設計書ではなく、**現行コード（v0.4 想定）** に沿った地図。

関連: [`design.md`](./design.md) · [`design-v0.4.md`](./design-v0.4.md) · [`test-cases-v0.4.md`](./test-cases-v0.4.md)

---

## 全体の骨格

```
Firebase Auth (Google)
    ↓ user.uid
AppProvider（単一のデータハブ）
  ├─ onSnapshot: players, games, results, announcements, activities, seasons, config
  ├─ onSnapshot: players/{uid}（自分）
  ├─ onSnapshot: admins/{uid}（追加管理者か）
  └─ 書き込み: registerPlayer, addGameWithResults, お知らせ CRUD, シーズン管理 …
    ↓
hooks（Context を薄く返す）
    ↓
pages + components + utils（表示・集計の加工）
```

**ポイント**

- 画面はほぼ Firestore を直接触らない（`AppProvider` 経由）。
- 例外: `useGameResults(gameId)`（試合詳細用の results 購読）、`useSeasons` / `useAdmins`（独自 onSnapshot）。

**技術スタック:** React + TypeScript + Vite + Firebase Auth + Cloud Firestore

**リーグ切替:** `VITE_LEAGUE_ID`（未設定時 `main`）→ `src/firebase.ts` の `paths` すべてに効く。

---

## 1. ルーティング（`src/App.tsx`）

| パス | ページ | 備考 |
|------|--------|------|
| `/` | `HomePage` | シーズン TOP3・直近試合・新着アクティビティ告知 |
| `/login` | `LoginPage` | |
| `/register` | `RegisterPage` | 一般ユーザーは未登録時ここへ |
| `/profile` | `ProfilePage` | 要ログイン |
| `/ranking` | `RankingPage` | **シーズン**ランキング（公式） |
| `/ranking/all-time` | `AllTimeRankingPage` | **通算**（参考） |
| `/games` | `GamesPage` | |
| `/games/new` | `NewGamePage` | 管理者のみ |
| `/games/:gameId` | `GameDetailPage` | |
| `/games/:gameId/edit` | `EditGamePage` | 管理者のみ |
| `/players` | `PlayersPage` | シーズン別 |
| `/players/:playerId` | `PlayerDetailPage` | シーズン成績 |
| `/players/:playerId/all-time` | `PlayerDetailPage` | 通算（同一コンポーネント） |
| `/admin/announcements` | `AdminAnnouncementsPage` | |
| `/admin/seasons` | `AdminSeasonsPage` | |

`AuthRedirect`: ゲストでも公開パスは閲覧可。管理者はプレイヤー未登録でも試合入力可。

起動: `AppProvider` → スプラッシュ（`useSplash` / `homeDataReady`）→ 上記 Routes。

---

## 2. 主要ディレクトリ

### `pages/`

| ページ | 役割 |
|--------|------|
| `HomePage` | ヒーロー、シーズン日程、**activeSeason** ランキング TOP3、直近3試合 |
| `RankingPage` | シーズン切替 + ランキング + pt ルール表示 |
| `AllTimeRankingPage` | 全試合通算（参考） |
| `GamesPage` / `GameDetailPage` | 試合一覧・詳細・Discord 文 |
| `NewGamePage` / `EditGamePage` | 試合 + 結果の登録・更新 |
| `PlayersPage` | シーズン参加プレイヤー、BAN、管理者 UI |
| `PlayerDetailPage` | 個人成績・直近試合・連続入賞 |
| `ProfilePage` | プロフィール・退会 |
| `AdminAnnouncementsPage` | お知らせ CRUD |
| `AdminSeasonsPage` | シーズン・期間・pt ルール・表示設定 |

### `components/`（抜粋）

| コンポーネント | 役割 |
|----------------|------|
| `Layout` | `ActivityHubProvider` + `Header` + main |
| `Header` | ナビ、`AnnouncementsHub`、`ActivityHubIcon` |
| `RankingCard` / `GameCard` | ランキング行・試合カード |
| `SeasonUserDisplay` | シーズン表示・切替 UI |
| `AnnouncementsHub` | お知らせモーダル |
| `ActivityHubIcon` / `ActivityHomeNotice` | アクティビティ（ヘッダー + ホーム新着告知） |
| `BannedParticipationBanner` | BAN 時の告知 |

### `hooks/`

| hook | 役割 |
|------|------|
| `useAuth` | user / myPlayer / isAdmin / BAN 判定 |
| `usePlayers` | players + 登録・更新・BAN |
| `useGames` | games + 試合 CRUD |
| `useResults` | 全 results + `useGameResults`（詳細のみ別購読） |
| `useAnnouncements` | お知らせ + CRUD |
| `useAnnouncementUnread` | 未読バッジ・既読 |
| `useActivities` | activities 読み取り |
| `useSeasons` | seasons + config → `activeSeasonId`（**独自 onSnapshot**） |
| `useAdmins` | admins 一覧（ブートストラップ時のみ、**独自 onSnapshot**） |
| `useSplash` | 起動スプラッシュ完了 |

### `utils/`（グループ別）

| 領域 | ファイル |
|------|----------|
| ランキング | `ranking.ts`, `point.ts`, `playerStats.ts` |
| シーズン | `season.ts`, `seasonPeriod.ts`, `seasonPointRules.ts`, `seasonRanking.ts`, `seasonAdmin.ts` |
| 試合 | `validateGame.ts`, `allocateGameNo.ts`, `gameParticipant.ts`, `discord.ts` |
| プレイヤー | `playerAccount.ts`, `validatePlayer.ts` |
| お知らせ | `announcementCategory.ts`, `announcementRead.ts` |
| アクティビティ | `activityFeed.ts` |
| その他 | `formatDateTime.ts`, `admin.ts`, `sanitizeUserText.ts`, `firebaseError.ts` |

### `types/`（`src/types/index.ts`）

`Player`, `Game`（`seasonId?`）, `Result`, `RankingStat`, `Season`, `SeasonPointRules`, `LeagueConfig`, `Announcement`, `Activity`, `AdminUser` など。

### `firebase.ts`

- Firebase 初期化
- `LEAGUE_ID` = `import.meta.env.VITE_LEAGUE_ID ?? 'main'`
- `paths`: players, games, results, admins, announcements, activities, seasons, leagueConfig, gameCounter

---

## 3. データの流れ

### 3.1 ログイン・登録

**関係ファイル:** `AppProvider`, `useAuth`, `LoginPage`, `RegisterPage`, `AuthRedirect`, `utils/admin.ts`

1. `signInWithPopup`（Google）→ `user.uid`
2. `players/{user.uid}` を `onSnapshot` → `myPlayer`
3. **1 Google = 1 プレイヤー:** ドキュメント ID = Auth UID、`authUid` も同値
4. `registerPlayer` → `players/{uid}` 作成/更新。新規・再登録時は `activities` に `member_joined`（失敗しても登録は成功）

**isAdmin**

- `VITE_ADMIN_UIDS` に含まれる → ブートストラップ管理者
- または `admins/{uid}` が存在 → 追加管理者
- `isAdmin = ブートストラップ OR 追加管理者`

**BAN**

- `isActive: false`（`banPlayer` / `unbanPlayer`）
- 集計: `ranking.ts` は非 active を除外
- UI: `isPlayerParticipationSuspended` → `BannedParticipationBanner`（管理者は除く）

### 3.2 プレイヤー

**一覧 (`PlayersPage`)**

`usePlayers` + `filterResultsBySeason` + `buildRankingStats({ participantsOnly: true })` → シーズン参加者有りのみ。

**詳細 (`PlayerDetailPage`)**

- シーズン: `scope` = 選択シーズン ID
- 通算: `/players/:id/all-time` → `ALL_SEASONS_SCOPE`
- `getPlayerRankingStat`, `getPlayerRecentGames`, `computePodiumStreaks`（`playerStats.ts`）

### 3.3 試合

**追加（`addGameWithResults`、バッチ）**

| 保存先 | 内容 |
|--------|------|
| `games/{id}` | `gameNo`, **`seasonId`**（`activeSeasonIdRef`）, date, time, appName, memo |
| `results/{id}` | `gameId`, `playerId`, `rank`, `point` |
| `activities/{id}` | `game_added` + スナップショット |

**関係:** 1 game : N results（`gameId` で結合）。

**`gameNo`:** `allocateGameNo` → `counters/games` トランザクション。削除しても番号は詰めない。

**編集:** game のメタ更新 + 当該 results 全削除→再作成。**`seasonId` は変更しない。**

**削除:** game + 紐づく results。activities は残る（UI でリンク無効化）。

### 3.4 ランキング・個人成績

**元データ:** Firestore の `results.point`（登録時に `calculatePoint` で保存）+ `players`（active のみ）

| 指標 | 計算場所 |
|------|----------|
| 合計ポイント | `ranking.ts` |
| 優勝率 | `playerStats.formatWinRate` |
| 入賞率 | `ranking.ts` `podiumRate` |
| 平均順位 | `ranking.ts` `avgRank` |
| 連続入賞 | `playerStats.computePodiumStreaks`（個人詳細のみ） |
| 登録時の pt | `point.calculatePoint` + シーズン `pointRules` |

**シーズン絞り:** `filterResultsBySeason` → `getGameSeasonId`（**未設定は `season1`**）。

**画面の違い**

- **ホーム TOP3:** `activeSeasonId` のみ
- **ホーム直近試合:** 全試合から gameNo 上位3（シーズン filter なし）
- **RankingPage:** 選択シーズン（公式）
- **AllTimeRankingPage:** 全 results（参考）

### 3.5 お知らせ

- **読取:** `AppProvider` → `announcements`
- **既読:** `players/{uid}/announcementReads/{announcementId}`
- **CRUD:** `AppProvider` → `AdminAnnouncementsPage`
- **表示:** `AnnouncementsHub`（Header）、未読は `useAnnouncementUnread`

### 3.6 アクティビティ

- **記録:** `registerPlayer`（参加）、`addGameWithResults`（試合追加）
- **読取:** `AppProvider` activities（limit 30）
- **表示:** Header 🕐 モーダル（`ActivityHubContext`）、ホームは **1時間以内 NEW のみ** バナー（`ActivityHomeNotice`）

---

## 4. Firestore 構成

ベース: `leagues/{LEAGUE_ID}/...`

| パス | 用途 |
|------|------|
| `players/{playerId}` | プレイヤー（通常 ID = Auth UID） |
| `players/{uid}/announcementReads/{id}` | お知らせ既読 |
| `games/{gameId}` | 試合 |
| `results/{resultId}` | 順位・pt |
| `admins/{uid}` | 追加管理者 |
| `announcements/{id}` | お知らせ |
| `activities/{id}` | アクティビティ（追記のみ想定） |
| `seasons/{seasonId}` | シーズン定義 |
| `config/league` | `activeSeasonId` など |
| `counters/games` | `nextGameNo` |

### 読み取り / 書き込み（アプリ）

| コレクション | 主な読み取り | 主な書き込み |
|--------------|--------------|--------------|
| players | AppProvider | register/update/ban/退会 |
| games | AppProvider | 試合 CRUD（管理者） |
| results | AppProvider + useGameResults | 試合バッチ |
| admins | useAdmins | add/remove（ブートストラップ） |
| announcements | AppProvider | 管理者 CRUD |
| activities | AppProvider | 登録・試合追加時 |
| seasons / config | useSeasons + AppProvider ref | AdminSeasons / bootstrap |

### main / dev

`.env` の `VITE_LEAGUE_ID`。本番 `main`、検証 `dev` など。

---

## 5. 権限

**注意:** `firestore.rules` は `.gitignore` のためリポジトリ外の場合あり。デプロイ済み Rules と `VITE_ADMIN_UIDS` を一致させること。

| 主体 | できること（設計 + 画面） |
|------|---------------------------|
| ゲスト | ホーム・ランキング・試合・プレイヤー・お知らせ・アクティビティの閲覧 |
| ログイン未登録 | `/register` へ（管理者除く） |
| 一般プレイヤー | 自分のプロフィール更新・退会。試合 CRUD 不可 |
| 管理者 | 試合 CRUD、BAN、お知らせ、シーズン管理 |
| ブートストラップ管理者 | 上記 + 追加管理者の追加/削除 |
| BAN ユーザー | 閲覧は可能。参加停止バナー。集計・ランキングから除外 |

**二重ガードの例:** 試合追加は `NewGamePage` の `isAdmin` + Rules の管理者 create。

---

## 6. シーズン（v0.4）

### 方針（コード上すでに実装済み）

- `seasons` コレクション + `config/league.activeSeasonId`
- 新規試合に `game.seasonId`（`activeSeasonIdRef`）
- **`seasonId` 無し旧試合** → `getGameSeasonId()` が `season1` 扱い（`constants/seasons.ts`）
- **シーズン表示** → `filterResultsBySeason`
- **通算** → `/ranking/all-time`、`/players/:id/all-time`（参考）
- **公式順位** → シーズンランキング（`/ranking`、ホーム TOP3）

### 採番シーズンの決め方

`resolveActiveSeasonId`（`seasonPeriod.ts`）:

1. いま期間内のシーズンがあれば、そのうち `order` 最大を優先
2. なければ `config.activeSeasonId`

### 触るときの注意

- フィルタは必ず `getGameSeasonId` / `filterResultsBySeason` 経由
- 試合編集で `seasonId` を変えない（過去所属を維持）
- Rules 未デプロイだと seasons/config 更新が permission-denied

### 主な関連ファイル

`types/index.ts`, `firebase.ts`, `constants/seasons.ts`, `utils/season.ts`, `utils/seasonPeriod.ts`, `utils/seasonPointRules.ts`, `AppProvider.tsx`, `useSeasons.ts`, `RankingPage`, `HomePage`, `PlayersPage`, `PlayerDetailPage`, `AllTimeRankingPage`, `NewGamePage`, `GameCard`, `AdminSeasonsPage`

---

## 7. 画面ごとの依存関係（クイックリファレンス）

### `HomePage.tsx`

- **hooks:** `useAuth`, `usePlayers`, `useGames`, `useResults`, `useSeasons`；`ActivityHomeNotice` → `useActivityHub`
- **utils:** `buildRankingStats`, `filterResultsBySeason`, `getSeasonLabelForGame`
- **Firestore:** players, games, results, seasons（表示）, activities（新着のみ）
- **注意:** TOP3 は activeSeason のみ。直近試合は全試合 TOP3

### `RankingPage.tsx`

- **hooks:** `usePlayers`, `useResults`, `useGames`, `useSeasons`
- **utils:** `filterResultsBySeason`, `buildRankingStats`, `getPointRulesForSeason`
- **注意:** 通算は `/ranking/all-time`

### `PlayerDetailPage.tsx`

- **hooks:** `usePlayers`, `useGames`, `useResults`, `useSeasons`；`useMatch` で all-time
- **utils:** `playerStats` 一式
- **注意:** scope = シーズン ID or `ALL_SEASONS_SCOPE`

### `NewGamePage.tsx`

- **hooks:** `useAuth`, `usePlayers`, `useGames`, `useSeasons`
- **utils:** `calculatePoint`, `getPointRulesForSeason`, `validateGame`
- **書込:** `addGameWithResults` → games, results, activities
- **注意:** 保存時の `activeSeasonId` が `seasonId` になる

### `GameDetailPage.tsx`

- **hooks:** `usePlayers`, `useGames`, `useGameResults`, `useSeasons`
- **utils:** `discord`, `gameParticipant`, `season`
- **注意:** `useGameResults` は追加 onSnapshot 1本

---

## 8. onSnapshot 一覧（重複に注意）

| 購読 | 場所 |
|------|------|
| players 全件 | AppProvider |
| games 全件 | AppProvider |
| results 全件 | AppProvider |
| announcements | AppProvider |
| activities（limit 30） | AppProvider |
| players/{uid} 本人 | AppProvider |
| admins/{uid} | AppProvider |
| announcementReads | AppProvider（ログイン時） |
| seasons | AppProvider（採番用）+ useSeasons（UI用）※同じコレクションを2購読 |
| config/league | AppProvider ref + useSeasons |
| results（gameId） | useGameResults |
| admins 一覧 | useAdmins（有効時のみ） |

新機能で **もう1本 onSnapshot を足す前**に、Context に載せられないか検討する（お知らせ・アクティビティ Hub は Context 再利用のみ）。

---

## 9. 理解のための読む順（おすすめ）

1. `src/firebase.ts` + `constants/seasons.ts`
2. `utils/season.ts` + `utils/seasonPeriod.ts`（`resolveActiveSeasonId`）
3. `AppProvider.tsx`（認証・`addGameWithResults`・`activeSeasonIdRef`）
4. `utils/ranking.ts` + `utils/point.ts`
5. `useSeasons.ts`
6. `RankingPage.tsx` → `HomePage.tsx` → `PlayerDetailPage.tsx`
7. `AdminSeasonsPage.tsx`
8. Firestore Rules（手元ファイル + デプロイ状態）

---

## 10. Cursor に頼むとき

実装前に次を挟むと理解しやすい:

- 「変更するファイルとデータの流れを説明してから実装」
- 「まず設計だけ。コードは書かない」

特に `AppProvider` と `season.ts` を触る変更は、先に影響範囲を文章化する。

---

*最終更新: コードベース確認に基づくメモ（v0.4 シーズン・アクティビティ Hub 含む）*
