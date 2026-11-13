/** @jsxImportSource react */

'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface ActionFeedback {
  icon?: string;
  label: string;
}

type FeedbackContextType = (f: ActionFeedback) => void;

const FeedbackContext = createContext<FeedbackContextType>(() => {});

export function useFeedback() {
  return useContext(FeedbackContext);
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

  const triggerFeedback = useCallback((f: ActionFeedback) => {
    setFeedback(f);
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <FeedbackContext.Provider value={triggerFeedback}>
      {children}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="pointer-events-none absolute left-1/2 top-10 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--spill-key,#FFB04A)]/40 bg-[var(--spill-panel,#191517)]/90 px-4 py-2 font-mono text-sm font-semibold text-[var(--spill-diffusion,#F4ECDF)] shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {feedback.icon && <span className="text-base">{feedback.icon}</span>}
          <span>{feedback.label}</span>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
