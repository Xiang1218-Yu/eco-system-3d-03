import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Organism, Species } from '@/types/ecosystem';

interface HerbivoreModelProps {
  species: Species;
  organism: Organism;
}

export function HerbivoreModel({ species, organism }: HerbivoreModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 8) * 0.4;
    }
    if (groupRef.current) {
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 3 + organism.position.x) * 0.003;
    }
  });

  const size = species.size * 0.4;

  if (species.id === 'snail') {
    return (
      <group ref={groupRef}>
        <mesh position={[0, -size * 0.2, 0]}>
          <sphereGeometry args={[size * 0.8, 16, 16]} />
          <meshStandardMaterial color={species.color} roughness={0.5} />
        </mesh>
        <mesh position={[size * 0.5, size * 0.1, 0]}>
          <sphereGeometry args={[size * 0.35, 12, 12]} />
          <meshStandardMaterial color="#F5DEB3" roughness={0.6} />
        </mesh>
        <mesh position={[size * 0.7, size * 0.3, size * 0.1]}>
          <sphereGeometry args={[size * 0.08, 8, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[size * 0.7, size * 0.3, -size * 0.1]}>
          <sphereGeometry args={[size * 0.08, 8, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    );
  }

  if (species.id === 'turtle') {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshStandardMaterial color={species.color} roughness={0.4} flatShading />
        </mesh>
        <mesh position={[0, -size * 0.1, 0]}>
          <sphereGeometry args={[size * 1.05, 16, 16]} />
          <meshStandardMaterial color="#3D5A1E" roughness={0.6} flatShading />
        </mesh>
        <mesh position={[size * 1.1, 0, 0]}>
          <sphereGeometry args={[size * 0.4, 12, 12]} />
          <meshStandardMaterial color="#8FBC8F" roughness={0.5} />
        </mesh>
        <mesh position={[size * 1.35, size * 0.1, size * 0.1]}>
          <sphereGeometry args={[size * 0.08, 8, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[size * 1.35, size * 0.1, -size * 0.1]}>
          <sphereGeometry args={[size * 0.08, 8, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[size * 0.5, -size * 0.7, size * 0.6]}>
          <sphereGeometry args={[size * 0.25, 8, 8]} />
          <meshStandardMaterial color="#8FBC8F" roughness={0.5} />
        </mesh>
        <mesh position={[size * 0.5, -size * 0.7, -size * 0.6]}>
          <sphereGeometry args={[size * 0.25, 8, 8]} />
          <meshStandardMaterial color="#8FBC8F" roughness={0.5} />
        </mesh>
        <mesh position={[-size * 0.5, -size * 0.7, size * 0.6]}>
          <sphereGeometry args={[size * 0.25, 8, 8]} />
          <meshStandardMaterial color="#8FBC8F" roughness={0.5} />
        </mesh>
        <mesh position={[-size * 0.5, -size * 0.7, -size * 0.6]}>
          <sphereGeometry args={[size * 0.25, 8, 8]} />
          <meshStandardMaterial color="#8FBC8F" roughness={0.5} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={species.color}
          emissive={species.color}
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[size * 0.8, 0, 0]}>
        <coneGeometry args={[size * 0.6, size * 0.8, 12]} />
        <meshStandardMaterial
          color={species.color}
          emissive={species.color}
          emissiveIntensity={0.1}
          roughness={0.3}
        />
      </mesh>
      <mesh ref={tailRef} position={[-size * 0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[size * 0.5, size * 0.8, 8]} />
        <meshStandardMaterial color={species.color} roughness={0.3} />
      </mesh>
      <mesh position={[size * 1.0, size * 0.2, size * 0.2]}>
        <sphereGeometry args={[size * 0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[size * 1.05, size * 0.22, size * 0.22]}>
        <sphereGeometry args={[size * 0.05, 8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[size * 1.0, size * 0.2, -size * 0.2]}>
        <sphereGeometry args={[size * 0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[size * 1.05, size * 0.22, -size * 0.22]}>
        <sphereGeometry args={[size * 0.05, 8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, size * 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[size * 0.3, size * 0.5, 4]} />
        <meshStandardMaterial color={species.color} roughness={0.4} transparent opacity={0.7} />
      </mesh>
      <pointLight color={species.color} intensity={0.2} distance={1.5} />
    </group>
  );
}
