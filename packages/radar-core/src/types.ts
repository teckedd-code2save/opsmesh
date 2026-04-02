export type SourceKind = 'rss' | 'html' | 'api' | 'board';
export type OpportunityStatus = 'new' | 'shortlisted' | 'saved' | 'rejected' | 'drafted' | 'applied' | 'archived';
export type PayType = 'hourly' | 'fixed' | 'unknown';
export type Recommendation = 'strong_match' | 'maybe' | 'weak' | 'avoid';

export type RadarSourceRecord = {
  id: string;
  name: string;
  kind: SourceKind;
  baseUrl: string;
  feedUrl?: string;
  parserKey: string;
  active: boolean;
  pollIntervalMin: number;
  lastPolledAt?: string;
  lastPollStatus?: 'idle' | 'running' | 'success' | 'error';
  lastPollMessage?: string;
  lastPollStartedAt?: string;
  lastPollDurationMs?: number;
  qualityScore?: number;
  totalPolls?: number;
  totalOpportunitiesSeen?: number;
  totalRelevantSeen?: number;
  consecutiveLowSignalRuns?: number;
  autoDisabledAt?: string;
};

export type OpportunityScoreRecord = {
  fitScore: number;
  payScore: number;
  qualityScore: number;
  effortScore: number;
  confidenceScore: number;
  recommendation: Recommendation;
  reasoningSummary: string;
  strengths: string[];
  risks: string[];
};

export type OpportunityRecord = {
  id: string;
  sourceId: string;
  sourceName: string;
  canonicalUrl: string;
  title: string;
  company?: string;
  location?: string;
  remote: boolean;
  summary?: string;
  rawText: string;
  payType: PayType;
  payMin?: string;
  payMax?: string;
  currency?: string;
  status: OpportunityStatus;
  lane?: 'dev' | 'nondev';
  tags: string[];
  fetchedAt: string;
  score?: OpportunityScoreRecord;
  telegramDeliveredAt?: string;
  telegramDeliveryError?: string;
};

export type RadarPreferenceRecord = {
  userId: string;
  displayName: string;
  minHourlyRate?: string;
  minFixedBudget?: string;
  remoteOnly: boolean;
  preferredKeywords: string[];
  excludedKeywords: string[];
  allowedCategories: string[];
  notes?: string;
  minFitScore?: number;
  telegramEnabled?: boolean;
  telegramHighScoreOnly?: boolean;
  telegramMinScore?: number;
  autoPollingEnabled?: boolean;
  autoPollingIntervalMin?: number;
  webhookUrl?: string;
};

export type ProposalDraftRecord = {
  id: string;
  opportunityId: string;
  subjectLine?: string;
  body: string;
  talkingPoints: string[];
  createdAt: string;
};
