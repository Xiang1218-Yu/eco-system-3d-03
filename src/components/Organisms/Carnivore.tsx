import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Organism, Species } from '@/types/ecosystem';

interface CarnivoreModelProps {
  species: Species;
  organism: Organism;
}

export function CarnivoreModel({ species, organism }: CarnivoreModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 10) * 0.5;
    }
    if (groupRef.current) {
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 4 + organism.position.x) * 0.004;
      const intensity = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      const light = groupRef.current.children.find(
        (c) => c instanceof THREE.PointLight,
      ) as THREE.PointLight;
      if (light) light.intensity = intensity;
    }
  });

  const size = species.size * 0.45;

  if (species.id === 'frog') {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshStandardMaterial
            color={species.color}
            emissive={species.color}
            emissiveIntensity={0.1}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[size * 0.6, size * 0.3, 0]}>
          <sphereGeometry args={[size * 0.6, 16, 16]} />
          <meshStandardMaterial color={species.color} roughness={0.4} />
        </mesh>
        <mesh position={[size * 0.8, size * 0.6, size * 0.2]}>
          <sphereGeometry args={[size * 0.25, 12, 12]} />
          <meshStandardMaterial color="#fff" roughness={0.2} />
        </mesh>
        <mesh position={[size * 0.85, size * 0.6, size * 0.2]}>
          <sphereGeometry args={[size * 0.12, 8, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[size * 0.8, size * 0.6, -size * 0.2]}>
          <sphereGeometry args={[size * 0.25, 12, 12]} />
          <meshStandardMaterial color="#fff" roughness={0.2} />
        </mesh>
        <mesh position={[size * 0.85, size * 0.6, -size * 0.2]}>
          <sphereGeometry args={[size * 0.12, 8, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[size * 0.3, -size * 0.6, size * 0.5]}>
          <sphereGeometry args={[size * 0.3, 10, 10]} />
          <meshStandardMaterial color={species.color} roughness={0.4} />
        </mesh>
        <mesh position={[size * 0.3, -size * 0.6, -size * 0.5]}>
          <sphereGeometry args={[size * 0.3, 10, 10]} />
          <meshStandardMaterial color={species.color} roughness={0.4} />
        </mesh>
        <mesh position={[-size * 0.4, -size * 0.4, size * 0.4]}>
          <sphereGeometry args={[size * 0.2, 8, 8]} />
          <meshStandardMaterial color={species.color} roughness={0.4} />
        </mesh>
        <mesh position={[-size * 0.4, -size * 0.4, -size * 0.4]}>
          <sphereGeometry args={[size * 0.2, 8, 8]} />
          <meshStandardMaterial color={species.color} roughness={0.4} />
        </mesh>
        <pointLight color={species.color} intensity={0.2} distance={1.5} />
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[size * 1.1, 16, 16]} />
        <meshStandardMaterial
          color={species.color}
          emissive={species.color}
          emissiveIntensity={0.2}
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[size * 1.0, 0, 0]}>
        <coneGeometry args={[size * 0.7, size * 1.0, 12]} />
        <meshStandardMaterial
          color={species.color}
          emissive={species.color}
          emissiveIntensity={0.15}
          roughness={0.25}
        />
      </mesh>
      <mesh ref={tailRef} position={[-size * 1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[size * 0.6, size * 1.0, 8]} />
        <meshStandardMaterial color={species.color} roughness={0.25} />
      </mesh>
      <mesh position={[size * 1.4, size * 0.25, size * 0.25]}>
        <sphereGeometry args={[size * 0.13, 8, 8]} />
        <meshStandardMaterial color="#fff" roughness={0.1} />
      </mesh>
      <mesh position={[size * 1.48, size * 0.28, size * 0.28]}>
        <sphereGeometry args={[size * 0.07, 8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[size * 1.4, size * 0.25, -size * 0.25]}>
        <sphereGeometry args={[size * 0.13, 8, 8]} />
        <meshStandardMaterial color="#fff" roughness={0.1} />
      </mesh>
      <mesh position={[size * 1.48, size * 0.28, -size * 0.28]}>
        <sphereGeometry args={[size * 0.07, 8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[size * 1.6, -size * 0.1, 0]}>
        <coneGeometry args={[size * 0.08, size * 0.3, 6]} />
        <meshStandardMaterial color="#fff" roughness={0.1} />
      </mesh>
      <mesh position={[0, size * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[size * 0.4, size * 0.6, 4]} />
        <meshStandardMaterial
          color={species.color}
          roughness={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>
      <pointLight color={species.color} intensity={0.3} distance={2} />
    </group>
  );
}
