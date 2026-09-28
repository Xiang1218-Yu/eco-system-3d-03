import { SPECIES, TROPHIC_LEVEL_LABELS, TROPHIC_LEVEL_COLORS } from '@/data/species';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { GlassCard } from '@/components/common/GlassCard';
import type { TrophicLevel } from '@/types/ecosystem';

const LEVEL_ORDER: TrophicLevel[] = ['producer', 'herbivore', 'carnivore', 'decomposer'];

export function SpeciesToolbar() {
  const selectedSpeciesId = useEcosystemStore((s) => s.selectedSpeciesId);
  const setSelectedSpecies = useEcosystemStore((s) => s.setSelectedSpecies);
  const organisms = useEcosystemStore((s) => s.organisms);

  return (
    <div className="absolute left-4 top-20 z-20 flex flex-col gap-2 max-h-[calc(100vh-28rem)] overflow-y-auto pr-2 pb-3 scrollbar-thin">
      {LEVEL_ORDER.map((level) => {
        const levelSpecies = SPECIES.filter((s) => s.trophicLevel === level);
        return (
          <div key={level} className="flex flex-col gap-1.5">
            <div
              className="text-xs font-bold text-center px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: TROPHIC_LEVEL_COLORS[level] + '40',
                color: TROPHIC_LEVEL_COLORS[level],
              }}
            >
              {TROPHIC_LEVEL_LABELS[level]}
            </div>
            <div className="flex flex-col gap-1.5">
              {levelSpecies.map((species) => {
                const isSelected = selectedSpeciesId === species.id;
                const count = organisms.filter((o) => o.speciesId === species.id).length;
                return (
                  <GlassCard
                    key={species.id}
                    className={`p-1.5 transition-all duration-300 ${
                      isSelected ? 'scale-105 ring-2 ring-white' : ''
                    }`}
                    onClick={() => setSelectedSpecies(isSelected ? null : species.id)}
                  >
                    <div className="relative flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-transform hover:scale-110 shrink-0"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${species.color}60, ${species.color}20)`,
                          boxShadow: isSelected ? `0 0 15px ${species.color}80` : 'none',
                        }}
                      >
                        {species.emoji}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="text-white text-xs font-medium leading-tight">
                          {species.name}
                        </div>
                        <div className="text-white/50 text-[10px] leading-tight">
                          {count}/{species.maxPopulation}
                        </div>
                      </div>
                      <div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: species.color }}
                      >
                        {count}
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
