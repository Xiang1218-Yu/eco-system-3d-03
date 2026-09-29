import type { Vector3 } from 'three';

export type TrophicLevel = 'producer' | 'herbivore' | 'carnivore' | 'decomposer';

export type OrganismState = 'idle' | 'wandering' | 'hunting' | 'fleeing' | 'eating' | 'reproducing';

export type OrganismDeathCause = 'lifespan' | 'starvation' | 'predation';

export interface Species {
  id: string;
  name: string;
  emoji: string;
  trophicLevel: TrophicLevel;
  color: string;
  description: string;
  habitat: 'water' | 'land' | 'both';
  diet: string[];
  predators: string[];
  reproductionRate: number;
  lifespan: number;
  speed: number;
  size: number;
  energyValue: number;
  maxPopulation: number;
}

export interface Organism {
  id: string;
  speciesId: string;
  position: Vector3;
  velocity: Vector3;
  energy: number;
  age: number;
  state: OrganismState;
  targetId: string | null;
  rotation: number;
  scale: number;
}

export interface PopulationTrendPoint {
  time: number;
  births: number;
  deaths: number;
}

export interface TrophicStats {
  population: number;
  totalEnergy: number;
  averageEnergy: number;
}

export interface EcosystemStats {
  time: number;
  isRunning: boolean;
  balanceIndex: number;
  populationBySpecies: Record<string, number>;
  energyBySpecies: Record<string, number>;
  totalOrganisms: number;
  cumulativeBirths: number;
  cumulativeDeaths: number;
  deathsByCause: Record<OrganismDeathCause, number>;
  populationTrend: PopulationTrendPoint[];
  energyPyramid: Record<TrophicLevel, TrophicStats>;
  diversityIndex: number;
  speciesRichness: number;
  speciesEvenness: number;
}

export interface SimulationRemoval {
  id: string;
  cause: OrganismDeathCause;
}

export interface SimulationBirth {
  speciesId: string;
  position: Vector3;
}

export interface SimulationStepResult {
  updates: { id: string; updates: Partial<Organism> }[];
  removals: SimulationRemoval[];
  births: SimulationBirth[];
  energyDeltas: Record<string, number>;
}

export interface FoodChainRelation {
  predatorId: string;
  preyId: string;
}
