import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface Props {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
}

export default function ScreenTimePanel({ hours, minutes, onChange }: Props) {
  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-display font-semibold text-foreground">📱 Phone screen time</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-sm">
              Tracking screen time helps you see how much of your week goes to your phone — find it in Settings → Screen Time (iPhone) or Settings → Digital Wellbeing (Android).
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-sm text-muted-foreground -mt-1">Enter your total weekly screen time.</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            max={168}
            value={hours || ''}
            onChange={(e) => onChange(Math.min(168, Math.max(0, parseInt(e.target.value) || 0)), minutes)}
            className="w-16 h-8 text-sm text-center"
            placeholder="0"
          />
          <Label className="text-sm text-muted-foreground">hrs</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            max={59}
            value={minutes || ''}
            onChange={(e) => onChange(hours, Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-16 h-8 text-sm text-center"
            placeholder="0"
          />
          <Label className="text-sm text-muted-foreground">min</Label>
        </div>
      </div>
    </div>
  );
}
