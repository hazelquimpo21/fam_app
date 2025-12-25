'use client';

/**
 * ============================================================================
 * ✨ Someday Page
 * ============================================================================
 *
 * A wishlist for ideas, dreams, and future possibilities.
 * Items here are not committed to—they're things to consider "someday."
 *
 * Route: /someday
 *
 * Categories:
 * - Trip ideas
 * - Things to buy
 * - Things to try
 * - Ideas to explore
 *
 * Features (planned):
 * - Categorization
 * - "Make it happen" promotion to project
 * - Archive completed items
 *
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import {
  Sparkles,
  Plus,
  Plane,
  ShoppingBag,
  Lightbulb,
  Compass,
  MoreHorizontal,
  ArrowRight,
  Archive,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

/**
 * Someday item category type
 */
type SomedayCategory = 'trip' | 'purchase' | 'try' | 'idea';

/**
 * Category configuration
 */
const categoryConfig: Record<SomedayCategory, { label: string; icon: React.ElementType; color: string }> = {
  trip: { label: 'Trip Ideas', icon: Plane, color: 'text-blue-500 bg-blue-50' },
  purchase: { label: 'Things to Buy', icon: ShoppingBag, color: 'text-green-500 bg-green-50' },
  try: { label: 'Things to Try', icon: Compass, color: 'text-orange-500 bg-orange-50' },
  idea: { label: 'Ideas', icon: Lightbulb, color: 'text-purple-500 bg-purple-50' },
};

/**
 * Mock someday items
 * In production, this would come from useSomedayItems() hook
 */
const mockItems: Record<SomedayCategory, { id: string; title: string; notes?: string; createdAt: string }[]> = {
  trip: [
    { id: '1', title: 'Japan in cherry blossom season', notes: 'April timeframe, 2-3 weeks ideal', createdAt: '2024-10-15' },
    { id: '2', title: 'Iceland road trip', notes: 'Ring Road, Northern Lights', createdAt: '2024-11-20' },
    { id: '3', title: 'Disney World with kids', createdAt: '2024-09-05' },
  ],
  purchase: [
    { id: '4', title: 'Standing desk for office', notes: 'Jarvis or Uplift brands', createdAt: '2024-12-01' },
    { id: '5', title: 'New couch for living room', createdAt: '2024-11-10' },
  ],
  try: [
    { id: '6', title: 'Pottery class', createdAt: '2024-08-20' },
    { id: '7', title: 'Family camping trip', notes: 'Start with car camping', createdAt: '2024-10-30' },
  ],
  idea: [
    { id: '8', title: 'Start a family newsletter', createdAt: '2024-12-10' },
    { id: '9', title: 'Learn to make sourdough bread', createdAt: '2024-11-25' },
  ],
};

/**
 * SomedayItemCard Component
 */
interface SomedayItemCardProps {
  item: { id: string; title: string; notes?: string; createdAt: string };
  category: SomedayCategory;
  onPromote: (id: string) => void;
}

function SomedayItemCard({ item, category, onPromote }: SomedayItemCardProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 hover:border-neutral-300 transition-colors">
      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900">{item.title}</p>
        {item.notes && (
          <p className="text-sm text-neutral-500 line-clamp-2">{item.notes}</p>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <button
          onClick={() => onPromote(item.id)}
          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50"
          title="Make it happen"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          title="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Someday Page Component
 */
export default function SomedayPage() {
  const [selectedCategory, setSelectedCategory] = useState<SomedayCategory | 'all'>('all');

  // Log page load for debugging
  useEffect(() => {
    const totalItems = Object.values(mockItems).reduce((sum, items) => sum + items.length, 0);
    logger.info('Someday page loaded', { totalItems });
    logger.divider('Someday');
  }, []);

  /**
   * Handle promoting an item to a project
   */
  const handlePromote = (itemId: string) => {
    logger.info('Promoting someday item to project', { itemId });
    // In production: open project creation modal pre-filled with item info
  };

  /**
   * Get items to display based on selected category
   */
  const getDisplayItems = (): { category: SomedayCategory; items: typeof mockItems.trip }[] => {
    if (selectedCategory === 'all') {
      return (Object.keys(mockItems) as SomedayCategory[])
        .map((cat) => ({ category: cat, items: mockItems[cat] }))
        .filter(({ items }) => items.length > 0);
    }
    return [{ category: selectedCategory, items: mockItems[selectedCategory] }];
  };

  const displayItems = getDisplayItems();
  const totalItems = Object.values(mockItems).reduce((sum, items) => sum + items.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          <h1 className="text-xl font-semibold text-neutral-900">Someday</h1>
          <span className="text-sm text-neutral-500">({totalItems} dreams)</span>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Add Idea
        </Button>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
            selectedCategory === 'all'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          )}
        >
          All
        </button>
        {(Object.keys(categoryConfig) as SomedayCategory[]).map((cat) => {
          const config = categoryConfig[cat];
          const Icon = config.icon;
          const count = mockItems[cat].length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                selectedCategory === cat
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              <Icon className="h-4 w-4" />
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Items or empty state */}
      {totalItems === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Sparkles className="h-16 w-16 text-amber-500" />}
              title="Dream a little dream"
              description="Capture ideas for trips, purchases, and things to try someday!"
              action={{
                label: 'Add Idea',
                onClick: () => logger.info('Add idea clicked'),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {displayItems.map(({ category, items }) => {
            const config = categoryConfig[category];
            const Icon = config.icon;
            return (
              <div key={category} className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-500 uppercase tracking-wider">
                  <Icon className="h-4 w-4" />
                  {config.label}
                </h2>
                <div className="space-y-2">
                  {items.map((item) => (
                    <SomedayItemCard
                      key={item.id}
                      item={item}
                      category={category}
                      onPromote={handlePromote}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
