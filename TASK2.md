# タスク2: ユーザー情報の更新機能を追加する

## 概要

ユーザー一覧テーブルに「編集」ボタンを追加し、選択したユーザーの`name`と`email`をモーダルダイアログで変更できるようにする。
データの更新には `@tanstack/react-query` の `useMutation` を使用し、更新成功後には自動で一覧を最新の状態に更新する。

## ⚠️ 重要な注意点: `sessionTable`と`accountTable`について

ユーザー情報を更新する際、`sessionTable`や`accountTable`の**トークンやIDを直接変更する必要は一切ありませんし、絶対に変更しないでください。**

### `sessionTable` (セッション管理テーブル)

*   **役割**: ユーザーが「今ログインしている」という状態を管理します。
*   **トークン (`token`)**: ログイン状態を識別するための、ランダムで意味を持たない文字列です。ユーザーの名前やメールアドレスとは無関係です。
*   **もし変更すると？**: トークンを変更すると、現在のログインセッションが無効になり、ユーザーは強制的にログアウトされてしまいます。

### `accountTable` (外部連携アカウント管理テーブル)

*   **役割**: GoogleやGitHubなどの外部サービスを使ったログイン情報を管理します。
*   **トークン (`accessToken`など)**: 外部サービスから発行されたもので、そのサービスとの連携にのみ使われます。私たちのアプリのユーザー情報とは直接関係ありません。
*   **もし変更すると？**: 外部サービスとの連携が壊れてしまい、そのアカウントでログインできなくなる可能性があります。

**結論として、今回のタスクで操作するのは `userTable` のみです。** `userTable`の`id`をキーにして`sessionTable`や`accountTable`は関連付けられているため、`userTable`の`name`や`email`を変更しても、それらの関連が壊れることはありません。

---

## 実装手順

### 1. ユーザー更新用のAPI関数を作成する

まず、サーバーサイドで特定のユーザー情報を更新するための関数を `zod` によるバリデーションと共に追加します。

**ファイルを編集:** `src/features/user/api.ts`

```ts
import { db } from '@/db'
import { userTable } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

export const getAllUsers = createServerFn('GET', async () => {
  // (これは既存の関数)
  console.log('Fetching all users from server...')
  const users = await db.select().from(userTable)
  return { users }
})

// --- ここから追加 ---

// ユーザー更新時の入力データを検証するスキーマ
const userUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('正しいメールアドレスを入力してください'),
})

// ユーザー情報を更新するサーバー関数
export const updateUser = createServerFn('POST', async (data: z.infer<typeof userUpdateSchema>) => {
  const validatedData = userUpdateSchema.parse(data)

  await db
    .update(userTable)
    .set({
      name: validatedData.name,
      email: validatedData.email,
    })
    .where(eq(userTable.id, validatedData.id))

  return { success: true }
})
// --- ここまで追加 ---
```

### 2. ユーザー編集用のUIコンポーネントを作成する

`_layout/index.tsx` 内に、編集モーダルと `useMutation` を使った更新ロジックを実装します。

**ファイルを編集:** `src/routes/_layout/index.tsx`
（長くなるので、`RouteComponent`全体を置き換えるイメージです）

```tsx
// (既存のimportに以下を追加)
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { updateUser } from '@/features/user/api'

// (既存のコード ... Routeの定義まで)

// RouteComponent を以下のように編集
function RouteComponent() {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
  })

  // ユーザー更新のためのmutationを定義
  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      // 成功したら['users']クエリを無効化し、一覧を再取得させる
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null) // モーダルを閉じる
    },
    onError: (error) => {
      alert(`更新に失敗しました: ${error.message}`)
    },
  })

  // 編集ボタンを押したときの処理
  const handleEditClick = (user: User) => {
    setEditingUser(user)
  }

  // 編集フォームの送信処理
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingUser) return

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string

    mutation.mutate({ id: editingUser.id, name, email })
  }

  // テーブルのカラム定義に「操作」列を追加
  const userColumnsWithActions = [
    ...demoUserColumns,
    columnHelper.display({
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <button
          onClick={() => handleEditClick(row.original)}
          className="text-blue-500 hover:underline"
        >
          編集
        </button>
      ),
    }),
  ]

  const { page, pageSize } = Route.useSearch()
  const users = data?.users ?? []
  const table = useAppTable({
    data: users,
    columns: userColumnsWithActions, // アクション付きのカラムを使用
  })

  const navigate = Route.useNavigate()

  return (
    <div>
      <AppTable
        table={table}
        pagination={{
          // (paginationのpropsは変更なし)
        }}
      />

      {/* 編集モーダル */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl mb-4">{editingUser.name} を編集中</h2>
            <form onSubmit={handleFormSolve}>
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
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-200 px-4 py-2 rounded"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
                >
                  {mutation.isPending ? '更新中...' : '更新'}
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
