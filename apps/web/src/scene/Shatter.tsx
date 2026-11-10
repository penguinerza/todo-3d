import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useTodos, type Effect, type Vec3 } from '../store'
import { sfx } from '../sfx'
import { BLOB_HEIGHT, BLOB_RADIUS } from './Blob'
import { Confetti } from './Confetti'
import { PopText } from './PopText'

const SLICES = 8
const LAYERS = 3
const FADE_AT = 1.6
const LIFETIME = 2.8
const CHEERS = ['DONE!', 'SMASHED!', 'YEET!', 'BONK!', '+1 ADULTING']

const rand = (min: number, max: number) => min + Math.random() * (max - min)

type Shard = { geometry: THREE.BufferGeometry; position: Vec3; velocity: Vec3; spin: Vec3 }

export function Shatter({ effect }: { effect: Effect }) {
  const clearEffect = useTodos((s) => s.clearEffect)
  const [x, y, z] = effect.position
  const start = useRef<number | null>(null)
  const done = useRef(false)

  const layerHeight = BLOB_HEIGHT / LAYERS
  const shards = useMemo(() => {
    const result: Shard[] = []
    const arc = (Math.PI * 2) / SLICES
    for (let layer = 0; layer < LAYERS; layer++) {
      for (let slice = 0; slice < SLICES; slice++) {
        const mid = (slice + 0.5) * arc
        const cx = Math.sin(mid) * BLOB_RADIUS * 0.6
        const cz = Math.cos(mid) * BLOB_RADIUS * 0.6
        const cy = -BLOB_HEIGHT / 2 + layerHeight * (layer + 0.5)
        const geometry = new THREE.CylinderGeometry(BLOB_RADIUS, BLOB_RADIUS, layerHeight, 3, 1, false, slice * arc, arc)
        geometry.translate(-cx, 0, -cz)
        const dir = new THREE.Vector3(cx, rand(0.4, 1.2), cz).normalize().multiplyScalar(rand(4, 8))
        result.push({
          geometry,
          position: [x + cx, y + cy, z + cz],
          velocity: [dir.x, dir.y, dir.z],
          spin: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
        })
      }
    }
    return result
  }, [x, y, z, layerHeight])

  const materials = useMemo(
    () => ({
      shard: new THREE.MeshStandardMaterial({ color: effect.color, transparent: true, side: THREE.DoubleSide }),
      eye: new THREE.MeshStandardMaterial({ color: 'white', transparent: true }),
      pupil: new THREE.MeshBasicMaterial({ color: 'black', transparent: true }),
    }),
    [effect.color],
  )

  useEffect(
    () => () => {
      shards.forEach((s) => s.geometry.dispose())
      Object.values(materials).forEach((m) => m.dispose())
    },
    [shards, materials],
  )

  useFrame((state) => {
    if (start.current === null) {
      start.current = state.clock.elapsedTime
      sfx.smash()
    }
    const age = state.clock.elapsedTime - start.current
    const opacity = THREE.MathUtils.clamp(1 - (age - FADE_AT) / (LIFETIME - FADE_AT), 0, 1)
    Object.values(materials).forEach((m) => (m.opacity = opacity))
    if (age > LIFETIME && !done.current) {
      done.current = true
      clearEffect(effect.id)
    }
  })

  return (
    <>
      {shards.map((s, i) => (
        <RigidBody key={i} position={s.position} linearVelocity={s.velocity} angularVelocity={s.spin} colliders={false}>
          <CuboidCollider args={[0.13, layerHeight * 0.4, 0.13]} />
          <mesh geometry={s.geometry} material={materials.shard} castShadow />
        </RigidBody>
      ))}

      {[-1, 1].map((side) => (
        <RigidBody
          key={side}
          position={[x + side * 0.2, y + 0.4, z + BLOB_RADIUS]}
          linearVelocity={[side * rand(2, 4), rand(8, 11), rand(2, 4)]}
          angularVelocity={[rand(-8, 8), rand(-8, 8), rand(-8, 8)]}
          colliders={false}
          restitution={0.8}
        >
          <BallCollider args={[0.17]} />
          <mesh material={materials.eye}>
            <sphereGeometry args={[0.17, 16, 12]} />
          </mesh>
          <mesh material={materials.pupil} position={[0, 0, 0.14]}>
            <sphereGeometry args={[0.075, 12, 8]} />
          </mesh>
        </RigidBody>
      ))}

      <Confetti origin={effect.position} />
      <PopText position={[x, y + 1.6, z]} choices={CHEERS} />
    </>
  )
}
