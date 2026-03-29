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
    let current = '';
    let count = 0;
    for (const slot of slots) {
      if (slot === current) {
        count++;
      } else {
        if (current) blocks.push({ category: current, count });
        current = slot;
        count = 1;
      }
    }
    if (current) blocks.push({ category: current, count });
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

  // Convert slots to hours
  const formatHours = (slots: number) => {
    const hours = slots / 2;
    return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
  };

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

      <div ref={vizRef} className="bg-card rounded-2xl p-8 space-y-8" style={{ fontFamily: "'Parkinsans', sans-serif" }}>
        {/* Title */}
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-bold text-foreground">My Week</h3>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {formatHours(filledSlots)} scheduled out of 168h
          </p>
        </div>

        {/* Stacked horizontal bar — full week overview */}
        <div className="space-y-3">
          <div className="h-10 rounded-full overflow-hidden flex shadow-sm">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.name}
                initial={{ width: 0 }}
                animate={{ width: `${stat.percentage}%` }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                style={{ backgroundColor: stat.color }}
                className="relative group cursor-default"
                title={`${stat.name}: ${stat.percentage}%`}
              >
                {stat.percentage >= 8 && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">
                    {stat.percentage}%
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Day columns visualisation */}
        <div className="space-y-3">
          <div className="flex gap-1">
            {DAYS.map((day, i) => {
              const blocks = buildDayBlocks(day);
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="flex-1 flex flex-col rounded-lg overflow-hidden"
                  style={{ minHeight: 280, transformOrigin: 'bottom' }}
                >
                  {blocks.map((block, j) => (
                    <div
                      key={j}
                      style={{
                        height: `${(block.count / 48) * 100}%`,
                        backgroundColor: getCategoryColor(block.category, categories),
                      }}
                    />
                  ))}
                </motion.div>
              );
            })}
          </div>
          <div className="flex gap-1">
            {DAYS.map(day => (
              <div key={day} className="flex-1 text-center">
                <span className="text-xs font-medium text-muted-foreground">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="space-y-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: stat.color }}
              />
              <span className="text-sm font-medium text-foreground flex-1" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                {stat.name}
              </span>
              <span className="text-sm tabular-nums text-muted-foreground" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                {formatHours(stat.slots)}
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground w-10 text-right">
                {stat.percentage}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
