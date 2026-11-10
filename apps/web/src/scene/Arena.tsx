import { useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

export const ARENA_SIZE = 12
export const GRAVITY = 20

export const randomInArena = () => (Math.random() * 2 - 1) * (ARENA_SIZE - 1.5)

const WALL_HEIGHT = 6
const FENCE_HEIGHT = 0.5
const FENCE_THICKNESS = 0.3

export function Arena() {
  const checker = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 2
    const g = canvas.getContext('2d')!
    g.fillStyle = '#b8f2c2'
    g.fillRect(0, 0, 2, 2)
    g.fillStyle = '#9ce6ad'
    g.fillRect(0, 0, 1, 1)
    g.fillRect(1, 1, 1, 1)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(ARENA_SIZE, ARENA_SIZE)
    texture.magFilter = THREE.NearestFilter
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])

  const edge = ARENA_SIZE + 0.5
  const fenceOffset = ARENA_SIZE + FENCE_THICKNESS / 2
  const fenceLength = ARENA_SIZE * 2 + FENCE_THICKNESS * 2

  return (
    <>
      <RigidBody type="fixed" colliders={false} friction={0.8}>
        <CuboidCollider args={[ARENA_SIZE, 0.5, ARENA_SIZE]} position={[0, -0.5, 0]} />
        <CuboidCollider args={[ARENA_SIZE, WALL_HEIGHT, 0.5]} position={[0, WALL_HEIGHT, edge]} />
        <CuboidCollider args={[ARENA_SIZE, WALL_HEIGHT, 0.5]} position={[0, WALL_HEIGHT, -edge]} />
        <CuboidCollider args={[0.5, WALL_HEIGHT, ARENA_SIZE]} position={[edge, WALL_HEIGHT, 0]} />
        <CuboidCollider args={[0.5, WALL_HEIGHT, ARENA_SIZE]} position={[-edge, WALL_HEIGHT, 0]} />
      </RigidBody>

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ARENA_SIZE * 2, ARENA_SIZE * 2]} />
        <meshStandardMaterial map={checker} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#ffd8a8" />
      </mesh>

      {[
        { position: [0, FENCE_HEIGHT / 2, fenceOffset], size: [fenceLength, FENCE_HEIGHT, FENCE_THICKNESS] },
        { position: [0, FENCE_HEIGHT / 2, -fenceOffset], size: [fenceLength, FENCE_HEIGHT, FENCE_THICKNESS] },
        { position: [fenceOffset, FENCE_HEIGHT / 2, 0], size: [FENCE_THICKNESS, FENCE_HEIGHT, fenceLength] },
        { position: [-fenceOffset, FENCE_HEIGHT / 2, 0], size: [FENCE_THICKNESS, FENCE_HEIGHT, fenceLength] },
      ].map(({ position, size }, i) => (
        <mesh key={i} position={position as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={size as [number, number, number]} />
          <meshStandardMaterial color="#ff8fab" />
        </mesh>
      ))}
    </>
  )
}
