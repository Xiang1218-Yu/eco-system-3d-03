import type {
  DeathCounts,
  EcosystemStats,
  EnergyPyramid,
  TrophicLevel,
} from '@/types/ecosystem';
import { SPECIES, TROPHIC_LEVELS } from '@/data/species';

export const VITAL_TREND_LIMIT = 60;

const IDEAL_LEVEL_RATIOS: Record<TrophicLevel, number> = {
  producer: 0.5,
  herbivore: 0.3,
  carnivore: 0.1,
  decomposer: 0.1,
};

function createEmptyDeathCounts(): DeathCounts {
  return { lifespan: 0, starvation: 0, predation: 0 };
}

function createEmptyEnergyPyramid(): EnergyPyramid {
  return {
    producer: { population: 0, energy: 0 },
    herbivore: { population: 0, energy: 0 },
    carnivore: { population: 0, energy: 0 },
    decomposer: { population: 0, energy: 0 },
  };
}

export function createInitialStats(): EcosystemStats {
  const populationBySpecies: Record<string, number> = {};
  SPECIES.forEach((species) => {
    populationBySpecies[species.id] = 0;
  });

  return {
    time: 0,
    isRunning: true,
    balanceIndex: 0,
    populationBySpecies,
    totalOrganisms: 0,
    birthCount: 0,
    deathCount: 0,
    deathsByCause: createEmptyDeathCounts(),
    vitalTrends: [],
    energyPyramid: createEmptyEnergyPyramid(),
    diversityIndex: 0,
    speciesRichness: 0,
    speciesEvenness: 0,
  };
}

export function cloneStats(stats: EcosystemStats): EcosystemStats {
  return {
    ...stats,
    populationBySpecies: { ...stats.populationBySpecies },
    deathsByCause: { ...stats.deathsByCause },
    vitalTrends: [...stats.vitalTrends],
    energyPyramid: {
      producer: { ...stats.energyPyramid.producer },
      herbivore: { ...stats.energyPyramid.herbivore },
      carnivore: { ...stats.energyPyramid.carnivore },
      decomposer: { ...stats.energyPyramid.decomposer },
    },
  };
}

export function finalizeStats(stats: EcosystemStats): EcosystemStats {
  const total = stats.totalOrganisms;

  let balanceIndex = 0;
  if (total > 0) {
    let deviation = 0;
    TROPHIC_LEVELS.forEach((level) => {
      const actual = stats.energyPyramid[level].population / total;
      deviation += Math.abs(actual - IDEAL_LEVEL_RATIOS[level]);
    });
    balanceIndex = Math.max(0, 100 - deviation * 100);
  }

  let diversityIndex = 0;
  let speciesRichness = 0;
  if (total > 0) {
    SPECIES.forEach((species) => {
      const count = stats.populationBySpecies[species.id] || 0;
      if (count > 0) {
        speciesRichness += 1;
        const proportion = count / total;
        diversityIndex -= proportion * Math.log(proportion);
      }
    });
  }

  const speciesEvenness =
    speciesRichness > 1 ? diversityIndex / Math.log(speciesRichness) : 0;

  return {
    ...stats,
    balanceIndex,
    diversityIndex,
    speciesRichness,
    speciesEvenness,
  };
}

export function recordOrganismAdded(
  stats: EcosystemStats,
  speciesId: string,
  trophicLevel: TrophicLevel,
  energy: number,
): EcosystemStats {
  const next = cloneStats(stats);
  next.populationBySpecies[speciesId] = (next.populationBySpecies[speciesId] || 0) + 1;
  next.totalOrganisms += 1;
  next.energyPyramid[trophicLevel].population += 1;
  next.energyPyramid[trophicLevel].energy += energy;
  return finalizeStats(next);
}

export function recordOrganismRemoved(
  stats: EcosystemStats,
  speciesId: string,
  trophicLevel: TrophicLevel,
  energy: number,
): EcosystemStats {
  const next = cloneStats(stats);
  next.populationBySpecies[speciesId] = Math.max(
    0,
    (next.populationBySpecies[speciesId] || 0) - 1,
  );
  next.totalOrganisms = Math.max(0, next.totalOrganisms - 1);
  next.energyPyramid[trophicLevel].population = Math.max(
    0,
    next.energyPyramid[trophicLevel].population - 1,
  );
  next.energyPyramid[trophicLevel].energy -= energy;
  return finalizeStats(next);
}

export function recordEnergyDelta(
  stats: EcosystemStats,
  trophicLevel: TrophicLevel,
  delta: number,
): EcosystemStats {
  if (delta === 0) return stats;
  const next = cloneStats(stats);
  next.energyPyramid[trophicLevel].energy += delta;
  return finalizeStats(next);
}

export function recordVitalStep(
  stats: EcosystemStats,
  births: number,
  deaths: number,
): EcosystemStats {
  const next = cloneStats(stats);
  next.time += 1;
  next.birthCount += births;
  next.deathCount += deaths;
  next.vitalTrends = [
    ...next.vitalTrends,
    { time: next.time, births, deaths },
  ].slice(-VITAL_TREND_LIMIT);
  return finalizeStats(next);
}
