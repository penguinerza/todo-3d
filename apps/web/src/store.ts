import { create } from 'zustand'
import type { RapierRigidBody } from '@react-three/rapier'
import type { Todo } from '@todo3d/shared'
import * as api from './api'

export type Vec3 = [number, number, number]

export type Effect = {
  id: string
  kind: 'shatter' | 'banish'
  position: Vec3
  color: string
}

// Live physics bodies, so HUD buttons can find where a critter currently is.
export const bodies = new Map<string, RapierRigidBody>()

function positionOf(id: string): Vec3 {
  const body = bodies.get(id)
  if (!body) return [0, 0.75, 0]
  const { x, y, z } = body.translation()
  return [x, y, z]
}

function readMuted() {
  try {
    return localStorage.getItem('muted') === '1'
  } catch {
    return false
  }
}

type TodoState = {
  todos: Todo[]
  effects: Effect[]
  error: string | null
  muted: boolean
  load: () => Promise<void>
  add: (text: string) => Promise<void>
  complete: (id: string) => void
  banish: (id: string) => void
  resurrect: (id: string) => void
  remove: (id: string) => void
  clearEffect: (id: string) => void
  dismissError: () => void
  toggleMuted: () => void
}

export const useTodos = create<TodoState>()((set, get) => {
  const fail = (err: unknown) => {
    set({ error: err instanceof Error ? err.message : String(err) })
    get().load()
  }

  const replace = (todo: Todo) =>
    set((s) => ({ todos: s.todos.map((t) => (t.id === todo.id ? todo : t)) }))

  const spawnEffect = (kind: Effect['kind'], todo: Todo) =>
    set((s) => ({
      effects: [...s.effects, { id: crypto.randomUUID(), kind, position: positionOf(todo.id), color: todo.color }],
    }))

  return {
    todos: [],
    effects: [],
    error: null,
    muted: readMuted(),

    load: async () => {
      try {
        set({ todos: await api.fetchTodos() })
      } catch (err) {
        set({ error: err instanceof Error ? err.message : String(err) })
      }
    },

    add: async (text) => {
      try {
        const todo = await api.createTodo({ text })
        set((s) => ({ todos: [...s.todos, todo] }))
      } catch (err) {
        fail(err)
      }
    },

    complete: (id) => {
      const todo = get().todos.find((t) => t.id === id)
      if (!todo || todo.completedAt) return
      spawnEffect('shatter', todo)
      replace({ ...todo, completedAt: Date.now() })
      api.updateTodo(id, { completed: true }).then(replace, fail)
    },

    banish: (id) => {
      const todo = get().todos.find((t) => t.id === id)
      if (!todo) return
      spawnEffect('banish', todo)
      set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }))
      api.deleteTodo(id).catch(fail)
    },

    resurrect: (id) => {
      const todo = get().todos.find((t) => t.id === id)
      if (!todo) return
      replace({ ...todo, completedAt: null, epitaph: null })
      api.updateTodo(id, { completed: false }).then(replace, fail)
    },

    remove: (id) => {
      set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }))
      api.deleteTodo(id).catch(fail)
    },

    clearEffect: (id) => set((s) => ({ effects: s.effects.filter((e) => e.id !== id) })),

    dismissError: () => set({ error: null }),

    toggleMuted: () => {
      const muted = !get().muted
      set({ muted })
      try {
        localStorage.setItem('muted', muted ? '1' : '0')
      } catch {}
    },
  }
})
