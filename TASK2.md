# タスク2: ユーザーの追加、更新機能を追加する

## 概要

`useMutation` を利用したユーザー更新機能に、サーバーサイドでの入力値検証パターンを適用し、UIを新しいページネーションの仕組みに対応させ、**エラー表示を改善する**。

### 改訂のポイント

- **エラー表示の改善**: `useMutation` の `onError` でエラーメッセージをStateに保存し、モーダル内に表示するように変更する。

## ⚠️ 重要な注意点:

ユーザー情報を更新する際、`sessionTable`や`accountTable`の**トークンやIDを直接変更する必要は一切ありませんし、絶対に変更しないでください。**

ユーザーの追加をする場合は、better-authのapiを使用する。

---

## 実装手順

### 1. ユーザー追加、更新用のAPI関数を作成する

feature/user/api.ts

```ts
import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

//その他処理の下に

export const updateUserSchema = createInsertSchema(userTable).pick({
  id: true,
  name: true,
  email: true,
  role: true,
})

export const insertUserSchema = createInsertSchema(userTable)
  .pick({
    name: true,

    email: true,
  })

  .extend({
    password: z.string(),
  })

export const updateUserFn = createServerFn({ method: 'POST' })
  .inputValidator(updateUserSchema)

  .handler(async ({ data: { id, ...rest } }) => {
    await db.transaction(async (tx) => {
      if (id != null) {
        await tx

          .update(userTable)

          .set({
            ...rest,

            updatedAt: sql`now()`,
          })

          .where(eq(userTable.id, id))
      }
    })
  })

export const insertUserFn = createServerFn({ method: 'POST' })
  .inputValidator(insertUserSchema)

  .handler(async ({ data: { ...rest } }) => {
    return await db.transaction(async () => {
      await auth.api.signUpEmail({
        body: {
          ...rest,
        }, // これを追加すると、セッション（クッキー）が発行されません

        query: {
          disableSession: true,
        },
      })
    })
  })
```

### 2. UIコンポーネントを実装する

以下に実装する。

components/dialog/EditUserDialog

```tsx
import { useForm } from '@tanstack/react-form'

import { useMutation } from '@tanstack/react-query'

import { useState } from 'react'

import type { User } from '@/db/schema'

import {
  insertUserFn,
  insertUserSchema,
  updateUserFn,
  updateUserSchema,
} from '@/features/user/api'

export function EditUserDialog({
  user,

  onClose,
}: {
  user: User | null

  onClose: (edited: boolean) => void
}) {
  const [error, setError] = useState<string | null>(null) // 更新用 Mutation

  const updateUserMutation = useMutation({
    mutationFn: updateUserFn,

    onSuccess: () => onClose(true),

    onError: (err) => setError(err.message),
  }) // 作成用 Mutation

  const insertUserMutation = useMutation({
    mutationFn: insertUserFn,

    onSuccess: () => {
      onClose(true)
    },

    onError: (err) => setError(err.message),
  })

  const form = useForm({
    // user がある場合はその値を、ない場合は空文字を初期値にする

    defaultValues: {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition

      name: user?.name ?? '',

      email: user?.email ?? '',

      password: '',

      role: (user?.role as 'ADMIN' | 'USER') ?? 'USER',
    },

    onSubmit: ({ value }) => {
      if (user) {
        // 編集モード

        const parsed = updateUserSchema.safeParse({ ...value, id: user.id })

        if (!parsed.success) {
          setError(parsed.error.message)

          return
        }

        updateUserMutation.mutate({ data: parsed.data })
      } else {
        // 新規作成モード

        const parsed = insertUserSchema.safeParse(value)

        if (!parsed.success) {
          setError(parsed.error.message)

          return
        }

        insertUserMutation.mutate({ data: parsed.data })
      }
    },
  })

  const isPending = updateUserMutation.isPending || insertUserMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
       
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">
                    {user ? 'ユーザー編集' : '新規ユーザー作成'}     
        </h2>
         
        <form
          onSubmit={(e) => {
            e.preventDefault()

            e.stopPropagation()

            form.handleSubmit()
          }}
          className="grid gap-4"
        >
                   {' '}
          {error && <div className="text-red-500 text-sm">{error}</div>}       
           {' '}
          <form.Field name="name">
                       {' '}
            {(field) => (
              <div className="grid gap-1">
                               {' '}
                <label className="text-sm font-medium">名前</label>             
                 {' '}
                <input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="border p-2 rounded"
                  placeholder="山田 太郎"
                />
                       
              </div>
            )}
          </form.Field>
          <form.Field name="email">
            {(field) => (
              <div className="grid gap-1">
                <label className="text-sm font-medium">
                <input
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="border p-2 rounded"
                  placeholder="sample@example.com"
                  disabled={!!user} // 編集時はメール変更不可にする場合が多い
                />       
              </div>
            )}
          </form.Field>
          {/* 編集時はパスワード入力を任意にする（または非表示にする）などの調整が可能 */}
                 
          {!user && (
            <form.Field name="password">
                     
              {(field) => (
                <div className="grid gap-1">
                               
                  <label className="text-sm font-medium">パスワード</label>     
                       
                  <input
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="border p-2 rounded"
                  />
                           
                </div>
              )}
                         {' '}
            </form.Field>
          )}
                   {' '}
          {user && (
            <form.Field name="role">
                           {' '}
              {(field) => (
                <div className="grid gap-1">
                                   {' '}
                  <label className="text-sm font-medium">権限</label>           
                       {' '}
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value as any)}
                    className="border p-2 rounded bg-white"
                  >
                                       {' '}
                    <option value="USER">一般ユーザー</option>                 
                      <option value="ADMIN">管理者</option>               
                     {' '}
                  </select>
                                 {' '}
                </div>
              )}
                         {' '}
            </form.Field>
          )}
                   {' '}
          <div className="flex justify-end gap-2 mt-4">
                       {' '}
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              disabled={isPending}
            >
                            キャンセル            {' '}
            </button>
                       {' '}
            <button
              type="submit"
              disabled={isPending}
              className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 disabled:opacity-50"
            >
                           {' '}
              {isPending ? '保存中...' : user ? '更新する' : '作成する'}       
                 {' '}
            </button>
                     {' '}
          </div>
                 {' '}
        </form>
             {' '}
      </div>
         {' '}
    </div>
  )
}
```

