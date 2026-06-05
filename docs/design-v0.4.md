# Rivalt v0.4 設計 — シーズン管理 & ホーム UI 整理

**版:** v0.4.0（予定）  
**前提:** v0.3.0 実装済（通算ランキング・お知らせ・アクティビティ・`VITE_LEAGUE_ID`）

---

## ゴール

1. **Season 1 / Season 2** のように試合・成績を期間単位で分けて見られる。
2. **通算ランキングは壊さない**（従来どおり全試合を集計）。
3. **ホーム**はお知らせをボタン → 一覧 → タップで詳細ポップアップに整理（アクティビティは簡略表示のまま残す）。

**v0.4 では大会機能は実装しない。**

---

## 1. シーズン — データ構造

### 1.1 コレクション

| パス | 説明 |
|------|------|
| `leagues/{leagueId}/seasons/{seasonId}` | シーズン定義 |
| `leagues/{leagueId}/config/league` | リーグ設定（現在の採番シーズン等） |

### 1.2 Season ドキュメント

```ts
interface Season {
  id: string           // 例: season1, season2
  label: string        // 表示名（例: Season 1 / 春イベント）。管理者が変更可
  order: number        // 表示順
  startsAt?: Timestamp  // 開始日時（ローカル入力を Timestamp 化）
  endsAt?: Timestamp    // 終了日時（この瞬間を含む）
  /** true / 未設定 = ランキング切替に表示。false = 非表示（通算は常に可） */
  showInRanking?: boolean
  /** 試合登録時の pt 計算。未設定は標準ルール */
  pointRules?: SeasonPointRules
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface SeasonPointRules {
  rank1: number
  rank2: number
  rank3: number
  rank4: number
  rank5Plus: number   // 5位以下（最下位以外）
  lastPlace: number   // 最下位（順位 pt より優先）
}
```

### 1.3 リーグ設定（単一 doc）

```ts
interface LeagueConfig {
  /** 新規試合に付与する seasonId */
  activeSeasonId: string
  updatedAt: Timestamp
}
```

### 1.4 試合への紐づけ

`games` に **`seasonId`**（string）を追加。

- **新規試合**（`resolveActiveSeasonId`）:
  1. いまの日時が `startsAt`〜`endsAt` に入っているシーズンがあれば、その ID
  2. なければ `config/league.activeSeasonId`
- **既存試合**（`seasonId` なし）: クライアントで **`season1` 扱い**（移行スクリプト不要）。

`results` は従来どおり `gameId` のみ。集計時に `games` から `seasonId` を解決してフィルタ。

### 1.5 第〇戦（gameNo）

- **リーグ通し**のまま（`counters/games`）。シーズンをまたいで欠番・不変の仕様は v0.3 と同じ。
- シーズンは **表示・集計のフィルタ**であり、番号体系は変えない。

---

## 2. シーズン — 機能

### 2.1 ランキング（`/ranking`）

- 切替: **通算** | **Season 1** | **Season 2** …
- 通算: 全 `results`（従来と同じ）。
- シーズン別: 対象 `seasonId` の `games` に属する `results` のみ。

### 2.2 プレイヤー詳細（`/players/:id`）

- 同様のシーズン切替（通算 / 各シーズン）。
- 表示項目は v0.3 と同じ（pt・試合数・率・直近5戦・連続入賞）。

### 2.3 試合一覧・ホーム直近試合

- v0.4.0: フィルタ UI は任意（一覧は通算表示のままでも可）。
- ランキング・個人詳細を優先。

### 2.4 管理者 — シーズン運用

- `/admin/seasons` から:
  - シーズン一覧（**開始〜終了の日時**を表示・編集）
  - **新シーズン追加**（表示名は任意・例: `Season 4` / `春のバウンティ` + 期間）
  - **表示名の編集**（ID `season1` などは固定。ランキング・日程のラベルのみ変更）
