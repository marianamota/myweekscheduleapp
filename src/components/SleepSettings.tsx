import { DAYS, TIME_SLOTS, SleepSettings as SleepSettingsType } from '@/lib/schedule-types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  settings: SleepSettingsType;
  onChange: (settings: SleepSettingsType) => void;
}

const timeOptions = TIME_SLOTS.filter((_, i) => i % 2 === 0 || true); // all half hours

export default function SleepSettingsPanel({ settings, onChange }: Props) {
  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <h3 className="font-display font-semibold text-foreground">🌙 Sleep schedule</h3>
      <p className="text-sm text-muted-foreground -mt-2">Set your usual sleep and wake times to get started.</p>
      <div className="flex items-center gap-3 flex-wrap">
        <Switch
          checked={settings.sameEveryDay}
          onCheckedChange={(v) => onChange({ ...settings, sameEveryDay: v })}
        />
        <Label className="text-sm text-muted-foreground">Same every day</Label>
        {settings.sameEveryDay && (
          <>
            <div className="h-5 w-px bg-border" />
            <TimeSelect label="Sleep at" value={settings.default.sleep} onChange={(v) => onChange({ ...settings, default: { ...settings.default, sleep: v } })} />
            <TimeSelect label="Wake at" value={settings.default.wake} onChange={(v) => onChange({ ...settings, default: { ...settings.default, wake: v } })} />
          </>
        )}
      </div>

      {!settings.sameEveryDay && (
        <div className="space-y-2">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium w-24 text-foreground">{day}</span>
              <TimeSelect label="Sleep" value={settings.perDay[day].sleep} onChange={(v) => {
                const newPerDay = { ...settings.perDay, [day]: { ...settings.perDay[day], sleep: v } };
                onChange({ ...settings, perDay: newPerDay });
              }} />
              <TimeSelect label="Wake" value={settings.perDay[day].wake} onChange={(v) => {
                const newPerDay = { ...settings.perDay, [day]: { ...settings.perDay[day], wake: v } };
                onChange({ ...settings, perDay: newPerDay });
              }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimeSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {timeOptions.map(t => (
            <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
