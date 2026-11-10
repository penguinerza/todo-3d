import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTodos, type Effect } from '../store'
import { sfx } from '../sfx'
import { Blob } from './Blob'
import { PopText } from './PopText'

const KICK_AT = 0.6
const FLIGHT = 0.55
const PORTAL_CLOSE_AT = 1.5
const LIFETIME = 2
const PORTAL_OFFSET = new THREE.Vector3(2.6, 0.6, 0)
const BOOT_PIVOT_OFFSET = new THREE.Vector3(-1, 2.6, 0)
// Half facing the critter, half facing the default camera, so it never shows up edge-on.
const PORTAL_YAW = -Math.PI / 2 + 0.7
const INSULTS = ['BEGONE!', 'BANISHED!', 'OUT!', 'NOPE.', 'SHOO!']

const clamp01 = (n: number) => THREE.MathUtils.clamp(n, 0, 1)
const easeOutBack = (t: number) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2

// Rotation of the boot around its hip: wind up, then swing through the critter.
function bootAngle(age: number) {
  if (age < 0.25) return -0.2
  if (age < 0.5) return THREE.MathUtils.lerp(-0.2, -1, (age - 0.25) / 0.25)
  return THREE.MathUtils.lerp(-1, 0.6, clamp01((age - 0.5) / (KICK_AT - 0.5)))
}

export function Banish({ effect }: { effect: Effect }) {
  const clearEffect = useTodos((s) => s.clearEffect)
  const victim = useRef<THREE.Group>(null)
  const portal = useRef<THREE.Group>(null)
  const swirl = useRef<THREE.Group>(null)
  const boot = useRef<THREE.Group>(null)
  const start = useRef<number | null>(null)
  const played = useRef(new Set<string>())

  const origin = new THREE.Vector3(...effect.position)
  const portalCenter = origin.clone().add(PORTAL_OFFSET)
  const bootPivot = origin.clone().add(BOOT_PIVOT_OFFSET)

  useFrame((state, delta) => {
    start.current ??= state.clock.elapsedTime
    const age = state.clock.elapsedTime - start.current
    const at = (name: string, time: number, run: () => void) => {
      if (age >= time && !played.current.has(name)) {
        played.current.add(name)
        run()
      }
    }
    at('whoosh', 0, sfx.whoosh)
    at('kick', KICK_AT, sfx.kick)
    at('plop', PORTAL_CLOSE_AT, sfx.plop)
    at('done', LIFETIME, () => clearEffect(effect.id))

    if (!victim.current || !portal.current || !swirl.current || !boot.current) return

    const portalScale =
      age < 0.4 ? easeOutBack(age / 0.4) : age < PORTAL_CLOSE_AT ? 1 : 1 - clamp01((age - PORTAL_CLOSE_AT) / 0.35)
    portal.current.scale.setScalar(Math.max(portalScale, 0.001))
    swirl.current.rotation.z -= delta * 6

    const bootScale = age < 0.25 ? age / 0.25 : 1 - clamp01((age - 1.1) / 0.25)
    boot.current.scale.setScalar(Math.max(bootScale, 0.001))
    boot.current.rotation.z = bootAngle(age)

    if (age < KICK_AT) {
      victim.current.position.set(
        origin.x + (Math.random() - 0.5) * 0.06,
        origin.y,
        origin.z + (Math.random() - 0.5) * 0.06,
      )
    } else {
      const k = clamp01((age - KICK_AT) / FLIGHT)
      victim.current.position.lerpVectors(origin, portalCenter, k)
      victim.current.position.y += Math.sin(k * Math.PI) * 1.2
      victim.current.rotation.z -= delta * 18
      victim.current.scale.setScalar(Math.max(1 - k * 0.9, 0.001))
      victim.current.visible = k < 1
    }
  })

  return (
    <>
      <group ref={victim} position={origin}>
        <Blob color={effect.color} scared />
      </group>

      <group ref={portal} position={portalCenter} rotation-y={PORTAL_YAW}>
        <mesh>
          <circleGeometry args={[1, 40]} />
          <meshBasicMaterial color="#1a0533" side={THREE.DoubleSide} />
        </mesh>
        <group ref={swirl} position-z={0.01}>
          {[0.3, 0.55, 0.8].map((radius, i) => (
            <mesh key={radius} rotation-z={i * 2.1}>
              <torusGeometry args={[radius, 0.035, 6, 32, Math.PI * 1.2]} />
              <meshBasicMaterial color="#c77dff" />
            </mesh>
          ))}
        </group>
        <mesh>
          <torusGeometry args={[1, 0.09, 12, 48]} />
          <meshStandardMaterial color="#9d4edd" emissive="#9d4edd" emissiveIntensity={1.5} />
        </mesh>
        <pointLight color="#c77dff" intensity={8} distance={6} />
      </group>

      <group ref={boot} position={bootPivot}>
        <mesh position={[0, -0.8, 0]} castShadow>
          <boxGeometry args={[0.4, 1.6, 0.4]} />
          <meshStandardMaterial color="#3b5bdb" />
        </mesh>
        <mesh position={[0.15, -1.75, 0]} castShadow>
          <boxGeometry args={[0.75, 0.45, 0.5]} />
          <meshStandardMaterial color="#6b3e1f" />
        </mesh>
        <mesh position={[0.15, -1.99, 0]}>
          <boxGeometry args={[0.8, 0.08, 0.54]} />
          <meshStandardMaterial color="#2b1608" />
        </mesh>
      </group>

      <PopText position={[portalCenter.x, portalCenter.y + 1.6, portalCenter.z]} choices={INSULTS} />
    </>
  )
}
