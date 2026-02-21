# タスク: ユーザー一覧をDBからページネーションで取得する (改訂版)

## 概要

`loader`と`react-query`を連携させるこれまでの実装をベースに、ご提示いただいたベストプラクティスを全面的に採用する。

### 改訂のポイント

- **ページネーション対応**: 全件取得ではなく、指定されたページと件数分だけユーザーを取得するように変更する。
- **サーバーサイドバリデーション**: `createServerFn` の `.inputValidator()` を使い、サーバー側でページネーションの入力値を検証する。
- **並列データ取得**: `Promise.all` を使い、「ユーザー一覧データ」と「総ユーザー数」を並列で取得し、パフォーマンスを向上させる。

## 実装手順

### 2. ページネーション対応のAPI関数を作成する

`getAllUsers` 関数を改修し、ページネーションパラメータを受け取り、ユーザーデータと総件数を返すようにします。

**ファイルを編集:** `src/features/user/api.ts`

```ts
import { db } from '@/db'
import { userTable } from '@/db/schema'
import { pagingSchema } from '@/features/paging'
import { createServerFn } from '@tanstack/react-start'
import { asc, count } from 'drizzle-orm'

// getAllUsersFnから帰ってくる型情報の生成
export type UserResponse = Awaited<ReturnType<typeof getAllUsersFn>>
//
export const getAllUsersFn = createServerFn({ method: 'GET' }) // 1. Zodスキーマでサーバーへの入力を検証
  .inputValidator(pagingSchema) // 2. handlerは検証済みのデータを `data` として受け取る
  .handler(async ({ data }) => {
    // 3. トランザクション内で2つのクエリを並列実行
    return await db.transaction(async (tx) => {
      const [users, totalResult] = await Promise.all([
        // ユーザーデータをページ指定で取得
        tx.query.userTable.findMany({
          limit: data.pageSize,
          offset: data.page * data.pageSize,
          orderBy: [asc(userTable.createdAt)],
        }), // 総ユーザー数を取得
        tx.select({ value: count() }).from(userTable),
      ])
      return {
        users,
        total: totalResult[0].value,
      }
    })
  })

// (updateUser, deleteUser は後続のタスクで改修)
```

### 3. フロントエンドを改修する

`loader` が `page`, `pageSize` を `queryFn` に渡すようにし、コンポーネントは取得した総件数をページネーションに正しく反映させます。

**ファイルを編集:** `src/routes/_layout/index.tsx`

```tsx
import { AppTable } from '@/components/table/AppTable'
import { useAppTable } from '@/components/table/useAppTable'
import type { User } from '@/db/schema'
import { pagingSchema } from '@/features/paging'
import { getAllUsersFn, type UserResponse } from '@/features/user/api'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

const columnHelper = createColumnHelper<User>()

const demoUserColumns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor('name', {
    header: '名前',
    cell: (info) => {
      return <div>{info.getValue()}さん</div>
    },
  }),

  columnHelper.accessor('email', {
    header: 'メールアドレス',
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor('role', {
    header: '権限',
    cell: (info) => (info.getValue() === 'ADMIN' ? '管理者' : '一般ユーザー'),
  }),

  columnHelper.accessor('createdAt', {
    header: '作成日',
    cell: (info) => {
      return info.getValue().toDateString()
    },
  }),
]

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
  // 4. useQueryもloaderと同じキーと関数でデータを取得
  const { data } = useQuery({
    queryKey: ['users', page, pageSize],

    queryFn: () => getAllUsersFn({ data: { page: page, pageSize: pageSize } }),
  })

  const table = useAppTable({
    data: data?.users ?? [],

    columns: demoUserColumns,
  })

  const navigate = Route.useNavigate()

  return (
    <div>
      <AppTable
        table={table}
        pagination={{
          page: page,

          pageSize: pageSize,

          totalCount: data?.total ?? 0, // 5. APIから取得した総件数を設定

          currentPageCount: data?.users.length ?? 0,

          onChangePage: (newPage) => {
            navigate({
              search: (prev) => ({
                ...prev,

                page: newPage,
              }),
            })
          },

          onChangePageSize: (newPageSize) => {
            navigate({
              search: (prev) => ({
                ...prev,

                page: 0,

                pageSize: newPageSize,
              }),
            })
          },
        }}
      />
    </div>
  )
}
```
