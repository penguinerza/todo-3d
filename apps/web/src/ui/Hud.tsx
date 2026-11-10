import { useMemo, useState, type FormEvent } from 'react'
import { TODO_TEXT_MAX } from '@todo3d/shared'
import { useTodos } from '../store'
import { sfx } from '../sfx'

export function Hud() {
  const todos = useTodos((s) => s.todos)
  const add = useTodos((s) => s.add)
  const complete = useTodos((s) => s.complete)
  const banish = useTodos((s) => s.banish)
  const error = useTodos((s) => s.error)
  const dismissError = useTodos((s) => s.dismissError)
  const muted = useTodos((s) => s.muted)
  const toggleMuted = useTodos((s) => s.toggleMuted)
  const [text, setText] = useState('')

  const roaming = useMemo(() => todos.filter((t) => !t.completedAt), [todos])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')
    sfx.pop()
    add(trimmed)
  }

  return (
    <>
      <div className="panel zoo">
        <div className="zoo-header">
          <h1>Chore Zoo</h1>
          <button className="mute" onClick={toggleMuted} aria-pressed={muted}>
            {muted ? 'Sound off' : 'Sound on'}
          </button>
        </div>
        <p className="hint">
          Click a critter to finish it. Right-click to banish it forever.
        </p>
        {roaming.length === 0 ? (
          <p className="empty">The zoo is empty. Suspicious.</p>
        ) : (
          <ul className="roaming">
            {roaming.map((todo) => (
              <li key={todo.id}>
                <span className="swatch" style={{ background: todo.color }} />
                <span className="roaming-text" title={todo.text}>
                  {todo.text}
                </span>
                <button onClick={() => complete(todo.id)}>Done</button>
                <button className="danger" onClick={() => banish(todo.id)}>
                  Banish
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form className="spawn" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs doing?"
          maxLength={TODO_TEXT_MAX}
          autoFocus
        />
        <button type="submit" disabled={!text.trim()}>
          Spawn
        </button>
      </form>

      {error && (
        <div className="toast" role="alert">
          <span>Something broke: {error}</span>
          <button onClick={dismissError}>OK</button>
        </div>
      )}
    </>
  )
}
