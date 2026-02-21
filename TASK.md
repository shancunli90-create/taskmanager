# タスク: ユーザー一覧を `loader` と `react-query` で連携させて取得するように改修する

## 概要

`useQuery` のみでデータを取得する場合、コンポーネントがマウントされてからデータ取得が開始されるため、初回表示時に「ローディング中...」の画面が表示されてしまう。

このタスクでは、TanStack Routerの `loader` 機能を使ってルーティングの段階でデータを**先読み (pre-fetch)** し、TanStack Queryのキャッシュに入れることで、初回ロード時のローディング画面をなくし、ユーザー体験を向上させる。

## 実装手順

### 1. ページネーション用のスキーマを定義する

まず、URLの検索パラメータ (`?page=0&pageSize=10` など) を検証し、型を保証するためのスキーマを `zod` で定義します。

**ファイルを確認/作成:** `src/features/paging.ts`

```ts
import { z } from 'zod'

// ページネーションのパラメータを検証するスキーマ
// pageやpageSizeが不正な値の場合、catchでデフォルト値を設定する
export const pagingSchema = z.object({
  page: z.number().int().min(0).catch(0),
  pageSize: z.number().int().min(1).catch(10),
})
```

### 2. ユーザー取得用のAPI関数を作成する (変更なし)

サーバーサイドで全ユーザーを取得する関数です。これは変更ありません。

**ファイル:** `src/features/user/api.ts`

```ts
import { db } from '@/db'
import { userTable } from '@/db/schema'
import { createServerFn } from '@tanstack/react-start/server'

export const getAllUsers = createServerFn('GET', async () => {
  console.log('Fetching all users from server...')
  const users = await db.select().from(userTable)
  return { users }
})
```

### 3. `loader` でデータを先読みし、コンポーネントで `useQuery` を使う

`createFileRoute` に `validateSearch` と `loader` を追加します。`loader` 内で `queryClient.ensureQueryData` を呼び出してデータをキャッシュに格納します。
コンポーネント側では、`loader` と同じ `queryKey` を使って `useQuery` でデータを取得します。

**ファイルを編集:** `src/routes/_layout/index.tsx`

```tsx
import { AppTable } from '@/components/table/AppTable'
import { useAppTable } from '@/components/table/useAppTable'
import type { User } from '@/db/schema'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllUsers } from '@/features/user/api'
import { pagingSchema } from '@/features/paging' // <-- 1. ページングスキーマをインポート

// (demoUsers は削除)
const columnHelper = createColumnHelper<User>()
// (demoUserColumns の定義は変更なし)
export const demoUserColumns = [
  // ...
]

export const Route = createFileRoute('/_layout/')({
  // 2. URLの検索パラメータを検証
  validateSearch: pagingSchema,
  // 3. loaderでデータを先読み
  loader: async ({ context }) => {
    // サーバーサイドでデータを取得し、キャッシュに入れる
    await context.queryClient.ensureQueryData({
      queryKey: ['users'],
      queryFn: getAllUsers,
    })
    return
  },
  component: RouteComponent,
})

function RouteComponent() {
  // 4. useQueryでデータを取得 (loaderでキャッシュ済みなので即座に表示される)
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
  })

  // 5. ローダーはデータを返さないので、isLoading/isErrorはここで管理する
  //    ただし、初回ロードでは suspense や isPending を使わない限りローディングは表示されない
  // if (isLoading) return <div>データを読み込み中です...</div>
  // if (isError) return <div>エラーが発生しました: {error.message}</div>

  const { page, pageSize } = Route.useSearch() // 6. 検証済みの検索パラメータを取得
  const users = data?.users ?? []
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
          totalCount: users.length,
          currentPageCount: users.length,
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

### 【重要な補足】 なぜ`loader`と`useQuery`の両方が必要なのか？

`loader`で`ensureQueryData`を実行しているにも関わらず、コンポーネント側でも`useQuery`を呼び出すのは、それぞれが異なる重要な役割を担っているためです。

| 機能 | `loader` の `ensureQueryData` | コンポーネントの `useQuery` |
| :--- | :--- | :--- |
| **役割** | データを**先読み**してキャッシュに入れる | キャッシュからデータを**取り出し、購読**する |
| **タイミング** | コンポーネントがレンダリングされる**前** | コンポーネントがレンダリングされる**時** |
| **目的** | 初回ロードの高速化（ローディング画面をなくす） | データの表示、自動更新、ライフサイクル管理 |

#### `useQuery` が必要な理由

1.  **データへのアクセス**: `loader`がキャッシュに入れたデータを、コンポーネントが取り出すための標準的な方法が`useQuery`です。

2.  **リアクティブ性の確保（最重要）**: `useQuery`はコンポーネントをキャッシュデータに**「購読（subscribe）」**させます。これにより、別の場所でデータが更新された際（例：`useMutation`の成功後）に、自動でコンポーネントが再レンダリングされ、UIが常に最新の状態に保たれます。もし`useQuery`を使わないと、UIは古いデータを表示し続けてしまいます。

3.  **キャッシュのライフサイクル管理**: `useQuery`は、データが不要になった際のキャッシュの削除（ガベージコレクション）なども管理してくれます。

#### 「二重にフェッチしないの？」

`useQuery`は、`queryKey`（この場合は`['users']`）に紐づく有効なキャッシュが既に存在する場合、**ネットワークリクエストを再実行することなく**、キャッシュからデータを即座に返します。そのため、パフォーマンス上の懸念はありません。

この`loader` + `useQuery`の組み合わせは、「**初回ロードは最速にしつつ、その後のデータの鮮度も自動で保つ**」という、ユーザー体験を最大化するためのベストプラクティスです。

### 4. 確認

1.  `pnpm dev` で開発サーバーを起動する。
2.  トップページ (`http://localhost:3000`) をリロードする。
3.  **「データを読み込み中です...」という表示が一瞬も出ずに、** ユーザー一覧が表示されることを確認する。これが `loader` によるプリフェッチの効果です。
