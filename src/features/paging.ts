import { z } from 'zod'

export const DEFAULT_PAGE = 0
export const DEFAULT_PAGE_SIZE = 20

export const pagingSchema = z.object({
  page: z.number().min(0).optional().default(DEFAULT_PAGE),
  pageSize: z.number().min(1).optional().default(DEFAULT_PAGE_SIZE),
})
