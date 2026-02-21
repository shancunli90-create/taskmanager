# タスク3: ユーザー削除機能の追加 (管理者限定)

## 概要

ユーザー一覧テーブルに「削除」ボタンを追加し、管理者(ADMIN)権限を持つユーザーのみが他のユーザーを削除できるようにする。

### 実装要件

1.  **管理者限定**: ログインしているユーザーのロールが `ADMIN` でない場合、削除ボタンは表示されない。また、サーバーサイドでも必ず権限チェックを行う。
2.  **自己削除の禁止**: ログインしているユーザーが自分自身を削除しようとした場合、クライアントサイドで警告を表示し、処理を中止する。サーバーサイドでも念のためチェックを行う。
3.  **確認ダイアログ**: 削除は取り消せない操作のため、実行前に必ず確認ダイアログを表示する。

---

## 実装手順

### 1. 現在のログインユーザー情報を取得するAPI関数を作成する

まず、クライアントとサーバーの両方で「今ログインしているのは誰か？」を知る必要があります。そのためのAPI関数を `session` feature に作成します。

**ファイルを作成/編集:** `src/features/session/api.ts`

```ts
import { auth } from '@/lib/better-auth/auth'
import { createServerFn } from '@tanstack/react-start/server'

// 現在のセッションユーザー情報を取得するサーバー関数
export const getSessionUser = createServerFn('GET', async () => {
  const session = await auth.getSession()
  return session?.user ?? null
})
```

### 2. ユーザー削除用のAPI関数を作成する (権限チェック付き)

次に、サーバーサイドでユーザーを削除する関数を作成します。この際、**必ずサーバー側で実行ユーザーの権限チェックと自己削除チェックを行います。**

**ファイルを編集:** `src/features/user/api.ts`

```ts
// (既存のimportに以下を追加)
import { auth } from '@/lib/better-auth/auth'

// (既存の getAllUsers, updateUser 関数)

// --- ここから追加 ---

// ユーザーを削除するサーバー関数
export const deleteUser = createServerFn('POST', async (userIdToDelete: string) => {
  // 1. 現在のセッションを取得
  const session = await auth.getSession()
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
// --- ここまで追加 ---
```

### 3. UIに削除ボタンとロジックを実装する

最後に、`_layout/index.tsx` に削除ボタンを追加し、権限に応じた表示制御と、`useMutation` を使った削除処理を実装します。

**ファイルを編集:** `src/routes/_layout/index.tsx`
(変更点が多いので、`RouteComponent` の全体像を記載します)

```tsx
// (既存のimportに以下を追加)
import { getSessionUser } from '@/features/session/api'
import { deleteUser } from '@/features/user/api'

// (既存のコード ... Routeの定義まで)

function RouteComponent() {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // 1. 現在のログインユーザー情報を取得
  const { data: sessionUser } = useQuery({
    queryKey: ['sessionUser'],
    queryFn: getSessionUser,
  })

  const { data: usersQuery } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
  })

  // (更新用のmutationは変更なし)
  const updateUserMutation = useMutation({ ... })

  // 2. 削除用のmutationを定義
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      alert(`削除に失敗しました: ${error.message}`)
    },
  })

  // 削除ボタンを押したときの処理
  const handleDeleteClick = (userToDelete: User) => {
    // 3. 自己削除のクライアント側チェック
    if (sessionUser?.id === userToDelete.id) {
      alert('自分自身を削除することはできません。')
      return
    }

    // 4. 確認ダイアログ
    if (window.confirm(`本当に「${userToDelete.name}」さんを削除しますか？`)) {
      deleteUserMutation.mutate(userToDelete.id)
    }
  }

  // (編集のハンドラは変更なし)
  const handleEditClick = (user: User) => { ... }
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => { ... }

  // 5. ログインユーザーの権限に応じて操作列を動的に生成
  const userColumnsWithActions = [
    ...demoUserColumns,
    columnHelper.display({
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditClick(row.original)}
            className="text-blue-500 hover:underline"
          >
            編集
          </button>
          {/* 管理者の場合のみ削除ボタンを表示 */}
          {sessionUser?.role === 'ADMIN' && (
            <button
              onClick={() => handleDeleteClick(row.original)}
              disabled={deleteUserMutation.isPending}
              className="text-red-500 hover:underline disabled:text-gray-400"
            >
              削除
            </button>
          )}
        </div>
      ),
    }),
  ]

  // (以降のreturn文は、tableのcolumnsを userColumnsWithActions にする以外はほぼ変更なし)
  // ...
}
```

### 4. 確認

1.  **管理者ユーザーでログイン**
    *   ユーザー一覧に「削除」ボタンが表示されていることを確認する。
    *   他のユーザーの「削除」ボタンをクリックし、確認ダイアログが表示され、OKを押すとユーザーが一覧から消えることを確認する。
    *   自分自身の行の「削除」ボタンをクリックし、「自分自身を削除することはできません。」というアラートが表示され、削除処理が実行されないことを確認する。

2.  **一般ユーザーでログイン**
    *   ユーザー一覧の操作列に「削除」ボタンが**表示されていない**ことを確認する。
