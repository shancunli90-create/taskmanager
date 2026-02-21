# タスク3: ユーザー削除機能の追加 (管理者限定・改訂版)

## 概要
ユーザー削除機能にサーバーサイドバリデーションを適用し、UIを新しいページネーションの仕組みに対応させ、**エラー表示を改善する**。

### 実装要件

1.  **管理者限定**: ログインしているユーザーのロールが `ADMIN` でない場合、削除ボタンは表示されない。また、サーバーサイドでも必ず権限チェックを行う。
2.  **自己削除の禁止**: ログインしているユーザーが自分自身を削除しようとした場合、クライアントサイドで警告を表示し、処理を中止する。サーバーサイドでも念のためチェックを行う。
3.  **確認ダイアログ**: 削除は取り消せない操作のため、実行前に必ず確認ダイアログを表示する。

### 改訂のポイント
*   **エラー表示の改善**: `useMutation` の `onError` でエラーメッセージをStateに保存し、UIの適切な場所（例: テーブル上部）に表示するように変更する。

---
## 実装手順

### 1. ユーザー削除用のAPI関数を改修する

`deleteUser` 関数に、削除対象のユーザーID（文字列）を検証する `.inputValidator()` を追加します。

**ファイルを編集:** `src/features/user/api.ts`
(*この内容はタスク1, 2と共通のファイルです*)
```ts
// ... (他のimport)
import { z } from 'zod'
import { auth } from '@/lib/better-auth/auth'
import { getRequest } from '@tanstack/react-start/server' // <-- 追記

// ... (getAllUsers, updateUser 関数) ...

// --- ここから deleteUser の改修 ---

// ユーザーを削除するサーバー関数
export const deleteUser = createServerFn({ method: 'POST' })
  .inputValidator(z.string()) // 削除対象のIDが文字列であることを検証
  .handler(async ({ data: userIdToDelete }) => { // dataがuserIdToDeleteになる
    // 1. 現在のセッションを取得
    const request = getRequest() // <-- 追記
    const session = await auth.api.getSession({ headers: request.headers }) // <-- 修正
    const currentUser = session?.user

    // 2. 権限チェック
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('管理者権限が必要です。')
    }

    // 3. 自己削除チェック
    if (currentUser.id === userIdToDelete) {
      throw new Error('自分自身を削除することはできません。')
    }

    // 4. ユーザーを削除
    await db.delete(userTable).where(eq(userTable.id, userIdToDelete))

    return { success: true }
  })
// --- ここまで ---
```

### 2. 現在のログインユーザー情報を取得するAPI関数

この関数は、UI側で「削除」ボタンの表示/非表示を切り替えるために引き続き使用します。

**ファイル:** `src/features/session/api.ts`
```ts
import { createServerFn, getRequest } from '@tanstack/react-start/server'
import { auth } from '../../lib/better-auth/auth'
import type { User } from '@/db/schema'

// 現在のセッションユーザー情報を取得するサーバー関数
export const getSessionUser: () => Promise<User | null> = createServerFn('GET').handler(
  async () => {
    const request = getRequest()
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    return session?.user ?? null
  },
)
```

### 3. UIコンポーネントを実装する

`RouteComponent` に削除エラー表示用のStateを追加し、`deleteUserMutation` の `onError` ハンドラを更新します。削除はモーダルではないため、テーブルの上部など、適切な場所にエラーメッセージを表示するロジックを追加します。

**ファイルを編集:** `src/routes/_layout/index.tsx`
(*これがこの機能における最終形です*)

```tsx
// (既存のimportに以下を追加)
import { getSessionUser } from '@/features/session/api'
import { deleteUser } from '@/features/user/api'


// (Route定義とdemoUserColumnsはTASK.mdの通り)

// --- RouteComponentの最終形 ---
function RouteComponent() {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null) // TASK2から継続
  const [deleteError, setDeleteError] = useState<string | null>(null) // <-- ここを追加
  const { page, pageSize } = Route.useSearch()

  // --- データ取得 ---
  const { data: sessionUser } = useQuery({
    queryKey: ['sessionUser'],
    queryFn: getSessionUser,
  })
  const { data } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => getAllUsers({ page, pageSize }),
  })

  // --- データ更新・削除 (Mutations) ---
  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', page, pageSize] })
      setEditingUser(null)
      setUpdateError(null)
    },
    onError: (error) => {
      setUpdateError(error.message)
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', page, pageSize] })
      setDeleteError(null) // 成功したらエラーをクリア
    },
    onError: (error) => {
      // alert(`削除に失敗しました: ${error.message}`) // alertを削除
      setDeleteError(error.message) // <-- エラーメッセージをStateに保存
    },
  })

  // --- イベントハンドラ ---
  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setUpdateError(null)
    setDeleteError(null) // 編集開始時に削除エラーもリセット
  }
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => { /* ... (変更なし) ... */ }

  const handleDeleteClick = (userToDelete: User) => {
    setDeleteError(null) // 削除試行前にエラーをリセット
    if (sessionUser?.id === userToDelete.id) {
      alert('自分自身を削除することはできません。')
      return
    }
    if (window.confirm(`本当に「${userToDelete.name}」さんを削除しますか？`)) {
      deleteUserMutation.mutate(userToDelete.id)
    }
  }

  // --- カラム定義 (編集・削除ボタン) ---
  // (変更なし)

  // (レンダリング準備)
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
      {deleteError && ( // <-- 削除エラーメッセージを表示
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {deleteError}
        </div>
      )}
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
            {updateError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                {updateError}
              </div>
            )}
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block mb-1">名前:</label>
                <input id="name" name="name" type="text" defaultValue={editingUser.name} className="border p-2 w-full" required />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block mb-1">メールアドレス:</label>
                <input id="email" name="email" type="email" defaultValue={editingUser.email} className="border p-2 w-full" required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setEditingUser(null); setUpdateError(null); }} className="bg-gray-200 px-4 py-2 rounded">
                  キャンセル
                </button>
                <button type="submit" disabled={updateUserMutation.isPending} className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400">
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