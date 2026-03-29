import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DAYS, ScheduleData, Category, DEFAULT_CATEGORIES, createEmptySchedule, createDefaultSleepSettings, applySleepToSchedule, SleepSettings } from '@/lib/schedule-types';
import ScheduleGrid from '@/components/ScheduleGrid';
import SleepSettingsPanel from '@/components/SleepSettings';
import CategoryManager from '@/components/CategoryManager';
import ScreenTimePanel from '@/components/ScreenTimePanel';
import WeekVisualization from '@/components/WeekVisualization';
import FeedbackWidget from '@/components/FeedbackWidget';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, BarChart3 } from 'lucide-react';

const defaultSleep = createDefaultSleepSettings();

export default function Index() {
  const [schedule, setSchedule] = useState<ScheduleData>(() => applySleepToSchedule(createEmptySchedule(), defaultSleep));
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [sleepSettings, setSleepSettings] = useState<SleepSettings>(defaultSleep);
  const [screenTimeHours, setScreenTimeHours] = useState(0);
  const [screenTimeMinutes, setScreenTimeMinutes] = useState(0);
  const [tab, setTab] = useState('input');

  // Auto-apply sleep whenever settings change
  useEffect(() => {
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
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">My week visualisation</h1>
            <p className="text-sm text-muted-foreground">See where your time really goes — and take control of it.</p>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="input" className="gap-1.5">
                <CalendarDays className="w-4 h-4" /> Schedule
              </TabsTrigger>
              <TabsTrigger value="viz" className="gap-1.5">
                <BarChart3 className="w-4 h-4" /> Visualise
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
              <div className="space-y-4">
                <SleepSettingsPanel settings={sleepSettings} onChange={setSleepSettings} />
                <ScreenTimePanel hours={screenTimeHours} minutes={screenTimeMinutes} onChange={(h, m) => { setScreenTimeHours(h); setScreenTimeMinutes(m); }} />
              </div>
              <CategoryManager categories={categories} onChange={setCategories} />
            </div>

            <div>
              <h3 className="font-display font-semibold text-foreground mb-1">📅 Plan Your Week</h3>
              <p className="text-sm text-muted-foreground">Click any slot to assign a category · Drag to select multiple · Ctrl+C / Ctrl+V to copy & paste</p>
            </div>

            {/* Grid */}
            <div>
              <ScheduleGrid schedule={schedule} categories={categories} onChange={setSchedule} />
            </div>

            <div className="flex items-center justify-between">
              <Button onClick={() => setSchedule(createEmptySchedule())} variant="outline" size="sm" className="text-destructive">
                Clear All
              </Button>
              <Button onClick={() => setTab('viz')} size="lg" className="gap-2">
                <BarChart3 className="w-5 h-5" /> See Visualisation →
              </Button>
            </div>
          </motion.div>
        )}

        {tab === 'viz' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <WeekVisualization schedule={schedule} categories={categories} screenTimeHours={screenTimeHours} screenTimeMinutes={screenTimeMinutes} />
          </motion.div>
        )}
      </main>

      <footer className="border-t bg-card mt-12 py-4 text-center">
        <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
          Privacy Policy
        </Link>
      </footer>

      <FeedbackWidget />
    </div>
  );
}
