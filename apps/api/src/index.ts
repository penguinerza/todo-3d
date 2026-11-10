import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { TODO_TEXT_MAX, type CreateTodoBody, type UpdateTodoBody } from '@todo3d/shared'
import { createTodo, deleteTodo, getTodo, listTodos, updateCompletion } from './db'

const COLORS = ['#ff5c8a', '#ffb800', '#3ddc97', '#4cc9f0', '#9b5de5', '#ff7b00', '#f15bb5']

const EPITAPHS = [
  'It fought bravely. It lost.',
  'Gone, but not forgotten. Mostly forgotten.',
  'Finally did the thing.',
  'Died doing what it loved: being done.',
  'Should have been done yesterday.',
  'Survived by zero subtasks.',
  'Productivity claims another victim.',
  'Rest in pieces.',
  'It never saw it coming.',
  'Was a task. Is now a memory.',
]

const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]

const app = new Hono().basePath('/api')

app.get('/todos', (c) => c.json(listTodos()))

app.post('/todos', async (c) => {
  const body = await c.req.json<Partial<CreateTodoBody>>().catch(() => ({}) as Partial<CreateTodoBody>)
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text || text.length > TODO_TEXT_MAX) {
    return c.json({ error: `text must be 1-${TODO_TEXT_MAX} characters` }, 400)
  }
  const previousColor = listTodos().at(-1)?.color
  const color = pick(COLORS.filter((c) => c !== previousColor))
  const todo = createTodo({ id: randomUUID(), text, color, createdAt: Date.now() })
  return c.json(todo, 201)
})

app.patch('/todos/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Partial<UpdateTodoBody>>().catch(() => ({}) as Partial<UpdateTodoBody>)
  if (typeof body.completed !== 'boolean') {
    return c.json({ error: 'completed must be a boolean' }, 400)
  }
  if (!getTodo(id)) return c.json({ error: 'not found' }, 404)

  const todo = body.completed
    ? updateCompletion(id, Date.now(), pick(EPITAPHS))
    : updateCompletion(id, null, null)
  return c.json(todo)
})

app.delete('/todos/:id', (c) => {
  if (!deleteTodo(c.req.param('id'))) return c.json({ error: 'not found' }, 404)
  return c.body(null, 204)
})

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port }, () => console.log(`api listening on :${port}`))
