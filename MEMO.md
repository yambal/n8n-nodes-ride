# Ride Acount

Name: n8n-nodes-ride
API Key: 2c9ddba6
Psw: @K7cwTXKmDSRbHG

## n8n認証フィールドの特殊動作について

### 問題
n8nでは`password: true`が設定されたフィールドや`password`という名前の変数は特殊な動作をする：

1. **認証失敗時の自動削除** - 認証テストやリクエストが失敗すると、セキュリティのためパスワードフィールドが自動的にクリアされる
2. **`__n8n_BLANK_VALUE_`置換** - 一度保存されたパスワードは画面表示時に内部プレースホルダーに置き換えられる
3. **変数名の影響** - `password`という名前自体も特殊扱いされる可能性がある

### 解決策
```typescript
{
    displayName: 'Password',
    name: 'userPassword',           // 'password'以外の名前を使用
    type: 'string',
    typeOptions: { password: false }, // パスワード扱いを無効化
    noDataExpression: true,         // データ式評価を無効化
}
```

これにより：
- n8nの特殊なパスワード処理を回避
- 認証失敗時の自動削除を防止
- 安定した認証情報の保持

### 注意点
- セキュリティ上の考慮が必要（パスワードが平文で保存される）
- しかし、n8nの制約を回避するための実用的な解決策
- 既存の認証設定は新しいフィールド名に再設定が必要
