# 開発プロンプトまとめ

Claude Code で Chore Zoo を開発したときに使ったプロンプトを、使った順にまとめたものです。プロンプトは入力したとおり（英語のまま）引用し、和訳を添えています。「作業中に追加」は、Claude が前の指示を処理している途中に送ったプロンプトを指します。

## 概要

| # | フェーズ | プロンプトの要点 | 結果 |
|---|----------|------------------|------|
| 1 | 企画 | 3D ToDo アプリのアイデア。まず計画したい | コンセプト、技術スタック、データモデル、マイルストーン、5 つの確認事項 |
| 2 | 方針決定 | 5 つの確認事項への回答と、墓場の ToDo の削除 | 設計が確定し、実装を開始 |
| 3 | 機能追加（作業中に追加） | 未完了の ToDo をポータルに蹴り込んで削除 | ブーツでポータルに蹴り込むアニメーション |
| 4 | 構成（作業中に追加） | モノレポと共有型 | npm workspaces（`packages/shared`、`apps/api`、`apps/web`） |
| 5 | コードスタイル | `/natural-code-style` で再開 | 以降のコードをこのスタイルで記述 |
| 6 | 起動 | 実行 | 開発サーバーを起動し、ブラウザで表示 |
| 7 | 機能追加 | 向いている方向へランダムにジャンプし、回転もする | 向きを変える → しゃがむ → ジャンプ（宙返り・スピン付き） |
| 8 | 運用（作業中に追加） | Docker 化 | Dockerfile、nginx、`compose.yaml`（後に削除） |
| 9 | 起動 | 開発サーバーを起動 | 開発サーバーを再起動 |

## プロンプト一覧

### 1. アイデアの計画

> want to create todo app that uses 3d frontend. the idea is, we input new todo and spawns cylinder that moves around in the world, if the todo completes the cylinder shatters and its todo written in graveyard. want to plan about that first

和訳：3D フロントエンドの ToDo アプリを作りたい。ToDo を入力すると円柱が出現してワールド内を動き回り、完了すると円柱が砕けて、その ToDo が墓場に記録される。まずは計画を立てたい。

Claude はコンセプト、技術スタック（Vite + React Three Fiber + Rapier + Zustand）、データモデル、マイルストーンを提案し、次の 5 点を確認しました。

1. 見た目のテイストは？
2. 墓場は同じワールド内に置くか、別画面にするか？
3. 元に戻す（復活）機能は必要か？
4. 優先度・期限・タグなどの項目は必要か？
5. デスクトップのみか、モバイルにも対応するか？

### 2. 確認事項への回答

> 1 funny and dumb, 2 just floating window on corner is okay, 3 okay, 4 no need, 5 desktop only. also make the todo in graveyard to also can be deleted

和訳：1 はおもしろくてバカっぽく。2 は画面の隅に浮かぶウィンドウでよい。3 は OK。4 は不要。5 はデスクトップのみ。あと、墓場の ToDo も削除できるようにしてほしい。

### 3. 未完了の ToDo を追放（作業中に追加）

> also make the open todo to can be deleted (banished, kicked in portal)

和訳：未完了の ToDo も削除できるようにしてほしい（ポータルに蹴り込んで追放する）。

### 4. モノレポと共有型（作業中に追加）

> monorepo and use shared type

和訳：モノレポにして、型を共有してほしい。

これに合わせてバックエンドを追加しました。localStorage の代わりに Hono と `node:sqlite` を使い、API の型は `packages/shared` に置いています。

### 5. コードスタイルの指定

> resume code with this /natural-code-style

和訳：この /natural-code-style でコーディングを再開してほしい。

### 6. アプリの起動

> run it

和訳：実行してほしい。

### 7. 円柱のジャンプと回転

> make the cylinder can jump aroun randomly to where it faces, also rotate

和訳：円柱が向いている方向へランダムにジャンプするようにして、回転もさせてほしい。

### 8. Docker 化（作業中に追加）

> also dockerize

和訳：Docker 化もしてほしい。

社内ネットワークでは TLS プロキシが通信を中継しているため、その証明書をビルドシークレットとして `npm ci` に渡す対応が必要でした。

> **補足：** Docker 化は日々の開発にはほとんど影響していません。ローカル開発は引き続き `npm run dev` で行っており、Docker は動作確認のビルドで一度実行しただけです。意味があるのは、デプロイするときや本番相当のビルドを動かすときに限られます。そのため、Docker 関連のファイルは後にリポジトリから削除しました。

### 9. 開発サーバーの起動

> start dev

和訳：開発サーバーを起動してほしい。

## 開発後のドキュメント作成

このファイルや README（英語・日本語）、スクリーンショット、GitHub への公開も、コードと同じく Claude Code へのプロンプトだけで行いました。ドキュメント作成も含めて、すべてバイブコーディングです。

## うまくいった進め方

- **先に計画し、番号付きの質問に答える。** 最初に計画を依頼し、「1 は…、2 は…」と番号で答えたことで、短いメッセージ 1 つで設計を確定できた。
- **作業中に追加する。** 追放機能・モノレポ化・Docker 化といった小さな仕様追加を作業中に送り、同じ実装の流れに組み込めた。
- **スキルでスタイルを指定する。** `/natural-code-style` を一度指定するだけで、以降のコード規約がそろった。
