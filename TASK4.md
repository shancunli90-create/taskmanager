# タスク4: 機能のテストコードを作成する

## 概要

これまでに実装したユーザー管理機能（一覧表示、更新、削除）に対して、`vitest`と`React Testing Library`を用いてテストコードを作成する。
テストを自動化することで、将来的な機能追加やリファクタリングの際に、既存の機能が壊れていないこと（デグレードしていないこと）を保証できるようにする。

### テストする項目

1.  **一覧表示**: ユーザー情報が正しくテーブルに表示されるか。
2.  **権限による表示制御**: 一般ユーザーには「削除」ボタンが見えず、管理者には見えるか。
3.  **更新機能**: 編集モーダルが開き、フォームを送信すると更新APIが正しいデータで呼び出されるか。
4.  **削除機能**: 削除ボタンを押すと確認ダイアログが表示され、APIが呼び出されるか。
5.  **自己削除の防止**: 自分自身を削除しようとすると、警告が表示されAPIが呼び出されないか。

---

## 実装手順

### 1. テスト用の設定ファイルを作成する

テスト実行時に `jsdom` (Node.js上でブラウザ環境を再現するライブラリ) を使えるようにし、`@testing-library/jest-dom` の便利なマッチャー（`.toBeInTheDocument()`など）を読み込むための設定ファイルを作成します。

**ファイルを作成:** `vitest.setup.ts` （プロジェクトのルートディレクトリに作成）

```ts
import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// window.confirm と window.alert をモック化
global.confirm = vi.fn(() => true) // デフォルトでは 'OK' を押したことにする
global.alert = vi.fn()
```

次に、`vite.config.ts` を編集して、この設定ファイルを読み込むようにします。

**ファイルを編集:** `vite.config.ts`

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
// ... (他のimport)

export default defineConfig({
  // ... (他の設定)
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'], // <-- この行を追加
  },
})
```

### 2. テストファイルを作成する

テスト対象のコンポーネントと同じ階層にテストファイルを作成するのが一般的です。

**ファイルを作成:** `src/routes/_layout/index.test.tsx`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// テスト対象のコンポーネント
// Note: コンポーネントと関連フックをエクスポート可能にする必要があります
import { RouteComponent as UserManagement, demoUserColumns } from './index'
import type { User } from '@/db/schema'

// APIモジュールをモック化
vi.mock('@/features/user/api')
vi.mock('@/features/session/api')
import * as userApi from '@/features/user/api'
import * as sessionApi from '@/features/session/api'

// --- モックデータ ---
const mockUsers: User[] = [
  { id: '1', name: '管理者A', email: 'admin@test.com', role: 'ADMIN', createdAt: new Date(), updatedAt: new Date(), emailVerified: true },
  { id: '2', name: '一般ユーザーB', email: 'user@test.com', role: 'USER', createdAt: new Date(), updatedAt: new Date(), emailVerified: true },
]
const adminUser = mockUsers[0]
const regularUser = mockUsers[1]


// --- テスト用のラッパーコンポーネント ---
// React Query の Provider でコンポーネントを囲む
const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }, // テストではリトライを無効化
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <UserManagement />
    </QueryClientProvider>
  )
}


// --- テスト本編 ---

describe('ユーザー管理ページ', () => {

  // 各テストの前にモックをリセット
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(userApi, 'getAllUsers').mockResolvedValue({ users: mockUsers })
  })

  it('ユーザー一覧が正しく表示される', async () => {
    vi.spyOn(sessionApi, 'getSessionUser').mockResolvedValue(regularUser)
    renderComponent()

    // "管理者A" と "一般ユーザーB" が表示されるのを待つ
    expect(await screen.findByText('管理者A')).toBeInTheDocument()
    expect(await screen.findByText('一般ユーザーB')).toBeInTheDocument()
  })

  it('一般ユーザーでログイン時、削除ボタンが表示されない', async () => {
    vi.spyOn(sessionApi, 'getSessionUser').mockResolvedValue(regularUser)
    renderComponent()
    
    // "削除" というテキストを持つボタンが存在しないことを確認
    await screen.findByText('管理者A') // レンダリング完了を待つ
    expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument()
  })

  it('管理者でログイン時、削除ボタンが表示される', async () => {
    vi.spyOn(sessionApi, 'getSessionUser').mockResolvedValue(adminUser)
    renderComponent()

    // 削除ボタンがユーザーの数だけ表示されるのを待つ
    const deleteButtons = await screen.findAllByRole('button', { name: '削除' })
    expect(deleteButtons).toHaveLength(mockUsers.length)
  })

  it('管理者でログイン時、他のユーザーを削除できる', async () => {
    vi.spyOn(sessionApi, 'getSessionUser').mockResolvedValue(adminUser)
    const deleteUserMock = vi.spyOn(userApi, 'deleteUser').mockResolvedValue({ success: true })
    
    renderComponent()
    const user = userEvent.setup()

    const deleteButtons = await screen.findAllByRole('button', { name: '削除' })
    await user.click(deleteButtons[1]) // 2人目 (一般ユーザー) の削除ボタンをクリック

    // 確認ダイアログが呼ばれたか
    expect(window.confirm).toHaveBeenCalledWith('本当に「一般ユーザーB」さんを削除しますか？')

    // APIが正しいIDで呼ばれたか
    expect(deleteUserMock).toHaveBeenCalledWith('2')
  })

  it('自分自身を削除しようとすると警告が表示される', async () => {
    vi.spyOn(sessionApi, 'getSessionUser').mockResolvedValue(adminUser)
    const deleteUserMock = vi.spyOn(userApi, 'deleteUser')

    renderComponent()
    const user = userEvent.setup()

    const deleteButtons = await screen.findAllByRole('button', { name: '削除' })
    await user.click(deleteButtons[0]) // 1人目 (自分自身) の削除ボタンをクリック

    // 警告アラートが呼ばれたか
    expect(window.alert).toHaveBeenCalledWith('自分自身を削除することはできません。')
    // APIが呼ばれていないこと
    expect(deleteUserMock).not.toHaveBeenCalled()
  })
})
```
*補足: 上記テストを動作させるには、`src/routes/_layout/index.tsx` の `RouteComponent` と `demoUserColumns` を `export` する必要があります。*

### 3. テストを実行する

以下のコマンドでテストを実行します。

```bash
pnpm test
```

すべてのテストがパスすれば、機能が正しく実装されていることの一つの証明になります。
