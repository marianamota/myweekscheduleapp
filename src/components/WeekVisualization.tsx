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

  // Build stacked rows per day — each row shows contiguous blocks
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
        <p className="text-lg font-display">Fill in at least 20% of your schedule to see the visualization</p>
        <p className="text-sm mt-2">Currently: {completion}% filled</p>
      </div>
    );
  }

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

      <div ref={vizRef} className="bg-card rounded-2xl p-8 space-y-6 shadow-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <h3 className="text-xl font-bold text-foreground text-center">My Week</h3>
        {/* Column-based visualisation — days as columns, time slots as rows */}
        <div className="flex gap-0">
          {/* Chart area */}
          <div className="flex flex-1 gap-1.5 rounded-2xl overflow-hidden">
            {DAYS.map((day, i) => {
              const blocks = buildDayBlocks(day);
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
                  className="flex-1 flex flex-col gap-[2px]"
                  style={{ minHeight: 420 }}
                >
                  {blocks.map((block, j) => (
                    <div
                      key={j}
                      className="rounded-lg transition-shadow hover:shadow-md"
                      style={{
                        height: `${(block.count / 48) * 100}%`,
                        backgroundColor: getCategoryColor(block.category, categories),
                        boxShadow: '0 2px 8px -2px rgba(0,0,0,0.1)',
                      }}
                      title={`${day}: ${block.category} (${(block.count / 2).toFixed(1)}h)`}
                    />
                  ))}
                </motion.div>
              );
            })}
          </div>

          {/* Legend on the right */}
          <div className="flex flex-col gap-3.5 justify-center pl-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 shadow-sm"
                  style={{ backgroundColor: stat.color, color: 'white' }}
                >
                  {stat.percentage}%
                </div>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">{stat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
