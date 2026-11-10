import { useState } from 'react'
import { Html } from '@react-three/drei'
import type { Vec3 } from '../store'

export function PopText({ position, choices }: { position: Vec3; choices: string[] }) {
  const [text] = useState(() => choices[Math.floor(Math.random() * choices.length)])
  return (
    <Html position={position} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div className="pop">{text}</div>
    </Html>
  )
}
