import type { ApiError, CreateTodoBody, Todo, UpdateTodoBody } from '@todo3d/shared'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'content-type': 'application/json' },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null
    throw new Error(body?.error ?? res.statusText)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const fetchTodos = () => request<Todo[]>('/todos')

export const createTodo = (body: CreateTodoBody) =>
  request<Todo>('/todos', { method: 'POST', body: JSON.stringify(body) })

export const updateTodo = (id: string, body: UpdateTodoBody) =>
  request<Todo>(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(body) })

export const deleteTodo = (id: string) => request<void>(`/todos/${id}`, { method: 'DELETE' })
