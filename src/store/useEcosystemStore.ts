import { create } from 'zustand';
import * as THREE from 'three';
import type { EcosystemStats, Organism, OrganismDeathCause, Species } from '@/types/ecosystem';
import { getSpeciesById } from '@/data/species';
import {
  applySimulationTick,
  createEmptyStats,
  recordEnergyChanges,
  recordOrganismAdded,
  recordOrganismRemoved,
} from '@/utils/ecosystemStats';
import { simulateStep } from '@/utils/ecosystemSimulator';

interface EcosystemStore {
  organisms: Organism[];
  stats: EcosystemStats;
  selectedSpeciesId: string | null;
  selectedOrganismId: string | null;
  isRunning: boolean;
  simulationTime: number;
  showLabels: boolean;

  addOrganism: (speciesId: string, position?: THREE.Vector3) => void;
  removeOrganism: (organismId: string) => void;
  updateOrganism: (organismId: string, updates: Partial<Organism>) => void;
  setSelectedSpecies: (speciesId: string | null) => void;
  setSelectedOrganism: (organismId: string | null) => void;
  toggleSimulation: () => void;
  incrementTime: () => void;
  resetEcosystem: () => void;
  toggleLabels: () => void;
  getStats: () => EcosystemStats;
  batchUpdateOrganisms: (updates: { id: string; updates: Partial<Organism> }[]) => void;
  batchRemoveOrganisms: (ids: string[]) => void;
  applySimulationStep: () => void;
}

const AQUARIUM_BOUNDS = {
  minX: -4,
  maxX: 4,
  minY: -2,
  maxY: 2,
  minZ: -2,
  maxZ: 2,
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomPosition(species: Species): THREE.Vector3 {
  const isProducer = species.trophicLevel === 'producer';
  const minY = isProducer ? AQUARIUM_BOUNDS.minY : AQUARIUM_BOUNDS.minY + 0.3;
  const maxY = isProducer ? AQUARIUM_BOUNDS.minY + 0.5 : AQUARIUM_BOUNDS.maxY - 0.3;

  return new THREE.Vector3(
    AQUARIUM_BOUNDS.minX + Math.random() * (AQUARIUM_BOUNDS.maxX - AQUARIUM_BOUNDS.minX),
    minY + Math.random() * (maxY - minY),
    AQUARIUM_BOUNDS.minZ + Math.random() * (AQUARIUM_BOUNDS.maxZ - AQUARIUM_BOUNDS.minZ),
  );
}

function createOrganism(species: Species, position?: THREE.Vector3): { organism: Organism; energy: number } {
  const pos = position || randomPosition(species);
  const energy = species.energyValue * (0.7 + Math.random() * 0.3);

  return {
    energy,
    organism: {
      id: generateId(),
      speciesId: species.id,
      position: pos,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * species.speed,
        (Math.random() - 0.5) * species.speed * 0.5,
        (Math.random() - 0.5) * species.speed,
      ),
      energy,
      age: Math.random() * species.lifespan * 0.3,
      state: 'idle',
      targetId: null,
      rotation: Math.random() * Math.PI * 2,
      scale: 0.8 + Math.random() * 0.4,
    },
  };
}

