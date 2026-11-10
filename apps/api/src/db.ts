import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import type { Todo } from '@todo3d/shared'

mkdirSync('data', { recursive: true })
const db = new DatabaseSync('data/todos.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    epitaph TEXT
  )
`)

type TodoRow = {
  id: string
  text: string
  color: string
  created_at: number
  completed_at: number | null
  epitaph: string | null
}

const toTodo = (row: TodoRow): Todo => ({
  id: row.id,
  text: row.text,
  color: row.color,
  createdAt: row.created_at,
  completedAt: row.completed_at,
  epitaph: row.epitaph,
})

const selectAll = db.prepare('SELECT * FROM todos ORDER BY created_at')
const selectOne = db.prepare('SELECT * FROM todos WHERE id = ?')
const insert = db.prepare(
  'INSERT INTO todos (id, text, color, created_at) VALUES (?, ?, ?, ?)',
)
const setCompletion = db.prepare(
  'UPDATE todos SET completed_at = ?, epitaph = ? WHERE id = ?',
)
const remove = db.prepare('DELETE FROM todos WHERE id = ?')

export function listTodos(): Todo[] {
  return (selectAll.all() as TodoRow[]).map(toTodo)
}

export function getTodo(id: string): Todo | undefined {
  const row = selectOne.get(id) as TodoRow | undefined
  return row && toTodo(row)
}

export function createTodo(todo: Pick<Todo, 'id' | 'text' | 'color' | 'createdAt'>): Todo {
  insert.run(todo.id, todo.text, todo.color, todo.createdAt)
  return getTodo(todo.id)!
}

export function updateCompletion(id: string, completedAt: number | null, epitaph: string | null) {
  setCompletion.run(completedAt, epitaph, id)
  return getTodo(id)
}

export function deleteTodo(id: string): boolean {
  return remove.run(id).changes > 0
}
