import * as THREE from 'three';
import type { Organism, OrganismDeathCause, SimulationStepResult } from '@/types/ecosystem';
import { getSpeciesById, SPECIES } from '@/data/species';
import { AQUARIUM_BOUNDS } from '@/store/useEcosystemStore';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distance(a: THREE.Vector3, b: THREE.Vector3): number {
  return a.distanceTo(b);
}

function findNearestPrey(
  organism: Organism,
  allOrganisms: Organism[],
  unavailableIds: Set<string>,
): Organism | null {
  const species = getSpeciesById(organism.speciesId);
  if (!species || species.diet.length === 0) return null;

  let nearest: Organism | null = null;
  let minDist = Infinity;

  for (const other of allOrganisms) {
    if (other.id === organism.id) continue;
    if (unavailableIds.has(other.id)) continue;
    if (!species.diet.includes(other.speciesId)) continue;

    const dist = distance(organism.position, other.position);
    if (dist < minDist && dist < 3) {
      minDist = dist;
      nearest = other;
    }
  }

  return nearest;
}

function findNearestPredator(
  organism: Organism,
  allOrganisms: Organism[],
): Organism | null {
  const species = getSpeciesById(organism.speciesId);
  if (!species || species.predators.length === 0) return null;

  let nearest: Organism | null = null;
  let minDist = Infinity;

  for (const other of allOrganisms) {
    if (other.id === organism.id) continue;
    if (!species.predators.includes(other.speciesId)) continue;

    const dist = distance(organism.position, other.position);
    if (dist < minDist && dist < 2.5) {
      minDist = dist;
      nearest = other;
    }
  }

  return nearest;
}

function findNearestDead(
  organism: Organism,
  allOrganisms: Organism[],
  dyingIds: Set<string>,
): Organism | null {
  let nearest: Organism | null = null;
  let minDist = Infinity;

  for (const other of allOrganisms) {
    if (other.id === organism.id) continue;
    if (!dyingIds.has(other.id)) continue;

    const dist = distance(organism.position, other.position);
    if (dist < minDist && dist < 3) {
      minDist = dist;
      nearest = other;
    }
  }

  return nearest;
}

