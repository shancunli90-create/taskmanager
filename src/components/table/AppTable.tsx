import { flexRender, type Table } from '@tanstack/react-table'
import { Pagination, type PageState } from './Pagination'

type AppTableProps<T> = {
  table: Table<T>

  pagination?: PageState & {
    totalCount: number
    currentPageCount: number
    onChangePage: (page: number) => void
    onChangePageSize: (size: number) => void
  }
}

export function AppTable<T>({ table, pagination }: AppTableProps<T>) {
  return (
    <div className="w-full space-y-4">
      <table className="w-full border">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer border p-2"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalCount={pagination.totalCount}
          currentPageCount={pagination.currentPageCount}
          onChangePage={pagination.onChangePage}
          onChangePageSize={pagination.onChangePageSize}
        />
      )}
    </div>
  )
}
