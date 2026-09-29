import { create } from 'zustand';
import * as THREE from 'three';
import type {
  DeathCause,
  EcosystemStats,
  Organism,
  SimulationResult,
  Species,
  TrophicLevel,
} from '@/types/ecosystem';
import { getSpeciesById, TROPHIC_LEVELS } from '@/data/species';
import {
  cloneStats,
  createInitialStats,
  finalizeStats,
  recordEnergyDelta,
  recordOrganismAdded,
  recordOrganismRemoved,
  VITAL_TREND_LIMIT,
} from '@/utils/ecosystemStats';

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
  applySimulationResult: (result: SimulationResult) => void;
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

function createOrganism(speciesId: string, position?: THREE.Vector3): Organism | null {
  const species = getSpeciesById(speciesId);
  if (!species) return null;

  const pos = position || randomPosition(species);

  return {
    id: generateId(),
    speciesId,
    position: pos,
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * species.speed,
      (Math.random() - 0.5) * species.speed * 0.5,
      (Math.random() - 0.5) * species.speed,
    ),
    energy: species.energyValue * (0.7 + Math.random() * 0.3),
    age: Math.random() * species.lifespan * 0.3,
    state: 'idle',
    targetId: null,
    rotation: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
  };
}

function createLevelDeltas(): Record<TrophicLevel, number> {
  return { producer: 0, herbivore: 0, carnivore: 0, decomposer: 0 };
}

