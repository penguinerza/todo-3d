import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '../store'

const COUNT = 60
const COLORS = ['#ff5c8a', '#ffb800', '#3ddc97', '#4cc9f0', '#9b5de5', '#ffffff']
const rand = (min: number, max: number) => min + Math.random() * (max - min)

export function Confetti({ origin }: { origin: Vec3 }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const pieces = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        position: new THREE.Vector3(...origin),
        velocity: new THREE.Vector3(rand(-5, 5), rand(6, 12), rand(-5, 5)),
        rotation: new THREE.Euler(rand(0, 6), rand(0, 6), 0),
        spin: rand(-15, 15),
      })),
    [origin],
  )

  useLayoutEffect(() => {
    const m = mesh.current!
    const color = new THREE.Color()
    for (let i = 0; i < COUNT; i++) m.setColorAt(i, color.set(COLORS[i % COLORS.length]))
    m.instanceColor!.needsUpdate = true
  }, [])

  useFrame((_, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 1 / 30)
    pieces.forEach((p, i) => {
      p.velocity.y -= 18 * dt
      p.velocity.multiplyScalar(0.98)
      p.position.addScaledVector(p.velocity, dt)
      if (p.position.y < 0.02) {
        p.position.y = 0.02
        p.velocity.set(0, 0, 0)
      } else {
        p.rotation.x += p.spin * dt
        p.rotation.y += p.spin * 0.7 * dt
      }
      dummy.position.copy(p.position)
      dummy.rotation.copy(p.rotation)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[0.12, 0.2]} />
      <meshStandardMaterial side={THREE.DoubleSide} />
    </instancedMesh>
  )
}
