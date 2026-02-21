import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  type RowData,
  type TableOptions,
  type Row,
  type Table,
  type Column,
} from '@tanstack/react-table'
import { cn } from '../utils'
import type { CSSProperties, ReactNode } from 'react'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClass?: string | null
    cellClass?: string | null
  }
}

export type DataTableProps<TData extends RowData> = Omit<
  TableOptions<TData>,
  'getCoreRowModel'
> & {
  noRecord?: ReactNode
  outlineClassName?: string
  onRowClick?: (row: Row<TData>, index: number) => void
}

export const DataTable = <TData extends RowData>({
  data,
  noRecord = <>データがありません。</>,
  outlineClassName,
  onRowClick,
  ...props
}: DataTableProps<TData>) => {
  const table = useReactTable({
    data,
    getCoreRowModel: getCoreRowModel(),
    ...props,
  })

  return (
    <div className={cn(outlineClassName)}>
      <table className="w-full text-left">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    className={cn(
                      'bg-white px-1 py-2 text-sm border-b border-gray-200',
                      header.column.columnDef.meta?.headerClass,
                    )}
                    style={{ ...getCommonPinningStyles(header.column) }}
                    ref={(thElem) =>
                      columnSizingHandler(thElem, table, header.column)
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                onClick={() => onRowClick && onRowClick(row, index)}
                className={cn('hover:bg-gray-100', {
                  'cursor-pointer': !!onRowClick,
                })}
              >
                {row.getVisibleCells().map((cell) => {
                  const cellContent = flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        'bg-white px-1 py-3 border-b border-gray-200',
                        cell.column.columnDef.meta?.cellClass,
                      )}
                      style={{ ...getCommonPinningStyles(cell.column) }}
                    >
                      {cellContent}
                    </td>
                  )
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={props.columns.length}
                className="h-24 text-center align-middle"
              >
                {noRecord}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const getCommonPinningStyles = <TData extends RowData, TValue = unknown>(
  column: Column<TData, TValue>,
): CSSProperties => {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right')

  return {
    boxShadow: isLastLeftPinnedColumn
      ? '-4px 0 4px -4px gray inset'
      : isFirstRightPinnedColumn
        ? '4px 0 4px -4px gray inset'
        : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'static',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}

/**
 * カラムの幅を更新する。
 * https://github.com/TanStack/table/discussions/3947 参照。
 * これをしないとカラム幅が150px固定のままで、横スクロールした時に2番目の固定カラムが1番目の固定カラムに食い込んでしまう。
 * @param thElem
 * @param table
 * @param column
 * @returns
 */
const columnSizingHandler = <TData,>(
  thElem: HTMLTableCellElement | null,
  table: Table<TData>,
  column: Column<TData>,
) => {
  if (!thElem) return
  // update when real width is different from stored width or not stored
  if (
    table.getState().columnSizing[column.id] === undefined ||
    table.getState().columnSizing[column.id] !==
      thElem.getBoundingClientRect().width
  ) {
    table.setColumnSizing((prevSizes) => ({
      ...prevSizes,
      [column.id]: thElem.getBoundingClientRect().width,
    }))
  }
}
