import { Category, MAX_CATEGORIES } from '@/lib/schedule-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface Props {
  categories: Category[];
  onChange: (cats: Category[]) => void;
}

const COLOR_VARS = Array.from({ length: 10 }, (_, i) => `--cat-${i + 1}`);

export default function CategoryManager({ categories, onChange }: Props) {
  const addCategory = () => {
    if (categories.length >= MAX_CATEGORIES) return;
    const nextId = Math.max(0, ...categories.map(c => c.id)) + 1;
    const colorVar = COLOR_VARS[(categories.length) % 10];
    onChange([...categories, { id: nextId, name: '', colorVar }]);
  };

  const removeCategory = (id: number) => {
    onChange(categories.filter(c => c.id !== id));
  };

  const updateName = (id: number, name: string) => {
    onChange(categories.map(c => c.id === id ? { ...c, name } : c));
  };

  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <h3 className="font-display font-semibold text-foreground">🏷️ Categories</h3>
      <p className="text-xs text-muted-foreground">Add or edit the categories you'd like to track — up to {MAX_CATEGORIES}</p>
      <div className="flex flex-wrap gap-2">
        {categories.filter(cat => cat.name !== 'Sleeping').map(cat => (
          <div key={cat.id} className="flex items-center gap-1.5 bg-muted rounded-full pl-1 pr-2 py-1">
            <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: `hsl(var(${cat.colorVar}))` }} />
            <Input
              value={cat.name}
              onChange={(e) => updateName(cat.id, e.target.value)}
              className="h-6 w-28 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
              placeholder="Category name"
            />
            <button onClick={() => removeCategory(cat.id)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {categories.length < MAX_CATEGORIES && (
          <Button variant="outline" size="sm" onClick={addCategory} className="rounded-full h-8 text-xs gap-1">
            <Plus className="w-3 h-3" /> Add
          </Button>
        )}
      </div>
    </div>
  );
}
