# タスク2: ユーザー情報の更新機能を追加する (改訂版)

## 概要

`useMutation` を利用したユーザー更新機能に、サーバーサイドでの入力値検証パターンを適用し、UIを新しいページネーションの仕組みに対応させ、**エラー表示を改善する**。

### 改訂のポイント
*   **エラー表示の改善**: `useMutation` の `onError` でエラーメッセージをStateに保存し、モーダル内に表示するように変更する。

## ⚠️ 重要な注意点: `sessionTable`と`accountTable`について

ユーザー情報を更新する際、`sessionTable`や`accountTable`の**トークンやIDを直接変更する必要は一切ありませんし、絶対に変更しないでください。**

**(中略)**

---

## 実装手順

### 1. ユーザー更新用のAPI関数を改修する (変更なし)

(これは先ほどの提案通りです)

### 2. UIコンポーネントを実装する

`RouteComponent` にエラー表示用のStateを追加し、`updateUserMutation` の `onError` ハンドラを更新し、モーダルのフォーム内にエラーメッセージを表示するロジックを追加します。

**ファイルを編集:** `src/routes/_layout/index.tsx`
(*この内容はタスク1, 3と共通のファイルです*)

```tsx
// (既存のimportに以下を追加)
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { updateUser } from '@/features/user/api'

// (Route定義とdemoUserColumnsはTASK.mdの通り)

// --- RouteComponentの全体像 ---
function RouteComponent() {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null) // <-- ここを追加
  const { page, pageSize } = Route.useSearch()

  // --- データ取得 ---
  const { data } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => getAllUsers({ page, pageSize }),
  })

  // --- データ更新(Mutation) ---
  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      // 更新が成功したら、現在のページのクエリを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['users', page, pageSize] })
      setEditingUser(null) // モーダルを閉じる
      setUpdateError(null) // 成功したらエラーをクリア
    },
    onError: (error) => {
      // alert(`更新に失敗しました: ${error.message}`) // alertを削除
      setUpdateError(error.message) // <-- エラーメッセージをStateに保存
    },
  })

  // --- イベントハンドラ ---
  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setUpdateError(null) // 編集開始時にエラーをリセット
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingUser) return

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string

    updateUserMutation.mutate({ id: editingUser.id, name, email })
  }

  // --- カラム定義 (編集ボタン追加) ---
  // (変更なし)

  // --- レンダリング準備 ---
  const users = data?.users ?? []
  const totalCount = data?.total ?? 0
  const table = useAppTable({
    data: users,
    columns: userColumnsWithActions,
  })
  const navigate = Route.useNavigate()

  // --- JSX ---
  return (
    <div>
      <AppTable
        table={table}
        pagination={{
          page: page,
          pageSize: pageSize,
          totalCount: totalCount,
          currentPageCount: users.length,
          onChangePage: (newPage) => navigate({ search: (p) => ({ ...p, page: newPage }) }),
          onChangePageSize: (size) => navigate({ search: (p) => ({ ...p, page: 0, pageSize: size }) }),
        }}
      />

      {/* 編集モーダル */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl mb-4">{editingUser.name} を編集中</h2>
            {updateError && ( // <-- エラーメッセージを表示
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                {updateError}
              </div>
            )}
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block mb-1">名前:</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={editingUser.name}
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block mb-1">メールアドレス:</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingUser.email}
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null)
                    setUpdateError(null) // モーダルを閉じる際にエラーもクリア
                  }}
                  className="bg-gray-200 px-4 py-2 rounded"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
                >
                  {updateUserMutation.isPending ? '更新中...' : '更新'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 3. 確認

1.  `pnpm dev` で開発サーバーを起動する。
2.  トップページ (`http://localhost:3000`) を開き、ユーザー一覧の各行に「編集」ボタンが表示されていることを確認する。
3.  「編集」ボタンをクリックすると、モーダルダイアログが表示され、名前とメールアドレスのフォームが表示されることを確認する。
4.  フォームの値を変更して「更新」ボタンをクリックする。
5.  モーダルが閉じ、ローディングなしで一覧のユーザー情報が更新されていることを確認する。（`invalidateQueries`による自動再取得）
6.  (追加確認) わざと名前を空にするなど、不正な値で更新しようとすると、モーダル内にエラーメッセージが表示されることを確認する。