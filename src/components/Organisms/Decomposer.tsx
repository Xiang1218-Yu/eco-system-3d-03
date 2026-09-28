import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Organism, Species } from '@/types/ecosystem';

interface DecomposerModelProps {
  species: Species;
  organism: Organism;
}

export function DecomposerModel({ species, organism }: DecomposerModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 2;
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 3 + organism.position.x) * 0.003;

      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && i > 0) {
          child.position.y = Math.sin(state.clock.elapsedTime * 3 + i) * 0.05;
          child.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2 + i * 0.5) * 0.1);
        }
      });
    }
  });

  const size = species.size * 0.5;

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[size, 1]} />
        <meshStandardMaterial
          color={species.color}
          emissive={species.color}
          emissiveIntensity={0.4}
          roughness={0.3}
          wireframe
        />
      </mesh>
      <mesh position={[size * 0.8, size * 0.3, 0]}>
        <sphereGeometry args={[size * 0.3, 8, 8]} />
        <meshStandardMaterial
          color={species.color}
          emissive={species.color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh position={[-size * 0.6, -size * 0.4, size * 0.3]}>
        <sphereGeometry args={[size * 0.25, 8, 8]} />
        <meshStandardMaterial
          color={species.color}
          emissive={species.color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh position={[size * 0.2, -size * 0.5, -size * 0.5]}>
        <sphereGeometry args={[size * 0.2, 8, 8]} />
        <meshStandardMaterial
          color={species.color}
          emissive={species.color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>
      <pointLight color={species.color} intensity={0.5} distance={1.5} />
    </group>
  );
}
