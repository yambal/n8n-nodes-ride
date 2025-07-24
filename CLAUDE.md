# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

これはRideサービスAPIと連携するn8nコミュニティノードパッケージです。このプロジェクトは、n8nワークフローでRideのユーザー、トリップ、車両管理エンドポイントとやり取りできるカスタムノードを提供します。

## アーキテクチャ

### 主要コンポーネント

- **Rideノード** (`nodes/Ride/Ride.node.ts`): 3つのリソース（User、Trip、Vehicle）をサポートするメインノード実装。各種操作（CRUD操作 + トリップキャンセル、車両ステータス更新）に対応
- **Ride API認証情報** (`credentials/RideApi.credentials.ts`): 設定可能なベースURLでBearerトークンを使用する認証ハンドラー
- **ビルドシステム**: TypeScriptコンパイル + アセットコピー用Gulp

### ノード構造

Rideノードはn8nのリソース-オペレーションパターンに従います：
- リソース: `user`、`trip`、`vehicle`
- 操作はリソースごとに異なります（get、list、create、update + リソース固有の操作）
- すべてのAPI呼び出しで`rideApi`認証情報タイプを使用した`httpRequestWithAuthentication`を使用
- `continueOnFail`サポートを含む適切なエラーハンドリングを実装

### API連携

すべてのエンドポイントは`/api/v1/`下でREST規約に従います：
- ユーザー: `/users`、`/users/{id}`
- トリップ: `/trips`、`/trips/{id}`、`/trips/{id}/cancel`
- 車両: `/vehicles`、`/vehicles/{id}`、`/vehicles/{id}/status`

認証はAuthorizationヘッダーでBearerトークンを使用します。

## 開発コマンド

```bash
# 依存関係のインストール
npm i

# 自動コンパイルでの開発
npm run dev

# プロダクション用ビルド（TypeScript + アイコン）
npm run build

# リント
npm run lint
npm run lintfix

# コードフォーマット
npm run format
```

## ビルドプロセス

1. `npx rimraf dist` - 出力ディレクトリのクリーン
2. `tsc` - TypeScriptを`/dist`にコンパイル
3. `gulp build:icons` - nodesとcredentialsからPNG/SVGアセットをdistにコピー

## ローカルテスト

n8nをグローバルインストールし、ローカルテスト用にパッケージをリンク：
```bash
npm install n8n -g
# n8nのローカル開発セットアップガイドに従う
```

## 既知の問題

- Ride.node.tsで参照されている`ride.svg`アイコンファイルが不足
- プロダクション用にサンプルノード（ExampleNode、HttpBin）を削除すべき
- cygpath依存関係の問題によりWindowsでビルドが失敗する可能性

## パッケージ設定

- 最小Node.js: 20.15
- メインエントリ: `index.js`（空ファイル、n8nはpackage.jsonのn8nセクションから読み込み）
- 公開ファイル: `dist/`のみ
- n8n APIバージョン: 1