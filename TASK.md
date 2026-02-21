# タスク: ユーザー一覧をDBからページネーションで取得する (改訂版)

## 概要

`loader`と`react-query`を連携させるこれまでの実装をベースに、ご提示いただいたベストプラクティスを全面的に採用する。

### 改訂のポイント
*   **ページネーション対応**: 全件取得ではなく、指定されたページと件数分だけユーザーを取得するように変更する。
*   **サーバーサイドバリデーション**: `createServerFn` の `.inputValidator()` を使い、サーバー側でページネーションの入力値を検証する。
*   **並列データ取得**: `Promise.all` を使い、「ユーザー一覧データ」と「総ユーザー数」を並列で取得し、パフォーマンスを向上させる。

## 実装手順

### 1. ページネーション用のスキーマを定義する (変更なし)

URLの検索パラメータ (`?page=0&pageSize=10` など) を検証するためのスキーマです。

**ファイル:** `src/features/paging.ts`
```ts
import { z } from 'zod'

export const pagingSchema = z.object({
  page: z.number().int().min(0).catch(0),
  pageSize: z.number().int().min(1).catch(10),
})
```

### 2. ページネーション対応のAPI関数を作成する

`getAllUsers` 関数を改修し、ページネーションパラメータを受け取り、ユーザーデータと総件数を返すようにします。

**ファイルを編集:** `src/features/user/api.ts`
```ts
import { db } from '@/db'
import { userTable, type User } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start/server'
import { pagingSchema } from '@/features/paging'
import { count } from 'drizzle-orm'

export const getAllUsers = createServerFn({ method: 'GET' })
  // 1. Zodスキーマでサーバーへの入力を検証
  .inputValidator(pagingSchema)
  // 2. handlerは検証済みのデータを `data` として受け取る
  .handler(async ({ data }) => {
    // 3. トランザクション内で2つのクエリを並列実行
    return await db.transaction(async (tx) => {
      const [users, totalResult] = await Promise.all([
        // ユーザーデータをページ指定で取得
        tx.query.userTable.findMany({
          limit: data.pageSize,
          offset: data.page * data.pageSize,
          orderBy: (users, { asc }) => [asc(users.createdAt)],
        }),
        // 総ユーザー数を取得
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
// ... (他のimport)
import { useQuery } from '@tanstack/react-query'
import { getAllUsers } from '@/features/user/api'
import { pagingSchema } from '@/features/paging'

// (demoUserColumns の定義は変更なし)

export const Route = createFileRoute('/_layout/')({
  validateSearch: pagingSchema,
  // 1. loaderDepsを追加して、searchパラメータの変更をloaderに伝える
  loaderDeps: ({ search: { page, pageSize } }) => ({ page, pageSize }),
  // 2. loaderはdepsからページ情報を取得する
  loader: async ({ context, deps }) => {
    const { page, pageSize } = deps
    // 3. queryKeyにページ情報を含め、queryFnに渡す
    await context.queryClient.ensureQueryData({
      queryKey: ['users', page, pageSize],
      queryFn: () => getAllUsers({ page, pageSize }),
    })
    return
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { page, pageSize } = Route.useSearch()

  // 4. useQueryもloaderと同じキーと関数でデータを取得
  const { data } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => getAllUsers({ page, pageSize }),
  })

  const users = data?.users ?? []
  const totalCount = data?.total ?? 0

  const table = useAppTable({
    data: users,
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
          totalCount: totalCount, // 5. APIから取得した総件数を設定
          currentPageCount: users.length,
          onChangePage: (newPage) => {
            navigate({ search: (prev) => ({ ...prev, page: newPage }) })
          },
          onChangePageSize: (newPageSize) => {
            navigate({ search: (prev) => ({ ...prev, page: 0, pageSize: newPageSize }) })
          },
        }}
      />
    </div>
  )
}
```