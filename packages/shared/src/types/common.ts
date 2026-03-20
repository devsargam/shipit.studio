import type { Status, Role } from "../enums"

export type WithId<T> = T & { id: string }

export type Timestamps = {
  createdAt: Date
  updatedAt: Date
}

export type User = {
  name: string
  email: string
  role: Role
  status: Status
} & Timestamps

export type ApiResponse<T> = {
  data: T
  success: boolean
  message?: string
}

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  total: number
  page: number
  pageSize: number
}
