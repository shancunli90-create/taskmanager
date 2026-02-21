import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'
import { memo } from 'react'

export type PageState = {
  page: number
  pageSize: number
}

type PaginationProps = PageState & {
  totalCount: number
  currentPageCount: number
  usePageSize?: boolean

  onChangePage: (page: number) => void
  onChangePageSize: (pageSize: number) => void
}

export const Pagination = memo(function Pagination({
  page = 0,
  pageSize = 20,
  totalCount = 0,
  currentPageCount = 0,
  usePageSize = true,
  onChangePage,
  onChangePageSize,
}: PaginationProps) {
  if (totalCount === 0) return null

  const startCount = page * pageSize + 1
  const endCount = Math.min(startCount + currentPageCount - 1, totalCount)

  const endPage = Math.max(Math.ceil(totalCount / pageSize) - 1, 0)
  const isFirst = page === 0
  const isLast = page >= endPage

  return (
    <div className="w-full flex items-center sm:justify-between max-sm:flex-wrap max-sm:gap-x-8 max-sm:gap-y-2">
      {usePageSize && (
        <div className="flex items-center space-x-2">
          <select
            value={pageSize}
            onChange={(e) => onChangePageSize(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {[20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <div className="text-sm">件 / ページ</div>
        </div>
      )}

      <div className="text-sm">
        全 {totalCount} 件 中 {startCount} 件目 ~ {endCount} 件目
      </div>

      <div className="flex items-center space-x-2">
        <button
          disabled={isFirst}
          onClick={() => onChangePage(0)}
          className="p-2 disabled:opacity-40"
        >
          <ChevronsLeftIcon size={16} />
        </button>

        <button
          disabled={isFirst}
          onClick={() => onChangePage(page - 1)}
          className="p-2 disabled:opacity-40"
        >
          <ChevronLeftIcon size={16} />
        </button>

        <button
          disabled={isLast}
          onClick={() => onChangePage(page + 1)}
          className="p-2 disabled:opacity-40"
        >
          <ChevronRightIcon size={16} />
        </button>

        <button
          disabled={isLast}
          onClick={() => onChangePage(endPage)}
          className="p-2 disabled:opacity-40"
        >
          <ChevronsRightIcon size={16} />
        </button>
      </div>
    </div>
  )
})
