import { DataTable } from '@/components/table/DataTable'
import { Pagination } from '@/components/table/Pagination'
import type { User } from '@/db/schema'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

const demoUsers: User[] = [
  {
    id: '1',
    name: '山田 太郎',
    email: 'taro@example.com',
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: false,
  },
  {
    id: '2',
    name: '佐藤 花子',
    email: 'hanako@example.com',
    role: 'USER',

    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: false,
  },
  {
    id: '3',
    name: '鈴木 一郎',
    email: 'ichiro@example.com',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: false,
  },
]
const columnHelper = createColumnHelper<User>()

export const demoUserColumns = [
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
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  return (
    <div>
      <DataTable columns={demoUserColumns} data={demoUsers ?? []} />
      <Pagination
        page={0}
        pageSize={20}
        totalCount={3}
        currentPageCount={3}
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
    </div>
  )
}
