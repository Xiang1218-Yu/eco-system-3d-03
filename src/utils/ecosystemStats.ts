import { SPECIES } from '@/data/species';
import type {
  EcosystemStats,
  Organism,
  OrganismDeathCause,
  Species,
  TrophicLevel,
  TrophicStats,
} from '@/types/ecosystem';

export const TROPHIC_LEVELS: TrophicLevel[] = ['producer', 'herbivore', 'carnivore', 'decomposer'];

const MAX_TREND_POINTS = 60;
const IDEAL_TROPHIC_RATIOS: Record<TrophicLevel, number> = {
  producer: 0.5,
  herbivore: 0.3,
  carnivore: 0.1,
  decomposer: 0.1,
};

export interface SimulationBirthStat {
  speciesId: string;
  energy: number;
}

export interface SimulationDeathStat {
  speciesId: string;
  energy: number;
  cause: OrganismDeathCause;
}

function createSpeciesRecord<T>(value: T): Record<string, T> {
  return SPECIES.reduce<Record<string, T>>((record, species) => {
    record[species.id] = value;
    return record;
  }, {});
}

function createPyramid(): Record<TrophicLevel, TrophicStats> {
  return TROPHIC_LEVELS.reduce(
    (pyramid, level) => {
      pyramid[level] = { population: 0, totalEnergy: 0, averageEnergy: 0 };
      return pyramid;
    },
    {} as Record<TrophicLevel, TrophicStats>,
  );
}

function cloneStats(stats: EcosystemStats): EcosystemStats {
  return {
    ...stats,
    populationBySpecies: { ...stats.populationBySpecies },
    energyBySpecies: { ...stats.energyBySpecies },
    deathsByCause: { ...stats.deathsByCause },
    populationTrend: [...stats.populationTrend],
    energyPyramid: createPyramid(),
  };
}

function ensureTrendPoint(stats: EcosystemStats, time: number) {
  const lastPoint = stats.populationTrend[stats.populationTrend.length - 1];
  if (!lastPoint || lastPoint.time !== time) {
    stats.populationTrend.push({ time, births: 0, deaths: 0 });
    if (stats.populationTrend.length > MAX_TREND_POINTS) {
      stats.populationTrend.shift();
    }
  }
}

function finalizeStats(stats: EcosystemStats): EcosystemStats {
  let totalOrganisms = 0;
  let diversityIndex = 0;
  let speciesRichness = 0;
  const pyramid = createPyramid();

  SPECIES.forEach((species) => {
    const population = stats.populationBySpecies[species.id] || 0;
    const energy = stats.energyBySpecies[species.id] || 0;

    totalOrganisms += population;
    if (population > 0) speciesRichness += 1;

    pyramid[species.trophicLevel].population += population;
    pyramid[species.trophicLevel].totalEnergy += energy;
  });

  if (totalOrganisms > 0) {
    SPECIES.forEach((species) => {
      const population = stats.populationBySpecies[species.id] || 0;
      if (population > 0) {
        const proportion = population / totalOrganisms;
        diversityIndex -= proportion * Math.log(proportion);
      }
    });
  }

  let balanceDeviation = 0;
  TROPHIC_LEVELS.forEach((level) => {
    const levelStats = pyramid[level];
    levelStats.averageEnergy =
      levelStats.population > 0 ? levelStats.totalEnergy / levelStats.population : 0;

    if (totalOrganisms > 0) {
      balanceDeviation += Math.abs(
        levelStats.population / totalOrganisms - IDEAL_TROPHIC_RATIOS[level],
      );
    }
  });
  stats.balanceIndex = totalOrganisms > 0 ? Math.max(0, 100 - balanceDeviation * 100) : 0;

  stats.energyPyramid = pyramid;
  stats.totalOrganisms = totalOrganisms;
  stats.speciesRichness = speciesRichness;
  stats.diversityIndex = diversityIndex;
  stats.speciesEvenness =
    speciesRichness > 1 ? diversityIndex / Math.log(speciesRichness) : speciesRichness === 1 ? 1 : 0;

  return stats;
}

export function createEmptyStats(time = 0, isRunning = true): EcosystemStats {
  return finalizeStats({
    time,
    isRunning,
    balanceIndex: 0,
    populationBySpecies: createSpeciesRecord(0),
    energyBySpecies: createSpeciesRecord(0),
    totalOrganisms: 0,
    cumulativeBirths: 0,
    cumulativeDeaths: 0,
    deathsByCause: { lifespan: 0, starvation: 0, predation: 0 },
    populationTrend: [],
    energyPyramid: createPyramid(),
    diversityIndex: 0,
    speciesRichness: 0,
    speciesEvenness: 0,
  });
}

export function recordOrganismAdded(
  stats: EcosystemStats,
  species: Species,
  energy: number,
): EcosystemStats {
  const next = cloneStats(stats);
  next.populationBySpecies[species.id] += 1;
  next.energyBySpecies[species.id] += energy;
  return finalizeStats(next);
}

export function recordOrganismRemoved(
  stats: EcosystemStats,
  organism: Organism,
  species: Species,
): EcosystemStats {
  const next = cloneStats(stats);
  next.populationBySpecies[species.id] = Math.max(0, next.populationBySpecies[species.id] - 1);
  next.energyBySpecies[species.id] = Math.max(0, next.energyBySpecies[species.id] - organism.energy);
  return finalizeStats(next);
}

export function recordEnergyChanges(
  stats: EcosystemStats,
  energyDeltas: Record<string, number>,
): EcosystemStats {
  const hasChanges = Object.values(energyDeltas).some((delta) => Math.abs(delta) > 0.000001);
  if (!hasChanges) return stats;

  const next = cloneStats(stats);
  Object.entries(energyDeltas).forEach(([speciesId, delta]) => {
    if (!(speciesId in next.energyBySpecies)) return;
    next.energyBySpecies[speciesId] = Math.max(0, next.energyBySpecies[speciesId] + delta);
  });
  return finalizeStats(next);
}

export function applySimulationTick(
  stats: EcosystemStats,
  time: number,
  births: SimulationBirthStat[],
  deaths: SimulationDeathStat[],
  energyDeltas: Record<string, number>,
): EcosystemStats {
  const next = cloneStats(stats);
  next.time = time;
  ensureTrendPoint(next, time);

  births.forEach(({ speciesId, energy }) => {
    if (!(speciesId in next.populationBySpecies)) return;
    next.populationBySpecies[speciesId] += 1;
    next.energyBySpecies[speciesId] += energy;
    next.cumulativeBirths += 1;
    next.populationTrend[next.populationTrend.length - 1].births += 1;
  });

  deaths.forEach(({ speciesId, energy, cause }) => {
    if (!(speciesId in next.populationBySpecies)) return;
    next.populationBySpecies[speciesId] = Math.max(0, next.populationBySpecies[speciesId] - 1);
    next.energyBySpecies[speciesId] = Math.max(0, next.energyBySpecies[speciesId] - energy);
    next.cumulativeDeaths += 1;
    next.deathsByCause[cause] += 1;
    next.populationTrend[next.populationTrend.length - 1].deaths += 1;
  });

  Object.entries(energyDeltas).forEach(([speciesId, delta]) => {
    if (!(speciesId in next.energyBySpecies)) return;
    next.energyBySpecies[speciesId] = Math.max(0, next.energyBySpecies[speciesId] + delta);
  });

  return finalizeStats(next);
}
