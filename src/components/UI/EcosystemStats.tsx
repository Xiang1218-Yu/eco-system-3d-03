import { useMemo } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { TROPHIC_LEVEL_COLORS, TROPHIC_LEVEL_LABELS, TROPHIC_LEVELS } from '@/data/species';
import type { DeathCause } from '@/types/ecosystem';

const DEATH_CAUSE_LABELS: Record<DeathCause, string> = {
  lifespan: '寿命结束',
  starvation: '能量耗尽',
  predation: '被捕食',
};

export function EcosystemStats() {
  const stats = useEcosystemStore((s) => s.stats);

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

  const latestTrend = stats.vitalTrends[stats.vitalTrends.length - 1];
  const netChange = (latestTrend?.births || 0) - (latestTrend?.deaths || 0);

  const trendLines = useMemo(() => {
    if (stats.vitalTrends.length === 0) {
      return { births: '', deaths: '' };
    }

    const maxValue = Math.max(
      1,
      ...stats.vitalTrends.flatMap((point) => [point.births, point.deaths]),
    );
    const toPoints = (key: 'births' | 'deaths') =>
      stats.vitalTrends
        .map((point, index) => {
          const x =
            stats.vitalTrends.length === 1
              ? 50
              : (index / (stats.vitalTrends.length - 1)) * 100;
          const y = 34 - (point[key] / maxValue) * 30;
          return `${x},${y}`;
        })
        .join(' ');

    return { births: toPoints('births'), deaths: toPoints('deaths') };
  }, [stats.vitalTrends]);

  const maxLevelEnergy = Math.max(
    1,
    ...TROPHIC_LEVELS.map((level) => stats.energyPyramid[level].energy),
  );

  return (
    <div className="absolute bottom-4 left-4 z-30">
      <GlassCard className="p-4 w-80 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin">
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

        <div className="mb-4 bg-white/5 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm">出生 / 死亡趋势</span>
            <span
              className="text-xs font-medium"
              style={{ color: netChange >= 0 ? '#4ADE80' : '#F87171' }}
            >
              净变化 {netChange >= 0 ? '+' : ''}{netChange}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
            <div className="rounded-md bg-emerald-400/10 px-2 py-1">
              <span className="text-emerald-300">出生</span>
              <span className="float-right text-white font-mono">{stats.birthCount}</span>
            </div>
            <div className="rounded-md bg-red-400/10 px-2 py-1">
              <span className="text-red-300">死亡</span>
              <span className="float-right text-white font-mono">{stats.deathCount}</span>
            </div>
          </div>

          {stats.vitalTrends.length > 0 ? (
            <svg viewBox="0 0 100 36" className="w-full h-16 overflow-visible">
              <line x1="0" y1="34" x2="100" y2="34" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              <polyline
                points={trendLines.births}
                fill="none"
                stroke="#4ADE80"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={trendLines.deaths}
                fill="none"
                stroke="#F87171"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <div className="h-16 flex items-center justify-center text-white/35 text-xs">
              运行模拟后显示趋势
            </div>
          )}

          <div className="mt-2 grid grid-cols-3 gap-1">
            {(Object.keys(DEATH_CAUSE_LABELS) as DeathCause[]).map((cause) => (
              <div key={cause} className="rounded-md bg-white/5 px-1.5 py-1 text-center">
                <div className="text-white/45 text-[10px]">{DEATH_CAUSE_LABELS[cause]}</div>
                <div className="text-white text-xs font-mono">{stats.deathsByCause[cause]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm">能量金字塔</span>
            <span className="text-white/40 text-[10px]">按营养级汇总</span>
          </div>
          <div className="space-y-2">
            {TROPHIC_LEVELS.map((level) => {
              const levelStats = stats.energyPyramid[level];
              const percent = Math.max(0, Math.min(100, (levelStats.energy / maxLevelEnergy) * 100));
              return (
                <div key={level}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span style={{ color: TROPHIC_LEVEL_COLORS[level] }}>
                      {TROPHIC_LEVEL_LABELS[level]}
                    </span>
                    <span className="text-white/80 font-mono">
                      {Math.round(levelStats.energy)} · {levelStats.population}只
                    </span>
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
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm">物种多样性</span>
            <span className="text-cyan-300 font-mono text-sm">
              H′ {stats.diversityIndex.toFixed(2)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-white/5 px-2 py-1.5">
              <div className="text-white/45">现存物种</div>
              <div className="text-white font-mono">{stats.speciesRichness}</div>
            </div>
            <div className="rounded-md bg-white/5 px-2 py-1.5">
              <div className="text-white/45">均匀度</div>
              <div className="text-white font-mono">{stats.speciesEvenness.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
