import { useMemo } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import { TROPHIC_LEVEL_COLORS, TROPHIC_LEVEL_LABELS } from '@/data/species';
import type { TrophicLevel } from '@/types/ecosystem';

const TROPHIC_LEVEL_ORDER: TrophicLevel[] = ['producer', 'herbivore', 'carnivore', 'decomposer'];
const DEATH_CAUSE_LABELS = {
  lifespan: '寿命',
  starvation: '饥饿',
  predation: '捕食',
} as const;

function buildSparkline(values: number[], width: number, height: number, maxValue?: number) {
  if (values.length < 2) return null;

  const top = Math.max(1, maxValue ?? Math.max(...values, 1));
  const stepX = width / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / top) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export function EcosystemStats() {
  const stats = useEcosystemStore((s) => s.stats);

  const birthPath = useMemo(
    () =>
      buildSparkline(
        stats.populationTrend.map((point) => point.births),
        232,
        28,
        Math.max(4, ...stats.populationTrend.map((point) => point.births)),
      ),
    [stats.populationTrend],
  );
  const deathPath = useMemo(
    () =>
      buildSparkline(
        stats.populationTrend.map((point) => point.deaths),
        232,
        28,
        Math.max(4, ...stats.populationTrend.map((point) => point.deaths)),
      ),
    [stats.populationTrend],
  );

  const latestPoint = stats.populationTrend[stats.populationTrend.length - 1];
  const latestBirths = latestPoint?.births ?? 0;
  const latestDeaths = latestPoint?.deaths ?? 0;
  const populationDelta = latestBirths - latestDeaths;
  const maxPyramidEnergy = Math.max(
    1,
    ...TROPHIC_LEVEL_ORDER.map((level) => stats.energyPyramid[level]?.totalEnergy ?? 0),
  );

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
    <div className="absolute bottom-4 left-4 z-30 max-h-[calc(100vh-2rem)] overflow-y-auto">
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
              className="h-full rounded-full transition-all duration-300"
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

        <div className="mb-4 space-y-2">
          <div className="text-white/60 text-xs">出生 / 死亡趋势（近 60 步）</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-emerald-400/10 rounded-lg p-2">
              <div className="flex justify-between text-emerald-300">
                <span>出生</span>
                <span className="font-mono">+{latestBirths}</span>
              </div>
              <svg width="100%" height="28" viewBox="0 0 232 28" preserveAspectRatio="none">
                {birthPath && (
                  <path d={birthPath} fill="none" stroke="#4ADE80" strokeWidth="2" />
                )}
              </svg>
            </div>
            <div className="bg-rose-400/10 rounded-lg p-2">
              <div className="flex justify-between text-rose-300">
                <span>死亡</span>
                <span className="font-mono">-{latestDeaths}</span>
              </div>
              <svg width="100%" height="28" viewBox="0 0 232 28" preserveAspectRatio="none">
                {deathPath && <path d={deathPath} fill="none" stroke="#F87171" strokeWidth="2" />}
              </svg>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/60">
              本步净变化：
              <span
                className={
                  populationDelta > 0
                    ? 'text-emerald-300'
                    : populationDelta < 0
                      ? 'text-rose-300'
                      : 'text-white/80'
                }
              >
                {populationDelta > 0 ? '+' : ''}
                {populationDelta}
              </span>
            </span>
            <span className="text-white/60">
              累计 {stats.cumulativeBirths} / {stats.cumulativeDeaths}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
            {(Object.keys(DEATH_CAUSE_LABELS) as Array<keyof typeof DEATH_CAUSE_LABELS>).map(
              (cause) => (
                <div key={cause} className="bg-white/5 rounded px-1 py-1">
                  <div className="text-white/50">{DEATH_CAUSE_LABELS[cause]}</div>
                  <div className="text-white/90 font-mono">{stats.deathsByCause[cause]}</div>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-white/60">能量金字塔</span>
            <span className="text-white/60">
              多样性 H′ {stats.diversityIndex.toFixed(2)}
            </span>
          </div>
          <div className="space-y-2">
            {TROPHIC_LEVEL_ORDER.map((level) => {
              const levelStats = stats.energyPyramid[level];
              const count = levelStats.population;
              const countPercent =
                stats.totalOrganisms > 0 ? (count / stats.totalOrganisms) * 100 : 0;
              const energyPercent = (levelStats.totalEnergy / maxPyramidEnergy) * 100;

              return (
                <div key={level} className="text-xs">
                  <div className="flex justify-between mb-0.5">
                    <span style={{ color: TROPHIC_LEVEL_COLORS[level] }}>
                      {TROPHIC_LEVEL_LABELS[level]}
                    </span>
                    <span className="text-white/70 font-mono">
                      {count} 只 · {Math.round(levelStats.totalEnergy)} E
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${countPercent}%`,
                        backgroundColor: TROPHIC_LEVEL_COLORS[level],
                      }}
                    />
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full rounded-full opacity-60 transition-all duration-300"
                      style={{
                        width: `${energyPercent}%`,
                        backgroundColor: TROPHIC_LEVEL_COLORS[level],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-white/50 mt-1">
            <span>上层：数量占比</span>
            <span>下层：能量占比</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/50">现存物种</div>
            <div className="text-white font-mono">
              {stats.speciesRichness}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/50">均匀度</div>
            <div className="text-white font-mono">{(stats.speciesEvenness * 100).toFixed(0)}%</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