export const useEcosystemStore = create<EcosystemStore>((set, get) => ({
  organisms: [],
  stats: createInitialStats(),
  selectedSpeciesId: null,
  selectedOrganismId: null,
  isRunning: true,
  simulationTime: 0,
  showLabels: true,

  addOrganism: (speciesId, position) => {
    const state = get();
    const species = getSpeciesById(speciesId);
    if (!species) return;

    const currentCount = state.stats.populationBySpecies[speciesId] || 0;
    if (currentCount >= species.maxPopulation) return;

    const organism = createOrganism(speciesId, position);
    if (organism) {
      set((prev) => ({
        organisms: [...prev.organisms, organism],
        stats: recordOrganismAdded(
          prev.stats,
          speciesId,
          species.trophicLevel,
          organism.energy,
        ),
      }));
    }
  },

  removeOrganism: (organismId) => {
    const organism = get().organisms.find((o) => o.id === organismId);
    if (!organism) return;
    const species = getSpeciesById(organism.speciesId);

    set((prev) => ({
      organisms: prev.organisms.filter((o) => o.id !== organismId),
      selectedOrganismId: prev.selectedOrganismId === organismId ? null : prev.selectedOrganismId,
      stats: species
        ? recordOrganismRemoved(
            prev.stats,
            organism.speciesId,
            species.trophicLevel,
            organism.energy,
          )
        : prev.stats,
    }));
  },

  updateOrganism: (organismId, updates) => {
    set((prev) => {
      const current = prev.organisms.find((o) => o.id === organismId);
      if (!current) return prev;

      const species = getSpeciesById(current.speciesId);
      const energyDelta =
        species && typeof updates.energy === 'number' ? updates.energy - current.energy : 0;

      return {
        organisms: prev.organisms.map((o) => (o.id === organismId ? { ...o, ...updates } : o)),
        stats: species
          ? recordEnergyDelta(prev.stats, species.trophicLevel, energyDelta)
          : prev.stats,
      };
    });
  },

  batchUpdateOrganisms: (updates) => {
    set((prev) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.updates]));
      const levelDeltas = createLevelDeltas();

      const organisms = prev.organisms.map((organism) => {
        const update = updateMap.get(organism.id);
        if (!update) return organism;

        if (typeof update.energy === 'number') {
          const species = getSpeciesById(organism.speciesId);
          if (species) {
            levelDeltas[species.trophicLevel] += update.energy - organism.energy;
          }
        }
        return { ...organism, ...update };
      });

      let stats = prev.stats;
      if (TROPHIC_LEVELS.some((level) => levelDeltas[level] !== 0)) {
        stats = cloneStats(prev.stats);
        TROPHIC_LEVELS.forEach((level) => {
          stats.energyPyramid[level].energy += levelDeltas[level];
        });
        stats = finalizeStats(stats);
      }

      return { organisms, stats };
    });
  },

  batchRemoveOrganisms: (ids) => {
    const idSet = new Set(ids);
    set((prev) => {
      const stats = cloneStats(prev.stats);
      let statsChanged = false;

      const organisms = prev.organisms.filter((organism) => {
        if (!idSet.has(organism.id)) return true;

        const species = getSpeciesById(organism.speciesId);
        if (species) {
          stats.populationBySpecies[organism.speciesId] = Math.max(
            0,
            (stats.populationBySpecies[organism.speciesId] || 0) - 1,
          );
          stats.totalOrganisms = Math.max(0, stats.totalOrganisms - 1);
          stats.energyPyramid[species.trophicLevel].population = Math.max(
            0,
            stats.energyPyramid[species.trophicLevel].population - 1,
          );
          stats.energyPyramid[species.trophicLevel].energy -= organism.energy;
          statsChanged = true;
        }
        return false;
      });

      return {
        organisms,
        selectedOrganismId:
          prev.selectedOrganismId && idSet.has(prev.selectedOrganismId)
            ? null
            : prev.selectedOrganismId,
        stats: statsChanged ? finalizeStats(stats) : prev.stats,
      };
    });
  },

  applySimulationResult: ({ updates, toRemove, toAdd }) => {
    set((prev) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.updates]));
      const removalMap = new Map(toRemove.map((removal) => [removal.id, removal.cause]));
      const organismById = new Map(prev.organisms.map((organism) => [organism.id, organism]));
      const levelDeltas = createLevelDeltas();

      let stats = cloneStats(prev.stats);
      let births = 0;
      let deaths = 0;

      const survivingOrganisms = prev.organisms
        .filter((organism) => !removalMap.has(organism.id))
        .map((organism) => {
          const update = updateMap.get(organism.id);
          if (!update) return organism;

          if (typeof update.energy === 'number') {
            const species = getSpeciesById(organism.speciesId);
            if (species) {
              levelDeltas[species.trophicLevel] += update.energy - organism.energy;
            }
          }
          return { ...organism, ...update };
        });

      removalMap.forEach((cause: DeathCause, organismId) => {
        const organism = organismById.get(organismId);
        if (!organism) return;

        const species = getSpeciesById(organism.speciesId);
        if (!species) return;

        deaths += 1;
        stats.deathsByCause[cause] += 1;
        stats.populationBySpecies[organism.speciesId] = Math.max(
          0,
          (stats.populationBySpecies[organism.speciesId] || 0) - 1,
        );
        stats.totalOrganisms = Math.max(0, stats.totalOrganisms - 1);
        stats.energyPyramid[species.trophicLevel].population = Math.max(
          0,
          stats.energyPyramid[species.trophicLevel].population - 1,
        );
        stats.energyPyramid[species.trophicLevel].energy -= organism.energy;
      });

      TROPHIC_LEVELS.forEach((level) => {
        stats.energyPyramid[level].energy += levelDeltas[level];
      });

      const newOrganisms: Organism[] = [];
      toAdd.forEach(({ speciesId, position }) => {
        const species = getSpeciesById(speciesId);
        if (!species) return;
        if ((stats.populationBySpecies[speciesId] || 0) >= species.maxPopulation) return;

        const organism = createOrganism(speciesId, position);
        if (!organism) return;

        births += 1;
        stats.populationBySpecies[speciesId] =
          (stats.populationBySpecies[speciesId] || 0) + 1;
        stats.totalOrganisms += 1;
        stats.energyPyramid[species.trophicLevel].population += 1;
        stats.energyPyramid[species.trophicLevel].energy += organism.energy;
        newOrganisms.push(organism);
      });

      stats.time += 1;
      stats.birthCount += births;
      stats.deathCount += deaths;
      stats.vitalTrends = [
        ...stats.vitalTrends,
        { time: stats.time, births, deaths },
      ].slice(-VITAL_TREND_LIMIT);
      stats = finalizeStats(stats);

      return {
        organisms: [...survivingOrganisms, ...newOrganisms],
        stats,
        simulationTime: stats.time,
        selectedOrganismId:
          prev.selectedOrganismId && removalMap.has(prev.selectedOrganismId)
            ? null
            : prev.selectedOrganismId,
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
    set((prev) => {
      const isRunning = !prev.isRunning;
      return { isRunning, stats: { ...prev.stats, isRunning } };
    });
  },

  incrementTime: () => {
    set((prev) => ({
      simulationTime: prev.simulationTime + 1,
      stats: { ...prev.stats, time: prev.stats.time + 1 },
    }));
  },

  resetEcosystem: () => {
    set({
      organisms: [],
      stats: createInitialStats(),
      selectedSpeciesId: null,
      selectedOrganismId: null,
      simulationTime: 0,
      isRunning: true,
    });
  },

  toggleLabels: () => {
    set((prev) => ({ showLabels: !prev.showLabels }));
  },

  getStats: () => {
    const state = get();
    return {
      ...state.stats,
      time: state.simulationTime,
      isRunning: state.isRunning,
    };
  },
}));

export { AQUARIUM_BOUNDS };