### 3. UIコンポーネントを実装する

`RouteComponent` にエラー表示用のStateを追加し、`updateUserMutation` の `onError` ハンドラを更新し、モーダルのフォーム内にエラーメッセージを表示するロジックを追加します。

**ファイルを編集:** `src/routes/_layout/index.tsx`
(_この内容はタスク1, 3と共通のファイルです_)

```tsx
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { createFileRoute } from '@tanstack/react-router'

import { type ColumnDef } from '@tanstack/react-table'

import { useMemo, useState } from 'react'

import type { User } from '@/db/schema'

import type { UserResponse } from '@/features/user/api'

import { EditUserDialog } from '@/components/dialog/InsertUserDialog'

import { pagingSchema } from '@/features/paging'

import { getAllUsersFn } from '@/features/user/api'

import { DataTable } from '@/components/table/DataTable'

import { Pagination } from '@/components/table/Pagination'

export const Route = createFileRoute('/_layout/')({
  component: RouteComponent,

  validateSearch: pagingSchema,

  loaderDeps: ({ search }) => search,

  loader: async ({ context, deps }) => {
    const { page, pageSize } = deps

    await context.queryClient.ensureQueryData<UserResponse>({
      queryKey: ['users', page, pageSize],

      queryFn: () =>
        getAllUsersFn({ data: { page: page, pageSize: pageSize } }),
    })

    return { page, pageSize }
  },
})

function RouteComponent() {
  const { page, pageSize } = Route.useSearch()

  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [show, setShow] = useState<'insert' | 'update' | 'delete' | null>(null)

  const queryClient = useQueryClient()

  const columns = useMemo(() => {
    const column: ColumnDef<User>[] = [
      {
        accessorKey: 'id',

        header: 'ID',
      },

      {
        accessorKey: 'name',

        header: '名前',

        cell(cellProps) {
          return <>{cellProps.row.original.name}さん</>
        },
      },

      {
        accessorKey: 'email',

        header: 'メールアドレス',
      },

      {
        accessorKey: 'role',

        header: '権限',

        cell(cellProps) {
          return (
            <>
                           {' '}
              {cellProps.row.original.role === 'ADMIN'
                ? '管理者'
                : '一般ユーザー'}
                         {' '}
            </>
          )
        },
      },

      {
        accessorKey: 'createdAt',

        header: '作成日時',

        meta: {
          cellClass: 'whitespace-nowrap',
        },

        cell(cellProps) {
          return <>{cellProps.row.original.createdAt?.toLocaleString()}</>
        },
      },

      {
        id: 'actions',

        header: '操作',

        cell(cellProps) {
          const user = cellProps.row.original

          return (
            <button
              onClick={() => {
                setEditingUser(user)

                setShow('update')
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
                            編集            {' '}
            </button>
          )
        },
      },
    ]

    return column
  }, []) // 4. useQueryもloaderと同じキーと関数でデータを取得

  const { data } = useQuery({
    queryKey: ['users', page, pageSize],

    queryFn: () => getAllUsersFn({ data: { page: page, pageSize: pageSize } }),
  })

  const navigate = Route.useNavigate()

  return (
    <div>
           {' '}
      <div className="mb-4 flex justify-end">
               {' '}
        <button
          onClick={() => setShow('insert')}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
                    ユーザー新規作成        {' '}
        </button>
             {' '}
      </div>
            <DataTable<User> columns={columns} data={data?.users ?? []} />     {' '}
      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={data?.total ?? 0}
        currentPageCount={data?.users.length ?? 0}
        usePageSize
        onChangePage={(newPage) => {
          navigate({
            search: (prev) => ({
              ...prev,

              page: newPage,
            }),
          })
        }}
        onChangePageSize={(newPageSize) => {
          navigate({
            search: (prev) => ({
              ...prev,

              page: 0,

              pageSize: newPageSize,
            }),
          })
        }}
      />
           {' '}
      {show === 'insert' && (
        <EditUserDialog
          user={null}
          onClose={async (edited) => {
            if (edited) {
              await queryClient.refetchQueries({
                queryKey: ['users', page, pageSize],
              })
            }

            setShow(null)
          }}
        />
      )}
           {' '}
      {show === 'update' && (
        <EditUserDialog
          user={editingUser}
          onClose={async (edited) => {
            if (edited) {
              await queryClient.refetchQueries({
                queryKey: ['users', page, pageSize],
              })
            }

            setShow(null)
          }}
        />
      )}
         {' '}
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
