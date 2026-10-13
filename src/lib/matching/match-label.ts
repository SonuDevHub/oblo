// src/lib/matching/match-label.ts

export type MatchCategory = 'BEST' | 'GOOD' | 'OTHER' | 'FULL';

export interface MatchScoreParams {
  isFull: boolean;
  isExactRoute: boolean;
  timeDiffMinutes: number;
}

export function getMatchLabel(params: MatchScoreParams): MatchCategory {
  if (params.isFull) {
    return 'FULL';
  }
  if (params.isExactRoute && params.timeDiffMinutes <= 30) {
    return 'BEST';
  }
  if (params.timeDiffMinutes <= 60) {
    return 'GOOD';
  }
  return 'OTHER';
}

export const MATCH_LABELS: Record<MatchCategory, { label: string; badgeClass: string }> = {
  BEST: {
    label: 'Best match',
    badgeClass: 'bg-lime text-black font-semibold border-lime',
  },
  GOOD: {
    label: 'Good match',
    badgeClass: 'bg-accent text-lime font-medium border-border',
  },
  OTHER: {
    label: 'Available',
    badgeClass: 'bg-surface-3 text-muted-foreground border-border',
  },
  FULL: {
    label: 'Full',
    badgeClass: 'bg-surface-2 text-muted-foreground border-border',
  },
};
