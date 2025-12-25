'use client';

/**
 * ============================================================================
 * 📥 Inbox Page
 * ============================================================================
 *
 * The inbox is a quick capture location for ideas, tasks, and thoughts that
 * need to be processed later. Users can capture anything here and then triage
 * it into tasks, projects, or someday items.
 *
 * Route: /inbox
 *
 * Features (planned):
 * - Quick capture input
 * - List of unprocessed items
 * - Processing actions (→ Task, → Project, → Someday, Delete)
 * - "Process All" batch mode
 *
 * ============================================================================
 */

import { useEffect } from 'react';
import { Inbox, Plus, ArrowRight, Trash2, FolderOpen, Sparkles, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { logger } from '@/lib/utils/logger';

/**
 * Mock inbox items for demonstration
 * In production, these would come from the database via useTasks({ status: 'inbox' })
 */
const mockInboxItems = [
  { id: '1', title: 'Look into summer camp options', createdAt: '2024-12-22' },
  { id: '2', title: 'Call plumber about leak', createdAt: '2024-12-23' },
  { id: '3', title: 'Trip idea: Japan in spring', createdAt: '2024-12-23' },
];

/**
 * InboxItem Component
 * Displays a single inbox item with processing actions
 */
interface InboxItemProps {
  item: { id: string; title: string; createdAt: string };
  onProcess: (id: string, action: 'task' | 'project' | 'someday' | 'delete') => void;
}

function InboxItem({ item, onProcess }: InboxItemProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Item title and date */}
          <div>
            <p className="font-medium text-neutral-900">{item.title}</p>
            <p className="text-sm text-neutral-500">
              Added {new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Processing actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<CheckSquare className="h-4 w-4" />}
              onClick={() => onProcess(item.id, 'task')}
            >
              Task
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FolderOpen className="h-4 w-4" />}
              onClick={() => onProcess(item.id, 'project')}
            >
              Project
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Sparkles className="h-4 w-4" />}
              onClick={() => onProcess(item.id, 'someday')}
            >
              Someday
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => onProcess(item.id, 'delete')}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Inbox Page Component
 */
export default function InboxPage() {
  // Log page load for debugging
  useEffect(() => {
    logger.info('Inbox page loaded', { itemCount: mockInboxItems.length });
    logger.divider('Inbox');
  }, []);

  /**
   * Handle processing an inbox item
   * TODO: Implement actual processing logic with mutations
   */
  const handleProcess = (id: string, action: 'task' | 'project' | 'someday' | 'delete') => {
    logger.info('Processing inbox item', { id, action });
    // In production: call appropriate mutation and update UI
  };

  /**
   * Handle quick capture
   * TODO: Implement actual capture logic
   */
  const handleQuickCapture = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    if (title.trim()) {
      logger.info('Quick capture', { title });
      // In production: call createTask mutation with status: 'inbox'
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick capture form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleQuickCapture} className="flex gap-2">
            <Input
              name="title"
              placeholder="Capture something... (press Enter)"
              className="flex-1"
            />
            <Button type="submit">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Header with count and process all button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-indigo-600" />
          <span className="text-sm text-neutral-600">
            {mockInboxItems.length} items to process
          </span>
        </div>
        {mockInboxItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => logger.info('Process All clicked')}
          >
            Process All
          </Button>
        )}
      </div>

      {/* Inbox items or empty state */}
      {mockInboxItems.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Inbox className="h-16 w-16 text-green-500" />}
              title="Inbox Zero! 🎉"
              description="Everything's been processed. Nice work!"
              action={{
                label: 'Capture something',
                onClick: () => document.querySelector('input')?.focus(),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mockInboxItems.map((item) => (
            <InboxItem key={item.id} item={item} onProcess={handleProcess} />
          ))}
        </div>
      )}
    </div>
  );
}