- **「終了」ボタン / `status: closed` は使わない** — 期間を過ぎたシーズンは自動で「終了」表示。
- **新規試合の `seasonId`**: いまの日時が `startsAt`〜`endsAt` に入っているシーズンを優先。該当なしは `config/league.activeSeasonId`。
- **期間未設定**: `startsAt` / `endsAt` を付けない運用可（編集で「未設定にする」でフィールド削除）。
- **期間の重複**: 期間を持つシーズン同士で区間が重なる保存は拒否（終了日時を含む判定）。
- **シーズン別ランキングの表示**: 各シーズンの `showInRanking` を `/admin/seasons` で切替。オフのシーズンはランキング・個人詳細の切替に出ない（日程・試合採番は従来どおり）。
- Season 1 終了時の **最終成績スナップショット**は v0.4.0 では **検討・任意**（ランキングのシーズン切替で確認）。

### 2.5 初期データ

- `seasons/season1`: label `Season 1`, status `active`, order `1`
- `config/league`: `activeSeasonId: season1`
- 本番・テストは **`VITE_LEAGUE_ID` ごと**に別コレクション（v0.3 と同じ）

### 2.6 シーズン別ポイントルール

- `seasons/{seasonId}.pointRules`（optional）。未設定はリーグ標準（1位 +7 … 最下位 -2）。
- **試合追加・編集**（順位入力）時: その試合の `seasonId` に対応するシーズンのルールで `calculatePoint`。
- **ランキング集計**は保存済み `results.point` を合算（ルール変更は過去試合に遡及しない）。
- 管理者: `/admin/seasons` 各カードで編集。「標準に戻す」でフィールド削除。

---

## 3. ホーム UI 整理

### 3.1 お知らせ

| 現状 (v0.3) | v0.4 |
|-------------|------|
| ホームにカード一覧（最大5件・折りたたみ） | ホーム上部に **「お知らせ」ボタン**（件数バッジ） |
| — | タップ → **一覧モーダル**（タイトル・日付・1行プレビュー） |
| — | 行タップ → **詳細モーダル**（全文） |

管理者の投稿導線は従来 `/admin/announcements`（ホームの管理ボタンは維持）。

**拡張（種別・未読）:** [`design-announcements.md`](./design-announcements.md)

### 3.2 アクティビティ

- ホームに **簡略タイムライン**（件数上限・日時のみ等）を残す。
- 必要なら将来「アクティビティ」ボタン化（v0.4 では必須ではない）。

---

## 4. 実装フェーズ（推奨）

| フェーズ | 内容 |
|----------|------|
| **4a** | 型・`seasonId` 付与・集計フィルタ・ランキング切替 |
| **4b** | プレイヤー詳細のシーズン切替 |
| **4c** | 管理者シーズン運用（`/admin/seasons`）— 実装済 |
| **4d** | ホームお知らせモーダル |
| **4e** | Rules・テストケース・終了シーズン表示の仕上げ |

---

## 5. 受け入れ条件（v0.4.0）

- [x] `games.seasonId` でシーズン単位の集計（旧試合は `season1` 扱い）
- [x] 新規試合: 期間内シーズン優先、なければ `activeSeasonId`
- [x] ランキング・プレイヤー詳細: 通算 / シーズン切替（`showInRanking` で非表示可）
- [x] 通算ランキングが v0.3 と同等（保存 pt の合計）
- [x] `/admin/seasons`: 期間・表示名・重複拒否・ランキング表示切替・ポイントルール（有効化 UI なし）
- [x] お知らせ: メガホン → 一覧 → 詳細、種別・未読・既読記録
- [x] `main` / `dev` 分離（`VITE_LEAGUE_ID`）
- [ ] Firestore Rules デプロイ（本番）
- [ ] 手動テスト: [`test-cases-v0.4.md`](./test-cases-v0.4.md)

---

## 6. Firestore Rules（方針）

- `seasons` / `config`: 閲覧は全員、更新はリーグ管理者。
- `games`: `seasonId` は optional string（未設定は移行互換）。新規は管理者のみ既存と同じ。

---

## 関連

- [`design-announcements.md`](./design-announcements.md) — 種別・テンプレート・未読
- [`roadmap.md`](./roadmap.md)
- [`test-cases-v0.4.md`](./test-cases-v0.4.md)
- v0.3 集計拡張のメモ: [`design-v0.3.md`](./design-v0.3.md)（`buildRankingStats` のフィルタ引数）
