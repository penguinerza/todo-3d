import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const BLOB_RADIUS = 0.6
export const BLOB_HEIGHT = 1.5

const EYE_X = 0.21
const EYE_Y = 0.32
const PUPIL_TRAVEL = 0.075

type BlobProps = {
  color: string
  scared?: boolean
  velocity?: RefObject<THREE.Vector3>
}

export function Blob({ color, scared = false, velocity }: BlobProps) {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[BLOB_RADIUS, BLOB_RADIUS, BLOB_HEIGHT, 32]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
      <GooglyEyes scared={scared} velocity={velocity} />
      <Mouth open={scared} />
    </group>
  )
}

function GooglyEyes({ scared, velocity }: { scared: boolean; velocity?: RefObject<THREE.Vector3> }) {
  const left = useRef<THREE.Mesh>(null)
  const right = useRef<THREE.Mesh>(null)
  const sim = useRef([0, 1].map(() => ({ pos: new THREE.Vector2(), vel: new THREE.Vector2() })))

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const v = velocity?.current
    const speed = v ? Math.hypot(v.x, v.z) : 0
    // Pupils hang low like real googly eyes; jumping and falling fling them around.
    const restY = -PUPIL_TRAVEL * 0.6 - (v ? v.y * 0.01 : 0)
    const jitter = scared ? 3 : speed * 0.6

    sim.current.forEach((s, i) => {
      const pupil = (i === 0 ? left : right).current
      if (!pupil) return
      s.vel.x += (-180 * s.pos.x - 5 * s.vel.x) * dt + (Math.random() - 0.5) * jitter
      s.vel.y += (-180 * (s.pos.y - restY) - 5 * s.vel.y) * dt + (Math.random() - 0.5) * jitter
      s.pos.addScaledVector(s.vel, dt)
      if (s.pos.length() > PUPIL_TRAVEL) {
        s.pos.setLength(PUPIL_TRAVEL)
        s.vel.multiplyScalar(-0.5)
      }
      pupil.position.x = (i === 0 ? -EYE_X : EYE_X) + s.pos.x
      pupil.position.y = EYE_Y + s.pos.y
    })
  })

  const pupilScale: [number, number, number] = scared ? [0.55, 0.55, 0.4] : [1, 1, 0.4]

  return (
    <>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * EYE_X, EYE_Y, BLOB_RADIUS - 0.03]} scale={[1, 1, 0.45]}>
          <sphereGeometry args={[0.17, 20, 16]} />
          <meshStandardMaterial color="white" roughness={0.25} />
        </mesh>
      ))}
      <mesh ref={left} position={[-EYE_X, EYE_Y, BLOB_RADIUS + 0.06]} scale={pupilScale}>
        <sphereGeometry args={[0.075, 16, 12]} />
        <meshBasicMaterial color="black" />
      </mesh>
      <mesh ref={right} position={[EYE_X, EYE_Y, BLOB_RADIUS + 0.06]} scale={pupilScale}>
        <sphereGeometry args={[0.075, 16, 12]} />
        <meshBasicMaterial color="black" />
      </mesh>
    </>
  )
}

function Mouth({ open }: { open: boolean }) {
  if (open) {
    return (
      <mesh position={[0, 0.02, BLOB_RADIUS + 0.005]}>
        <circleGeometry args={[0.1, 20]} />
        <meshBasicMaterial color="#3a0a14" />
      </mesh>
    )
  }
  return (
    <mesh position={[0, 0.08, BLOB_RADIUS + 0.01]} rotation-z={Math.PI}>
      <torusGeometry args={[0.12, 0.025, 8, 20, Math.PI]} />
      <meshBasicMaterial color="#3a0a14" />
    </mesh>
  )
}
