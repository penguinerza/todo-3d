export type Todo = {
  id: string
  text: string
  color: string
  createdAt: number
  completedAt: number | null
  epitaph: string | null
}

export type CreateTodoBody = {
  text: string
}

export type UpdateTodoBody = {
  completed: boolean
}

export type ApiError = {
  error: string
}

export const TODO_TEXT_MAX = 200