export function simulateStep(
  organisms: Organism[],
): SimulationStepResult {
  const updates: Map<string, Partial<Organism>> = new Map();
  const unavailableIds = new Set<string>();
  const removalReasons: Map<string, OrganismDeathCause> = new Map();
  const births: { speciesId: string; position: THREE.Vector3 }[] = [];
  const energyDeltas: Record<string, number> = {};
  const energyDeltaByOrganism = new Map<string, number>();
  const organismById = new Map(organisms.map((organism) => [organism.id, organism]));
  const populationBySpecies = new Map<string, number>();
  const removedCountBySpecies: Record<string, number> = {};
  const pendingBirthCounts: Record<string, number> = {};

  organisms.forEach((organism) => {
    populationBySpecies.set(
      organism.speciesId,
      (populationBySpecies.get(organism.speciesId) || 0) + 1,
    );
  });

  const removeOrganism = (id: string, cause: OrganismDeathCause) => {
    if (!removalReasons.has(id)) {
      const organism = organismById.get(id);
      removalReasons.set(id, cause);
      unavailableIds.add(id);
      if (organism) {
        removedCountBySpecies[organism.speciesId] =
          (removedCountBySpecies[organism.speciesId] || 0) + 1;
      }
    }
  };

  for (const organism of organisms) {
    const species = getSpeciesById(organism.speciesId);
    if (!species) continue;

    if (removalReasons.has(organism.id)) continue;

    let energy = organism.energy;
    const age = organism.age + 1;

    if (age >= species.lifespan) {
      removeOrganism(organism.id, 'lifespan');
      continue;
    }
    if (energy <= 0) {
      removeOrganism(organism.id, 'starvation');
      continue;
    }

    energy -= 0.05 + species.size * 0.02;

    const organismUpdate: Partial<Organism> = {};
    const newPosition = organism.position.clone();
    const newVelocity = organism.velocity.clone();

    if (species.trophicLevel === 'decomposer') {
      const deadOrganism = findNearestDead(organism, organisms, unavailableIds);

      if (deadOrganism && energy < species.energyValue * 0.8) {
        organismUpdate.state = 'hunting';
        organismUpdate.targetId = deadOrganism.id;
        const huntDir = new THREE.Vector3()
          .subVectors(deadOrganism.position, organism.position)
          .normalize();
        newVelocity.lerp(huntDir.multiplyScalar(species.speed), 0.1);

        if (distance(organism.position, deadOrganism.position) < species.size * 1.5) {
          energy += getSpeciesById(deadOrganism.speciesId)?.energyValue || 20;
          organismUpdate.state = 'eating';
        }
      } else {
        organismUpdate.state = 'wandering';
        if (Math.random() < 0.02) {
          newVelocity.set(
            (Math.random() - 0.5) * species.speed,
            (Math.random() - 0.5) * species.speed * 0.5,
            (Math.random() - 0.5) * species.speed,
          );
        }
      }

      newPosition.add(newVelocity);

      if (newPosition.x < AQUARIUM_BOUNDS.minX + 0.3) {
        newPosition.x = AQUARIUM_BOUNDS.minX + 0.3;
        newVelocity.x = Math.abs(newVelocity.x);
      }
      if (newPosition.x > AQUARIUM_BOUNDS.maxX - 0.3) {
        newPosition.x = AQUARIUM_BOUNDS.maxX - 0.3;
        newVelocity.x = -Math.abs(newVelocity.x);
      }
      if (newPosition.y < AQUARIUM_BOUNDS.minY + 0.2) {
        newPosition.y = AQUARIUM_BOUNDS.minY + 0.2;
        newVelocity.y = Math.abs(newVelocity.y);
      }
      if (newPosition.y > AQUARIUM_BOUNDS.maxY - 0.2) {
        newPosition.y = AQUARIUM_BOUNDS.maxY - 0.2;
        newVelocity.y = -Math.abs(newVelocity.y);
      }
      if (newPosition.z < AQUARIUM_BOUNDS.minZ + 0.3) {
        newPosition.z = AQUARIUM_BOUNDS.minZ + 0.3;
        newVelocity.z = Math.abs(newVelocity.z);
      }
      if (newPosition.z > AQUARIUM_BOUNDS.maxZ - 0.3) {
        newPosition.z = AQUARIUM_BOUNDS.maxZ - 0.3;
        newVelocity.z = -Math.abs(newVelocity.z);
      }

      organismUpdate.position = newPosition;
      organismUpdate.velocity = newVelocity;
      if (Math.abs(newVelocity.x) > 0.001 || Math.abs(newVelocity.z) > 0.001) {
        organismUpdate.rotation = Math.atan2(newVelocity.x, newVelocity.z);
      }
    } else if (species.trophicLevel !== 'producer' && species.speed > 0) {
      const prey = findNearestPrey(organism, organisms, unavailableIds);
      const predator = findNearestPredator(organism, organisms);

      if (predator) {
        organismUpdate.state = 'fleeing';
        const fleeDir = new THREE.Vector3()
          .subVectors(organism.position, predator.position)
          .normalize();
        newVelocity.lerp(fleeDir.multiplyScalar(species.speed), 0.1);
      } else if (prey && energy < species.energyValue * 0.7) {
        organismUpdate.state = 'hunting';
        organismUpdate.targetId = prey.id;
        const huntDir = new THREE.Vector3()
          .subVectors(prey.position, organism.position)
          .normalize();
        newVelocity.lerp(huntDir.multiplyScalar(species.speed), 0.1);

        if (distance(organism.position, prey.position) < species.size * 0.8) {
          energy += getSpeciesById(prey.speciesId)?.energyValue || 20;
          removeOrganism(prey.id, 'predation');
          organismUpdate.state = 'eating';
        }
      } else {
        organismUpdate.state = 'wandering';
        if (Math.random() < 0.02) {
          newVelocity.set(
            (Math.random() - 0.5) * species.speed,
            (Math.random() - 0.5) * species.speed * 0.5,
            (Math.random() - 0.5) * species.speed,
          );
        }
      }

      newPosition.add(newVelocity);

      if (newPosition.x < AQUARIUM_BOUNDS.minX + 0.3) {
        newPosition.x = AQUARIUM_BOUNDS.minX + 0.3;
        newVelocity.x = Math.abs(newVelocity.x);
      }
      if (newPosition.x > AQUARIUM_BOUNDS.maxX - 0.3) {
        newPosition.x = AQUARIUM_BOUNDS.maxX - 0.3;
        newVelocity.x = -Math.abs(newVelocity.x);
      }
      if (newPosition.y < AQUARIUM_BOUNDS.minY + 0.2) {
        newPosition.y = AQUARIUM_BOUNDS.minY + 0.2;
        newVelocity.y = Math.abs(newVelocity.y);
      }
      if (newPosition.y > AQUARIUM_BOUNDS.maxY - 0.2) {
        newPosition.y = AQUARIUM_BOUNDS.maxY - 0.2;
        newVelocity.y = -Math.abs(newVelocity.y);
      }
      if (newPosition.z < AQUARIUM_BOUNDS.minZ + 0.3) {
        newPosition.z = AQUARIUM_BOUNDS.minZ + 0.3;
        newVelocity.z = Math.abs(newVelocity.z);
      }
      if (newPosition.z > AQUARIUM_BOUNDS.maxZ - 0.3) {
        newPosition.z = AQUARIUM_BOUNDS.maxZ - 0.3;
        newVelocity.z = -Math.abs(newVelocity.z);
      }

      organismUpdate.position = newPosition;
      organismUpdate.velocity = newVelocity;
      if (Math.abs(newVelocity.x) > 0.001 || Math.abs(newVelocity.z) > 0.001) {
        organismUpdate.rotation = Math.atan2(newVelocity.x, newVelocity.z);
      }
    } else if (species.trophicLevel === 'producer') {
      organismUpdate.state = 'idle';
      energy += 0.1;
    }

    energy = clamp(energy, 0, species.energyValue * 1.5);
    organismUpdate.energy = energy;
    organismUpdate.age = age;

    if (
      energy > species.energyValue * 0.8 &&
      Math.random() < species.reproductionRate * 0.1
    ) {
      const aliveCount =
        (populationBySpecies.get(organism.speciesId) || 0) -
        (removedCountBySpecies[organism.speciesId] || 0) +
        (pendingBirthCounts[organism.speciesId] || 0);
      if (aliveCount < species.maxPopulation) {
        pendingBirthCounts[species.id] = (pendingBirthCounts[species.id] || 0) + 1;
        const offspringPos = organism.position
          .clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 1.5,
              Math.random() * 0.5,
              (Math.random() - 0.5) * 1.5,
            ),
          );
        births.push({ speciesId: organism.speciesId, position: offspringPos });
        organismUpdate.energy = energy * 0.5;
      }
    }

    const finalEnergy = organismUpdate.energy ?? energy;
    energyDeltaByOrganism.set(organism.id, finalEnergy - organism.energy);

    updates.set(organism.id, organismUpdate);
  }

  const updatesArray: { id: string; updates: Partial<Organism> }[] = [];
  updates.forEach((u, id) => {
    if (!removalReasons.has(id)) {
      updatesArray.push({ id, updates: u });
    }
  });

  energyDeltaByOrganism.forEach((delta, id) => {
    if (removalReasons.has(id)) return;
    const organism = organismById.get(id);
    if (!organism) return;
    energyDeltas[organism.speciesId] = (energyDeltas[organism.speciesId] || 0) + delta;
  });

  return {
    updates: updatesArray,
    removals: Array.from(removalReasons, ([id, cause]) => ({ id, cause })),
    births,
    energyDeltas,
  };
}

export function computeFoodChainRelations(presentSpecies: string[]): {
  predatorId: string;
  preyId: string;
}[] {
  const relations: { predatorId: string; preyId: string }[] = [];
  const seen = new Set<string>();
  const presentSpeciesSet = new Set(presentSpecies);

  for (const speciesId of presentSpecies) {
    const species = getSpeciesById(speciesId);
    if (!species) continue;

    for (const preyId of species.diet) {
      if (presentSpeciesSet.has(preyId)) {
        const key = `${species.id}-${preyId}`;
        if (!seen.has(key)) {
          seen.add(key);
          relations.push({ predatorId: species.id, preyId });
        }
      }
    }
  }

  return relations;
}

export function getPresentSpecies(organisms: Organism[]): string[] {
  return [...new Set(organisms.map((o) => o.speciesId))];
}

export { SPECIES };
