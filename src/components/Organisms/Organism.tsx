import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Organism, Species } from '@/types/ecosystem';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { ProducerModel } from './Producer';
import { HerbivoreModel } from './Herbivore';
import { CarnivoreModel } from './Carnivore';
import { DecomposerModel } from './Decomposer';

interface Organism3DProps {
  organism: Organism;
  species: Species;
}

export function Organism3D({ organism, species }: Organism3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const setSelectedOrganism = useEcosystemStore((s) => s.setSelectedOrganism);
  const selectedOrganismId = useEcosystemStore((s) => s.selectedOrganismId);
  const showLabels = useEcosystemStore((s) => s.showLabels);
  const isSelected = selectedOrganismId === organism.id;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.copy(organism.position);

      const targetRotation = organism.rotation;
      const currentRotation = groupRef.current.rotation.y;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        currentRotation,
        targetRotation,
        0.1,
      );

      if (species.trophicLevel === 'producer') {
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + organism.position.x) * 0.08;
      } else if (species.speed > 0) {
        const swimPhase = state.clock.elapsedTime * 4 + organism.position.x * 2;
        groupRef.current.position.y += Math.sin(swimPhase) * 0.002;
      }

      const targetScale = organism.scale * (hovered || isSelected ? 1.2 : 1);
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedOrganism(organism.id);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const renderModel = () => {
    switch (species.trophicLevel) {
      case 'producer':
        return <ProducerModel species={species} organism={organism} />;
      case 'herbivore':
        return <HerbivoreModel species={species} organism={organism} />;
      case 'carnivore':
        return <CarnivoreModel species={species} organism={organism} />;
      case 'decomposer':
        return <DecomposerModel species={species} organism={organism} />;
      default:
        return null;
    }
  };

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {renderModel()}

      {(isSelected || hovered) && showLabels && (
        <Html
          position={[0, species.size + 0.3, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="px-3 py-1.5 rounded-full text-white text-xs font-bold whitespace-nowrap shadow-lg"
            style={{
              backgroundColor: species.color,
              boxShadow: `0 0 12px ${species.color}80`,
            }}
          >
            {species.emoji} {species.name}
          </div>
        </Html>
      )}

      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[species.size * 0.6, species.size * 0.8, 32]} />
          <meshBasicMaterial
            color={species.color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
