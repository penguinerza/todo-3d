import { Suspense, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { useTodos } from './store'
import { Arena, GRAVITY } from './scene/Arena'
import { TodoBlob } from './scene/TodoBlob'
import { Shatter } from './scene/Shatter'
import { Banish } from './scene/Banish'
import { Hud } from './ui/Hud'
import { Graveyard } from './ui/Graveyard'

export function App() {
  const todos = useTodos((s) => s.todos)
  const effects = useTodos((s) => s.effects)
  const load = useTodos((s) => s.load)

  useEffect(() => {
    load()
  }, [load])

  const roaming = useMemo(() => todos.filter((t) => !t.completedAt), [todos])

  return (
    <div className="app" onContextMenu={(e) => e.preventDefault()}>
      <Canvas shadows camera={{ position: [0, 22, 22], fov: 45 }}>
        <color attach="background" args={['#ffe8c7']} />
        <fog attach="fog" args={['#ffe8c7', 35, 70]} />
        <hemisphereLight args={['#fff6e5', '#9ce6ad', 1.2]} />
        <directionalLight
          position={[8, 16, 6]}
          intensity={2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
        />

        <Suspense fallback={null}>
          <Physics gravity={[0, -GRAVITY, 0]}>
            <Arena />
            {roaming.map((todo) => (
              <TodoBlob key={todo.id} todo={todo} />
            ))}
            {effects.map((effect) =>
              effect.kind === 'shatter' ? (
                <Shatter key={effect.id} effect={effect} />
              ) : (
                <Banish key={effect.id} effect={effect} />
              ),
            )}
          </Physics>
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={8}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.3}
        />
      </Canvas>

      <Hud />
      <Graveyard />
    </div>
  )
}
