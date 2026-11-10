import { useMemo, useState } from 'react'
import { useTodos } from '../store'
import { sfx } from '../sfx'

const formatDate = (ts: number) =>
  new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export function Graveyard() {
  const todos = useTodos((s) => s.todos)
  const resurrect = useTodos((s) => s.resurrect)
  const remove = useTodos((s) => s.remove)
  const [open, setOpen] = useState(true)

  const buried = useMemo(
    () => todos.filter((t) => t.completedAt).sort((a, b) => b.completedAt! - a.completedAt!),
    [todos],
  )

  return (
    <section className="panel graveyard">
      <button className="graveyard-header" onClick={() => setOpen(!open)} aria-expanded={open}>
        <h2>Graveyard</h2>
        <span className="count">{buried.length}</span>
        <span className="chevron">{open ? '-' : '+'}</span>
      </button>

      {open &&
        (buried.length === 0 ? (
          <p className="empty">Nobody's dead yet. Get to work.</p>
        ) : (
          <ul className="tombstones">
            {buried.map((todo) => (
              <li key={todo.id} className="tombstone">
                <span className="rip">RIP</span>
                <p className="tomb-text">{todo.text}</p>
                <p className="tomb-date">Finished {formatDate(todo.completedAt!)}</p>
                {todo.epitaph && <p className="epitaph">"{todo.epitaph}"</p>}
                <div className="tomb-actions">
                  <button
                    onClick={() => {
                      sfx.pop()
                      resurrect(todo.id)
                    }}
                  >
                    Resurrect
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      sfx.sad()
                      remove(todo.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}
