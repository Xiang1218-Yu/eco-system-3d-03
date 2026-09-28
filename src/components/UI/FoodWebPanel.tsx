import { useMemo } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { computeFoodChainRelations } from '@/utils/ecosystemSimulator';
import { SPECIES, TROPHIC_LEVEL_COLORS, getSpeciesById } from '@/data/species';

export function FoodWebPanel() {
  const organisms = useEcosystemStore((s) => s.organisms);

  const { relations, presentSpecies } = useMemo(() => {
    const rels = computeFoodChainRelations(organisms);
    const species = [...new Set(organisms.map((o) => o.speciesId))];
    return { relations: rels, presentSpecies: species };
  }, [organisms]);

  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const byLevel: Record<string, string[]> = {
      producer: [],
      herbivore: [],
      carnivore: [],
      decomposer: [],
    };

    presentSpecies.forEach((id) => {
      const sp = getSpeciesById(id);
      if (sp) byLevel[sp.trophicLevel].push(id);
    });

    const levels = ['producer', 'decomposer', 'herbivore', 'carnivore'];
    const width = 200;
    const height = 160;

    levels.forEach((level, levelIdx) => {
      const items = byLevel[level];
      const y = ((levelIdx + 0.5) / levels.length) * height + 10;
      items.forEach((id, itemIdx) => {
        const x = ((itemIdx + 0.5) / items.length) * width + 10;
        pos[id] = { x, y };
      });
    });

    return pos;
  }, [presentSpecies]);

  return (
    <div className="absolute bottom-4 right-4 z-30">
      <GlassCard className="p-4">
        <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
          <span className="text-xl">🔗</span> 食物链网络
        </h3>

        {presentSpecies.length === 0 ? (
          <div className="w-56 h-44 flex items-center justify-center text-white/40 text-sm">
            放入物种后查看食物链
          </div>
        ) : (
          <svg width="220" height="180" className="overflow-visible">
            {relations.map((rel, idx) => {
              const from = positions[rel.preyId];
              const to = positions[rel.predatorId];
              if (!from || !to) return null;

              const sp = getSpeciesById(rel.predatorId);
              return (
                <g key={idx}>
                  <defs>
                    <marker
                      id={`arrow-${idx}`}
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <path
                        d="M0,0 L6,3 L0,6"
                        fill={sp?.color || '#fff'}
                        opacity="0.6"
                      />
                    </marker>
                  </defs>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={sp?.color || '#fff'}
                    strokeWidth="2"
                    opacity="0.5"
                    markerEnd={`url(#arrow-${idx})`}
                  >
                    <animate
                      attributeName="stroke-dasharray"
                      from="4 4"
                      to="8 8"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </line>
                </g>
              );
            })}

            {presentSpecies.map((id) => {
              const sp = getSpeciesById(id);
              const pos = positions[id];
              if (!sp || !pos) return null;

              return (
                <g key={id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="16"
                    fill={TROPHIC_LEVEL_COLORS[sp.trophicLevel]}
                    opacity="0.9"
                  >
                    <animate
                      attributeName="r"
                      values="16;18;16"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <text
                    x={pos.x}
                    y={pos.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="14"
                  >
                    {sp.emoji}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 28}
                    textAnchor="middle"
                    fontSize="9"
                    fill="white"
                    opacity="0.8"
                  >
                    {sp.name}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          {SPECIES.filter((s) => presentSpecies.includes(s.id)).map((sp) => (
            <div
              key={sp.id}
              className="text-[10px] px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: sp.color + '60' }}
            >
              {sp.emoji} {sp.name}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
