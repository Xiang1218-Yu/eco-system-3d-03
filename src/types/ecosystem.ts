import type { Vector3 } from 'three';

export type TrophicLevel = 'producer' | 'herbivore' | 'carnivore' | 'decomposer';

export type OrganismState = 'idle' | 'wandering' | 'hunting' | 'fleeing' | 'eating' | 'reproducing';

export type DeathCause = 'lifespan' | 'starvation' | 'predation';

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

export interface VitalTrendPoint {
  time: number;
  births: number;
  deaths: number;
}

export type DeathCounts = Record<DeathCause, number>;

export interface EnergyPyramidLevel {
  population: number;
  energy: number;
}

export type EnergyPyramid = Record<TrophicLevel, EnergyPyramidLevel>;

export interface EcosystemStats {
  time: number;
  isRunning: boolean;
  balanceIndex: number;
  populationBySpecies: Record<string, number>;
  totalOrganisms: number;
  birthCount: number;
  deathCount: number;
  deathsByCause: DeathCounts;
  vitalTrends: VitalTrendPoint[];
  energyPyramid: EnergyPyramid;
  diversityIndex: number;
  speciesRichness: number;
  speciesEvenness: number;
}

export interface SimulationRemoval {
  id: string;
  cause: DeathCause;
}

export interface SimulationResult {
  updates: { id: string; updates: Partial<Organism> }[];
  toRemove: SimulationRemoval[];
  toAdd: { speciesId: string; position: Vector3 }[];
}

export interface FoodChainRelation {
  predatorId: string;
  preyId: string;
}
