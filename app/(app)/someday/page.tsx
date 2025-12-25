'use client';

/**
 * ============================================================================
 * ✨ Someday Page
 * ============================================================================
 *
 * A wishlist for ideas, dreams, and future possibilities.
 * Items here are not committed to - they're things to consider "someday."
 *
 * Route: /someday
 *
 * Categories:
 * - Trip ideas
 * - Things to buy
 * - Experiences to try
 * - House/home improvements
 * - Other ideas
 *
 * Features:
 * - Category filtering
 * - "Make it happen" promotion to project
 * - Archive and delete items
 *
 * ============================================================================
 */

import { useEffect, useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Plane,
  ShoppingBag,
  Lightbulb,
  Home,
  MoreHorizontal,
  ArrowRight,
  Archive,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import {
  useActiveSomedayItems,
  useCreateSomedayItem,
  useArchiveSomedayItem,
  useDeleteSomedayItem,
} from '@/lib/hooks/use-someday';
import { useCreateProject } from '@/lib/hooks/use-projects';
import type { SomedayItem, SomedayCategory } from '@/types/database';

/**
 * Category configuration
 */
const categoryConfig: Record<SomedayCategory, { label: string; icon: React.ElementType; color: string }> = {
  trip: { label: 'Trip Ideas', icon: Plane, color: 'text-blue-500 bg-blue-50' },
  purchase: { label: 'Things to Buy', icon: ShoppingBag, color: 'text-green-500 bg-green-50' },
  experience: { label: 'Experiences', icon: Lightbulb, color: 'text-orange-500 bg-orange-50' },
  house: { label: 'House/Home', icon: Home, color: 'text-purple-500 bg-purple-50' },
  other: { label: 'Other Ideas', icon: Sparkles, color: 'text-amber-500 bg-amber-50' },
};

/**
 * SomedayItemCard Component
 */
interface SomedayItemCardProps {
  item: SomedayItem;
  onPromote: (item: SomedayItem) => void;
  onArchive: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  isProcessing: boolean;
}

function SomedayItemCard({ item, onPromote, onArchive, onDelete, isProcessing }: SomedayItemCardProps) {
  const config = categoryConfig[item.category] || categoryConfig.other;
  const Icon = config.icon;

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 hover:border-neutral-300 transition-colors">
      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900">{item.title}</p>
        {item.description && (
          <p className="text-sm text-neutral-500 line-clamp-2">{item.description}</p>
        )}
        {item.estimated_cost && (
          <p className="text-sm text-neutral-500">Est. ${item.estimated_cost.toLocaleString()}</p>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <button
          onClick={() => onPromote(item)}
          disabled={isProcessing}
          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
          title="Make it happen (create project)"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onArchive(item.id)}
          disabled={isProcessing}
          className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50"
          title="Archive"
        >
          <Archive className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          disabled={isProcessing}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for someday items
 */
function SomedaySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 animate-pulse">
            <div className="h-8 w-8 bg-neutral-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-neutral-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type FilterValue = SomedayCategory | 'all';

/**
 * Someday Page Component
 */
export default function SomedayPage() {
  const [selectedCategory, setSelectedCategory] = useState<FilterValue>('all');

  // Fetch someday items from database
  const { data: items = [], isLoading, error } = useActiveSomedayItems();

  // Mutations
  const createItem = useCreateSomedayItem();
  const archiveItem = useArchiveSomedayItem();
  const deleteItem = useDeleteSomedayItem();
  const createProject = useCreateProject();

  const isProcessing = createItem.isPending || archiveItem.isPending ||
    deleteItem.isPending || createProject.isPending;

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped = new Map<SomedayCategory, SomedayItem[]>();

    // Initialize all categories
    (Object.keys(categoryConfig) as SomedayCategory[]).forEach((cat) => {
      grouped.set(cat, []);
    });

    // Group items
    items.forEach((item) => {
      const category = item.category || 'other';
      const list = grouped.get(category) || [];
      list.push(item);
      grouped.set(category, list);
    });

    return grouped;
  }, [items]);

  // Get filtered display items
  const displayItems = useMemo((): { category: SomedayCategory; items: SomedayItem[] }[] => {
    if (selectedCategory === 'all') {
      return (Object.keys(categoryConfig) as SomedayCategory[])
        .map((cat) => ({ category: cat, items: itemsByCategory.get(cat) || [] }))
        .filter(({ items }) => items.length > 0);
    }
    return [{
      category: selectedCategory,
      items: itemsByCategory.get(selectedCategory) || [],
    }];
  }, [selectedCategory, itemsByCategory]);

  // Log page load for debugging
  useEffect(() => {
    logger.info('Someday page loaded', {
      totalItems: items.length,
      selectedCategory,
    });
    logger.divider('Someday');
  }, [items.length, selectedCategory]);

  /**
   * Handle promoting an item to a project
   */
  const handlePromote = async (item: SomedayItem) => {
    logger.info('Promoting someday item to project', { itemId: item.id, title: item.title });

    await createProject.mutateAsync({
      title: item.title,
      description: item.description || undefined,
      status: 'planning',
    });

    // Archive the someday item since it's now a project
    await archiveItem.mutateAsync(item.id);
  };

  /**
   * Handle archiving an item
   */
  const handleArchive = (itemId: string) => {
    logger.info('Archiving someday item', { itemId });
    archiveItem.mutate(itemId);
  };

  /**
   * Handle deleting an item
   */
  const handleDelete = (itemId: string) => {
    logger.info('Deleting someday item', { itemId });
    deleteItem.mutate(itemId);
  };

  // Error state
  if (error) {
    logger.error('Failed to load someday items', { error });
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Sparkles className="h-16 w-16 text-red-500" />}
              title="Failed to load dreams"
              description="There was an error loading your someday items. Please try again."
              action={{
                label: 'Retry',
                onClick: () => window.location.reload(),
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          <h1 className="text-xl font-semibold text-neutral-900">Someday</h1>
          {!isLoading && (
            <span className="text-sm text-neutral-500">({items.length} dreams)</span>
          )}
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
          const count = itemsByCategory.get(cat)?.length || 0;
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

      {/* Loading state */}
      {isLoading && <SomedaySkeleton />}

      {/* Items or empty state */}
      {!isLoading && items.length === 0 ? (
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
        !isLoading && (
          <div className="space-y-6">
            {displayItems.map(({ category, items: categoryItems }) => {
              const config = categoryConfig[category];
              const Icon = config.icon;
              return (
                <div key={category} className="space-y-3">
                  <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-500 uppercase tracking-wider">
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </h2>
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <SomedayItemCard
                        key={item.id}
                        item={item}
                        onPromote={handlePromote}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                        isProcessing={isProcessing}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
