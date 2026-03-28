import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DAYS, ScheduleData, Category, DEFAULT_CATEGORIES, createEmptySchedule, createDefaultSleepSettings, applySleepToSchedule, SleepSettings } from '@/lib/schedule-types';
import ScheduleGrid from '@/components/ScheduleGrid';
import SleepSettingsPanel from '@/components/SleepSettings';
import CategoryManager from '@/components/CategoryManager';
import WeekVisualization from '@/components/WeekVisualization';
import FeedbackWidget from '@/components/FeedbackWidget';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, BarChart3 } from 'lucide-react';

export default function Index() {
  const [schedule, setSchedule] = useState<ScheduleData>(createEmptySchedule());
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [sleepSettings, setSleepSettings] = useState<SleepSettings>(createDefaultSleepSettings());
  const [tab, setTab] = useState('input');

  const handleApplySleep = useCallback(() => {
    setSchedule(prev => applySleepToSchedule(prev, sleepSettings));
  }, [sleepSettings]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-card"
      >
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">WeekViz</h1>
            <p className="text-sm text-muted-foreground">Visualize how you spend your week</p>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="input" className="gap-1.5">
                <CalendarDays className="w-4 h-4" /> Schedule
              </TabsTrigger>
              <TabsTrigger value="viz" className="gap-1.5">
                <BarChart3 className="w-4 h-4" /> Visualize
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {tab === 'input' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Setup panels */}
            <div className="grid md:grid-cols-2 gap-4">
              <SleepSettingsPanel settings={sleepSettings} onChange={setSleepSettings} onApply={handleApplySleep} />
              <CategoryManager categories={categories} onChange={setCategories} />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setSchedule(createEmptySchedule())} variant="outline" size="sm" className="text-destructive">
                Clear All
              </Button>
            </div>

            {/* Grid */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Click any slot to assign a category · Drag to select multiple · Ctrl+C / Ctrl+V to copy & paste</p>
              <ScheduleGrid schedule={schedule} categories={categories} onChange={setSchedule} />
            </div>

            <div className="text-center">
              <Button onClick={() => setTab('viz')} size="lg" className="gap-2">
                <BarChart3 className="w-5 h-5" /> See Visualization →
              </Button>
            </div>
          </motion.div>
        )}

        {tab === 'viz' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <WeekVisualization schedule={schedule} categories={categories} />
          </motion.div>
        )}
      </main>

      <FeedbackWidget />
    </div>
  );
}
