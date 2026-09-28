import { useMemo } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { SPECIES, TROPHIC_LEVEL_COLORS, TROPHIC_LEVEL_LABELS } from '@/data/species';
import type { TrophicLevel } from '@/types/ecosystem';

export function EcosystemStats() {
  const organisms = useEcosystemStore((s) => s.organisms);
  const simulationTime = useEcosystemStore((s) => s.simulationTime);
  const getStats = useEcosystemStore((s) => s.getStats);

  const stats = useMemo(() => getStats(), [organisms, simulationTime, getStats]);

  const levelData = useMemo(() => {
    const levels: Record<TrophicLevel, number> = {
      producer: 0,
      herbivore: 0,
      carnivore: 0,
      decomposer: 0,
    };
    SPECIES.forEach((sp) => {
      levels[sp.trophicLevel] += stats.populationBySpecies[sp.id] || 0;
    });
    return levels;
  }, [stats.populationBySpecies]);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 100);
    const secs = t % 100;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBalanceColor = (balance: number) => {
    if (balance >= 70) return '#4ADE80';
    if (balance >= 40) return '#FBBF24';
    return '#F87171';
  };

  const getBalanceLabel = (balance: number) => {
    if (balance >= 70) return '生态平衡';
    if (balance >= 40) return '略有波动';
    return '需要调整';
  };

  return (
    <div className="absolute bottom-4 left-4 z-30">
      <GlassCard className="p-4 w-72">
        <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
          <span className="text-xl">📊</span> 生态数据
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/60 text-xs">模拟时间</div>
            <div className="text-white font-mono text-lg">{formatTime(stats.time)}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/60 text-xs">生物总数</div>
            <div className="text-white font-mono text-lg">{stats.totalOrganisms}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white/80 text-sm">生态平衡指数</span>
            <span
              className="font-bold text-sm"
              style={{ color: getBalanceColor(stats.balanceIndex) }}
            >
              {Math.round(stats.balanceIndex)}%
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats.balanceIndex}%`,
                backgroundColor: getBalanceColor(stats.balanceIndex),
                boxShadow: `0 0 10px ${getBalanceColor(stats.balanceIndex)}`,
              }}
            />
          </div>
          <div
            className="text-right text-xs mt-1"
            style={{ color: getBalanceColor(stats.balanceIndex) }}
          >
            {getBalanceLabel(stats.balanceIndex)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-white/60 text-xs mb-2">各营养级分布</div>
          {(Object.keys(levelData) as TrophicLevel[]).map((level) => {
            const count = levelData[level];
            const percent = stats.totalOrganisms > 0 ? (count / stats.totalOrganisms) * 100 : 0;
            return (
              <div key={level}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span style={{ color: TROPHIC_LEVEL_COLORS[level] }}>
                    {TROPHIC_LEVEL_LABELS[level]}
                  </span>
                  <span className="text-white/80">{count}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: TROPHIC_LEVEL_COLORS[level],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
