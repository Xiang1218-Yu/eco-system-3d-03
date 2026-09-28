import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Organism, Species } from '@/types/ecosystem';

interface ProducerModelProps {
  species: Species;
  organism: Organism;
}

export function ProducerModel({ species, organism }: ProducerModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.z = Math.sin(state.clock.elapsedTime * 1.2 + i * 0.5 + organism.position.x) * 0.1;
        }
      });
    }
  });

  const leafCount = species.id === 'seaweed' ? 5 : 3;
  const height = species.size;

  return (
    <group ref={groupRef}>
      <mesh position={[0, -species.size * 0.1, 0]}>
        <cylinderGeometry args={[0.05, 0.08, species.size * 0.15, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>

      {[...Array(leafCount)].map((_, i) => {
        const angle = (i / leafCount) * Math.PI * 2;
        const leafHeight = height * (0.4 + (i / leafCount) * 0.5);
        const radius = species.size * 0.3;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius * 0.3,
              leafHeight * 0.5,
              Math.sin(angle) * radius * 0.3,
            ]}
            rotation={[0, angle, Math.PI / 4]}
          >
            <coneGeometry args={[species.size * 0.15, leafHeight, 6]} />
            <meshStandardMaterial
              color={species.color}
              emissive={species.color}
              emissiveIntensity={0.1}
              roughness={0.6}
              flatShading
            />
          </mesh>
        );
      })}

      <pointLight color={species.color} intensity={0.3} distance={1} />
    </group>
  );
}
