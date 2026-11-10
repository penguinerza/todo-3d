import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { CylinderCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Todo } from '@todo3d/shared'
import { bodies, useTodos, type Vec3 } from '../store'
import { ARENA_SIZE, GRAVITY, randomInArena } from './Arena'
import { Blob, BLOB_HEIGHT, BLOB_RADIUS } from './Blob'

const TURN_SPEED = 5
const CROUCH_TIME = 0.22
const LAND_SQUASH_TIME = 0.15
const TRICK_CHANCE = 0.35
const ROAM_LIMIT = ARENA_SIZE - 1.5

type Phase = 'rest' | 'turn' | 'crouch' | 'air'
type Trick = 'none' | 'flip' | 'spin'

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

export function TodoBlob({ todo }: { todo: Todo }) {
  const complete = useTodos((s) => s.complete)
  const banish = useTodos((s) => s.banish)
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<THREE.Group>(null)
  const velocity = useRef(new THREE.Vector3())
  const [hovered, setHovered] = useState(false)
  const [spawn] = useState<Vec3>(() => [randomInArena(), 7 + Math.random() * 3, randomInArena()])
  const brain = useRef({
    phase: 'air' as Phase,
    until: 0,
    yaw: Math.random() * Math.PI * 2,
    targetYaw: 0,
    jumpDistance: 0,
    jumpAt: -1,
    // Generous so the spawn drop counts as one long jump.
    airTime: 3,
    landedAt: -1,
    trick: 'none' as Trick,
  })

  useEffect(
    () => () => {
      bodies.delete(todo.id)
      document.body.style.cursor = ''
    },
    [todo.id],
  )

  useEffect(() => {
    visual.current?.rotation.reorder('YXZ')
  }, [])

  useFrame((state, delta) => {
    const rb = body.current
    const group = visual.current
    if (!rb || !group) return
    bodies.set(todo.id, rb)

    const t = state.clock.elapsedTime
    const p = rb.translation()
    const v = rb.linvel()
    velocity.current.set(v.x, v.y, v.z)
    const grounded = p.y < BLOB_HEIGHT / 2 + 0.1 && Math.abs(v.y) < 0.5
    const b = brain.current
    if (b.jumpAt < 0) b.jumpAt = t

    if (p.y < -5) {
      rb.setTranslation({ x: 0, y: 6, z: 0 }, true)
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }

    switch (b.phase) {
      case 'rest': {
        if (hovered || t < b.until || Math.abs(v.y) > 0.3) break
        const heading = Math.random() * Math.PI * 2
        const reach = rand(2, 6)
        let tx = THREE.MathUtils.clamp(p.x + Math.sin(heading) * reach, -ROAM_LIMIT, ROAM_LIMIT)
        let tz = THREE.MathUtils.clamp(p.z + Math.cos(heading) * reach, -ROAM_LIMIT, ROAM_LIMIT)
        if (Math.hypot(tx - p.x, tz - p.z) < 1) {
          tx = randomInArena()
          tz = randomInArena()
        }
        b.targetYaw = Math.atan2(tx - p.x, tz - p.z)
        b.jumpDistance = Math.min(Math.hypot(tx - p.x, tz - p.z), 7)
        b.phase = 'turn'
        break
      }
      case 'turn': {
        const remaining = wrapAngle(b.targetYaw - b.yaw)
        const step = TURN_SPEED * delta
        if (Math.abs(remaining) <= step) {
          b.yaw = b.targetYaw
          b.phase = 'crouch'
          b.until = t + CROUCH_TIME
        } else {
          b.yaw += Math.sign(remaining) * step
        }
        break
      }
      case 'crouch': {
        if (t < b.until) break
        const mass = rb.mass()
        const up = rand(6, 9)
        b.airTime = (2 * up) / GRAVITY
        const forward = b.jumpDistance / b.airTime
        rb.applyImpulse(
          { x: Math.sin(b.yaw) * forward * mass, y: up * mass, z: Math.cos(b.yaw) * forward * mass },
          true,
        )
        b.jumpAt = t
        b.trick = Math.random() < TRICK_CHANCE ? (Math.random() < 0.5 ? 'flip' : 'spin') : 'none'
        b.phase = 'air'
        break
      }
      case 'air': {
        const since = t - b.jumpAt
        // The second check catches critters that landed on top of another one.
        const landed = since > 0.15 && (grounded || (since > b.airTime + 0.5 && Math.abs(v.y) < 0.3))
        if (!landed) break
        rb.setLinvel({ x: 0, y: v.y, z: 0 }, true)
        b.phase = 'rest'
        b.until = t + rand(0.3, 1.5)
        b.landedAt = t
        b.trick = 'none'
        break
      }
    }

    let pitch = 0
    let spin = 0
    if (b.phase === 'air' && b.trick !== 'none') {
      const turn = THREE.MathUtils.smoothstep((t - b.jumpAt) / b.airTime, 0, 1) * Math.PI * 2
      if (b.trick === 'flip') pitch = turn
      else spin = turn
    }
    group.rotation.set(pitch, b.yaw + spin, 0)

    let stretch = THREE.MathUtils.clamp(1 + v.y * 0.04, 0.8, 1.3)
    if (b.phase === 'crouch') stretch = 1 - 0.3 * (1 - (b.until - t) / CROUCH_TIME)
    else if (t - b.landedAt < LAND_SQUASH_TIME) stretch = 1 - 0.25 * (1 - (t - b.landedAt) / LAND_SQUASH_TIME)
    const size = hovered ? 1.12 : 1
    group.scale.set(size / Math.sqrt(stretch), size * stretch, size / Math.sqrt(stretch))
  })

  return (
    <RigidBody
      ref={body}
      position={spawn}
      colliders={false}
      enabledRotations={[false, false, false]}
      friction={0.4}
    >
      <CylinderCollider args={[BLOB_HEIGHT / 2, BLOB_RADIUS]} />
      <group
        ref={visual}
        onClick={(e) => {
          e.stopPropagation()
          complete(todo.id)
        }}
        onContextMenu={(e) => {
          e.stopPropagation()
          banish(todo.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = ''
        }}
      >
        <Blob color={todo.color} scared={hovered} velocity={velocity} />
      </group>
      <Html position={[0, BLOB_HEIGHT / 2 + 0.5, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className={hovered ? 'label label-full' : 'label'}>{todo.text}</div>
      </Html>
    </RigidBody>
  )
}
