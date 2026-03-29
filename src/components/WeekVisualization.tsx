import { useRef } from 'react';
import { DAYS, ScheduleData, Category, getCategoryColor, getCategoryStats } from '@/lib/schedule-types';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  schedule: ScheduleData;
  categories: Category[];
  screenTimeHours?: number;
  screenTimeMinutes?: number;
}

export default function WeekVisualization({ schedule, categories, screenTimeHours = 0, screenTimeMinutes = 0 }: Props) {
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

  // Build a unified list: category stats + screen time inserted by percentage
  const hasScreenTime = screenTimeHours > 0 || screenTimeMinutes > 0;
  const totalScreenMins = screenTimeHours * 60 + screenTimeMinutes;
  const totalWeekMins = 168 * 60;
  const screenPct = Math.round((totalScreenMins / totalWeekMins) * 100);
  const screenHrs = totalScreenMins / 60;
  const screenLabel = screenHrs % 1 === 0 ? `${screenHrs}h` : `${screenHrs.toFixed(1)}h`;

  // Merge screen time into stats by percentage position
  type DisplayItem = { type: 'category'; stat: typeof stats[number] } | { type: 'screen' };
  const allItems: DisplayItem[] = stats.map(s => ({ type: 'category' as const, stat: s }));
  if (hasScreenTime) {
    const insertIdx = allItems.findIndex(item => item.type === 'category' && item.stat.percentage < screenPct);
    if (insertIdx === -1) {
      allItems.push({ type: 'screen' });
    } else {
      allItems.splice(insertIdx, 0, { type: 'screen' });
    }
  }

  // Items ≥10% get circles, <10% go to legend lines
  const circleItems = allItems.filter(item =>
    item.type === 'screen' ? screenPct >= 10 : item.stat.percentage >= 10
  );
  const legendItems = allItems.filter(item =>
    item.type === 'screen' ? screenPct < 10 : item.stat.percentage < 10
  );
  // Size circles based on count (max 5 circle sizes)
  const circleSizeMap = [160, 130, 100, 85, 75];

  const renderScreenTimeLegend = (delay: number) => (
    <motion.div
      key="screen-time"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-2"
    >
      <span className="w-5 h-5 flex items-center justify-center shrink-0" style={{ fontSize: 14 }}>📱</span>
      <span className="text-sm tabular-nums font-bold text-foreground">{screenPct}%</span>
      <span className="text-xs tabular-nums text-muted-foreground" style={{ fontFamily: "'Open Sans', sans-serif" }}>{screenLabel}</span>
      <span className="text-sm text-muted-foreground italic" style={{ fontFamily: "'Open Sans', sans-serif" }}>Screen time</span>
    </motion.div>
  );

  const renderScreenTimeCircle = (size: number, delay: number) => (
    <motion.div
      key="screen-time"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      className="rounded-full flex flex-col items-center justify-center font-bold shadow-lg"
      style={{
        width: size,
        height: size,
        backgroundColor: '#64748b',
        border: '2px dashed #94a3b8',
        color: 'white',
      }}
    >
      <span className="leading-none" style={{ fontSize: size * 0.22 }}>📱</span>
      <span className="leading-none mt-0.5" style={{ fontSize: size * 0.24 }}>{screenPct}%</span>
      <span className="opacity-80 leading-tight" style={{ fontSize: size * 0.09, fontFamily: "'Open Sans', sans-serif" }}>{screenLabel}</span>
      <span className="opacity-90" style={{ fontSize: size * 0.1, fontFamily: "'Open Sans', sans-serif" }}>Screen time</span>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Your Week, Visualised</h2>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
          <Download className="w-4 h-4" /> Save
        </Button>
      </div>

      <div ref={vizRef} className="bg-white rounded-2xl p-8" style={{ fontFamily: "'Parkinsans', sans-serif" }}>
        <div className="flex gap-8">
          {/* Left: Day columns */}
          <div className="flex flex-1" style={{ minHeight: 420, gap: '1px' }}>
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
            {/* Big circles for top items */}
            {circleItems.map((item, i) => {
              const size = circleSizeMap[Math.min(i, circleSizeMap.length - 1)];
              if (item.type === 'screen') {
                return renderScreenTimeCircle(size, 0.3 + i * 0.12);
              }
              const stat = item.stat;
              return (
                <motion.div
                  key={stat.name}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 200 }}
                  className="rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: stat.color,
                    border: 'none',
                  }}
                >
                  <span className="leading-none" style={{ fontSize: size * 0.28 }}>{stat.percentage}%</span>
                  <span className="opacity-80 leading-tight" style={{ fontSize: size * 0.09, fontFamily: "'Open Sans', sans-serif" }}>{formatHours(stat.slots)}</span>
                  <span className="opacity-90" style={{ fontSize: size * 0.11, fontFamily: "'Open Sans', sans-serif" }}>{stat.name}</span>
                </motion.div>
              );
            })}

            {/* Legend for items <10% */}
            {legendItems.length > 0 && (
              <div className="mt-2 space-y-2">
                {legendItems.map((item, i) => {
                  if (item.type === 'screen') {
                    return renderScreenTimeLegend(0.6 + i * 0.06);
                  }
                  const stat = item.stat;
                  return (
                    <motion.div
                      key={stat.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.06 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />
                      <span className="text-sm tabular-nums font-bold text-foreground">{stat.percentage}%</span>
                      <span className="text-xs tabular-nums text-muted-foreground" style={{ fontFamily: "'Open Sans', sans-serif" }}>{formatHours(stat.slots)}</span>
                      <span className="text-sm text-muted-foreground" style={{ fontFamily: "'Open Sans', sans-serif" }}>{stat.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