export const useEcosystemStore = create<EcosystemStore>((set, get) => ({
  organisms: [],
  stats: createEmptyStats(),
  selectedSpeciesId: null,
  selectedOrganismId: null,
  isRunning: true,
  simulationTime: 0,
  showLabels: true,

  addOrganism: (speciesId, position) => {
    const state = get();
    const species = getSpeciesById(speciesId);
    if (!species) return;

    const currentCount = state.organisms.filter((o) => o.speciesId === speciesId).length;
    if (currentCount >= species.maxPopulation) return;

    const { organism, energy } = createOrganism(species, position);
    set((prev) => ({
      organisms: [...prev.organisms, organism],
      stats: recordOrganismAdded(prev.stats, species, energy),
    }));
  },

  removeOrganism: (organismId) => {
    set((prev) => {
      const organism = prev.organisms.find((o) => o.id === organismId);
      if (!organism) return prev;
      const species = getSpeciesById(organism.speciesId);

      return {
        organisms: prev.organisms.filter((o) => o.id !== organismId),
        selectedOrganismId:
          prev.selectedOrganismId === organismId ? null : prev.selectedOrganismId,
        stats: species ? recordOrganismRemoved(prev.stats, organism, species) : prev.stats,
      };
    });
  },

  updateOrganism: (organismId, updates) => {
    set((prev) => {
      const organism = prev.organisms.find((o) => o.id === organismId);
      if (!organism) return prev;

      const species = getSpeciesById(organism.speciesId);
      const energyDelta =
        typeof updates.energy === 'number' && species
          ? { [species.id]: updates.energy - organism.energy }
          : {};

      return {
        organisms: prev.organisms.map((o) => (o.id === organismId ? { ...o, ...updates } : o)),
        stats: recordEnergyChanges(prev.stats, energyDelta),
      };
    });
  },

  batchUpdateOrganisms: (updates) => {
    set((prev) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.updates]));
      const energyDeltas: Record<string, number> = {};
      let hasUpdates = false;

      const organisms = prev.organisms.map((o) => {
        const update = updateMap.get(o.id);
        if (!update) return o;
        hasUpdates = true;
        if (typeof update.energy === 'number') {
          const species = getSpeciesById(o.speciesId);
          if (species) {
            energyDeltas[species.id] = (energyDeltas[species.id] || 0) + update.energy - o.energy;
          }
        }
        return { ...o, ...update };
      });

      if (!hasUpdates) return prev;

      return {
        organisms,
        stats: recordEnergyChanges(prev.stats, energyDeltas),
      };
    });
  },

  batchRemoveOrganisms: (ids) => {
    const idSet = new Set(ids);
    set((prev) => {
      const removed = new Map<string, Organism>();
      const organisms = prev.organisms.filter((o) => {
        if (idSet.has(o.id)) {
          removed.set(o.id, o);
          return false;
        }
        return true;
      });

      if (removed.size === 0) return prev;

      let stats = prev.stats;
      removed.forEach((organism) => {
        const species = getSpeciesById(organism.speciesId);
        if (species) stats = recordOrganismRemoved(stats, organism, species);
      });

      return {
        organisms,
        selectedOrganismId:
          prev.selectedOrganismId && idSet.has(prev.selectedOrganismId)
            ? null
            : prev.selectedOrganismId,
        stats,
      };
    });
  },

  setSelectedSpecies: (speciesId) => {
    set({ selectedSpeciesId: speciesId });
  },

  setSelectedOrganism: (organismId) => {
    set({ selectedOrganismId: organismId });
  },

  toggleSimulation: () => {
    set((prev) => ({
      isRunning: !prev.isRunning,
      stats: { ...prev.stats, isRunning: !prev.isRunning },
    }));
  },

  incrementTime: () => {
    set((prev) => ({
      simulationTime: prev.simulationTime + 1,
      stats: { ...prev.stats, time: prev.simulationTime + 1 },
    }));
  },

  resetEcosystem: () => {
    set({
      organisms: [],
      selectedSpeciesId: null,
      selectedOrganismId: null,
      simulationTime: 0,
      isRunning: true,
      stats: createEmptyStats(0, true),
    });
  },

  toggleLabels: () => {
    set((prev) => ({ showLabels: !prev.showLabels }));
  },

  getStats: () => get().stats,

  applySimulationStep: () => {
    set((prev) => {
      const result = simulateStep(prev.organisms);
      const organismMap = new Map(prev.organisms.map((o) => [o.id, o]));
      const removedCountBySpecies: Record<string, number> = {};

      result.removals.forEach(({ id }) => {
        const organism = organismMap.get(id);
        if (organism) {
          removedCountBySpecies[organism.speciesId] =
            (removedCountBySpecies[organism.speciesId] || 0) + 1;
        }
      });

      const acceptedBirths: { speciesId: string; position: THREE.Vector3; energy: number }[] = [];
      const createdOrganisms: Organism[] = [];
      result.births.forEach((birth) => {
        const species = getSpeciesById(birth.speciesId);
        if (!species) return;

        const existingCount =
          prev.organisms.filter((o) => o.speciesId === birth.speciesId).length -
          (removedCountBySpecies[birth.speciesId] || 0) +
          acceptedBirths.filter((o) => o.speciesId === birth.speciesId).length;

        if (existingCount >= species.maxPopulation) return;

        const { organism, energy } = createOrganism(species, birth.position);
        acceptedBirths.push({ speciesId: birth.speciesId, position: birth.position, energy });
        createdOrganisms.push(organism);
      });

      const removedIds = new Set(result.removals.map((removal) => removal.id));
      const updateMap = new Map(result.updates.map((item) => [item.id, item.updates]));
      const updatedOrganisms = prev.organisms
        .filter((o) => !removedIds.has(o.id))
        .map((o) => {
          const update = updateMap.get(o.id);
          return update ? { ...o, ...update } : o;
        });

      const deathStats: { speciesId: string; energy: number; cause: OrganismDeathCause }[] = [];
      result.removals.forEach((removal) => {
        const organism = organismMap.get(removal.id);
        if (organism && getSpeciesById(organism.speciesId)) {
          deathStats.push({
            speciesId: organism.speciesId,
            energy: organism.energy,
            cause: removal.cause,
          });
        }
      });

      const time = prev.simulationTime + 1;

      return {
        organisms: [...updatedOrganisms, ...createdOrganisms],
        selectedOrganismId:
          prev.selectedOrganismId && removedIds.has(prev.selectedOrganismId)
            ? null
            : prev.selectedOrganismId,
        simulationTime: time,
        stats: applySimulationTick(
          prev.stats,
          time,
          acceptedBirths.map((birth) => ({
            speciesId: birth.speciesId,
            energy: birth.energy,
          })),
          deathStats,
          result.energyDeltas,
        ),
      };
    });
  },
}));

export { AQUARIUM_BOUNDS };
