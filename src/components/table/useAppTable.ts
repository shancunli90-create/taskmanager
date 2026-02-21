import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
} from '@tanstack/react-table'

export function useAppTable<T>({
  data,
  columns,
}: {
  data: T[]
  columns: ColumnDef<T, any>[]
}) {
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
}
