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

      <div ref={vizRef} className="bg-card rounded-xl p-6 space-y-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <h3 className="text-xl font-bold text-foreground text-center">My Week</h3>
        {/* Stacked bar chart */}
        <div className="space-y-1">
          {DAYS.map((day, i) => {
            const blocks = buildDayBlocks(day);
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex h-10 rounded-sm overflow-hidden"
              >
                {blocks.map((block, j) => (
                  <div
                    key={j}
                    className="h-full flex items-center justify-center text-[10px] font-semibold overflow-hidden"
                    style={{
                      width: `${(block.count / 48) * 100}%`,
                      backgroundColor: getCategoryColor(block.category, categories),
                      color: 'white',
                    }}
                    title={`${block.category} (${(block.count / 2).toFixed(1)}h)`}
                  >
                    {block.count > 3 ? block.category : ''}
                  </div>
                ))}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center pt-2">
          {stats.map(stat => (
            <div key={stat.name} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor: stat.color, color: 'white' }}>
                {stat.percentage}%
              </div>
              <span className="text-sm font-medium text-foreground">{stat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
