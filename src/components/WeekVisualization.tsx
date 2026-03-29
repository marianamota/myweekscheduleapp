import { useRef } from 'react';
import { DAYS, ScheduleData, Category, getCategoryColor, getCategoryStats } from '@/lib/schedule-types';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  schedule: ScheduleData;
  categories: Category[];
}

export default function WeekVisualization({ schedule, categories }: Props) {
  const vizRef = useRef<HTMLDivElement>(null);
  const stats = getCategoryStats(schedule, categories);

  const handleDownload = async () => {
    if (!vizRef.current) return;
    const dataUrl = await toPng(vizRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = 'my-week-visualised.png';
    link.href = dataUrl;
    link.click();
  };

  const handleShare = async () => {
    if (!vizRef.current) return;
    try {
      const dataUrl = await toPng(vizRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'my-week.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({ files: [file], title: 'My Week Visualised' });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  const buildDayBlocks = (day: typeof DAYS[number]) => {
    const slots = schedule[day];
    const blocks: { category: string; count: number }[] = [];
    let current: string | null = null;
    let count = 0;
    for (const slot of slots) {
      const key = slot || '__empty__';
      if (key === current) {
        count++;
      } else {
        if (current !== null) blocks.push({ category: current, count });
        current = key;
        count = 1;
      }
    }
    if (current !== null) blocks.push({ category: current, count });
    return blocks;
  };

  const filledSlots = DAYS.reduce((sum, day) => sum + schedule[day].filter(Boolean).length, 0);
  const totalSlots = 48 * 7;
  const completion = Math.round((filledSlots / totalSlots) * 100);

  if (completion < 20) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-display">Fill in at least 20% of your schedule to see the visualisation</p>
        <p className="text-sm mt-2">Currently: {completion}% filled</p>
      </div>
    );
  }

  const formatHours = (slots: number) => {
    const hours = slots / 2;
    return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
  };

  // Top 3 categories get big circles, rest go to legend
  const topStats = stats.slice(0, 3);
  const restStats = stats.slice(3);

  // Circle sizes for the top 3
  const circleSizes = [160, 130, 100];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Your Week, Visualised</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
            <Download className="w-4 h-4" /> Save
          </Button>
          <Button size="sm" onClick={handleShare} className="gap-1.5">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>
      </div>

      <div ref={vizRef} className="bg-white rounded-2xl p-8" style={{ fontFamily: "'Parkinsans', sans-serif" }}>
        <div className="flex gap-8">
          {/* Left: Day columns */}
          <div className="flex gap-1 flex-1" style={{ minHeight: 420 }}>
            {DAYS.map((day, i) => {
              const blocks = buildDayBlocks(day);
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="flex-1 flex flex-col"
                  style={{ transformOrigin: 'bottom' }}
                >
                  {blocks.map((block, j) => (
                    <div
                      key={j}
                      style={{
                        height: `${(block.count / 48) * 100}%`,
                        backgroundColor: block.category === '__empty__'
                          ? 'hsl(var(--muted) / 0.3)'
                          : getCategoryColor(block.category, categories),
                      }}
                    />
                  ))}
                </motion.div>
              );
            })}
          </div>

          {/* Right: Category circles + legend */}
          <div className="flex flex-col items-center justify-center gap-4" style={{ minWidth: 200 }}>
            {/* Big circles for top categories */}
            {topStats.map((stat, i) => (
              <motion.div
                key={stat.name}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 200 }}
                className="rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg"
                style={{
                  width: circleSizes[i],
                  height: circleSizes[i],
                  backgroundColor: stat.color,
                  border: i === 1 ? `3px solid ${topStats[0]?.color || stat.color}` : 'none',
                }}
              >
                <span
                  className="leading-none"
                  style={{ fontSize: circleSizes[i] * 0.28 }}
                >
                  {stat.percentage}%
                </span>
                <span
                  className="opacity-90"
                  style={{
                    fontSize: circleSizes[i] * 0.11,
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  {stat.name}
                </span>
              </motion.div>
            ))}

            {/* Small legend for remaining categories */}
            {restStats.length > 0 && (
              <div className="mt-2 space-y-2">
                {restStats.map((stat, i) => (
                  <motion.div
                    key={stat.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.06 }}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-5 h-5 rounded-full shrink-0"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span
                      className="text-sm tabular-nums font-bold text-foreground"
                    >
                      {stat.percentage}%
                    </span>
                    <span
                      className="text-sm text-muted-foreground"
                      style={{ fontFamily: "'Open Sans', sans-serif" }}
                    >
                      {stat.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
