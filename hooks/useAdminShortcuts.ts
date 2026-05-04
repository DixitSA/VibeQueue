'use client';

import { useEffect } from 'react';

/**
 * Global keyboard shortcuts for the Admin Command Center.
 */
export function useAdminShortcuts({
  onSkip,
  onToggleApproval,
  onSwitchTab
}: {
  onSkip?:           () => void;
  onToggleApproval?: () => void;
  onSwitchTab?:     (tab: 'player' | 'queue') => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          onSkip?.();
          break;
        case 'a':
          e.preventDefault();
          onToggleApproval?.();
          break;
        case '1':
          e.preventDefault();
          onSwitchTab?.('player');
          break;
        case '2':
          e.preventDefault();
          onSwitchTab?.('queue');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip, onToggleApproval, onSwitchTab]);
}
