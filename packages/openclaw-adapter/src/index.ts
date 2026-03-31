export type AnalyzeOpportunityInput = {
  title: string;
  company?: string;
  location?: string;
  summary?: string;
  rawText: string;
  canonicalUrl: string;
};

export type AnalyzeOpportunityOutput = {
  fitScore: number;
  payScore: number;
  qualityScore: number;
  effortScore: number;
  confidenceScore: number;
  recommendation: 'strong_match' | 'maybe' | 'weak' | 'avoid';
  reasoningSummary: string;
  strengths: string[];
  risks: string[];
};

export type DraftProposalInput = {
  title: string;
  company?: string;
  summary?: string;
  sourceName: string;
  canonicalUrl: string;
  recommendation?: AnalyzeOpportunityOutput['recommendation'];
  fitScore?: number;
  strengths?: string[];
};

export type DraftProposalOutput = {
  subjectLine: string;
  body: string;
  talkingPoints: string[];
};

export async function analyzeOpportunity(input: AnalyzeOpportunityInput): Promise<AnalyzeOpportunityOutput> {
  const { runOpenClawOpportunityAnalysis } = await import('./runtime');
  return runOpenClawOpportunityAnalysis(input);
}

export async function draftProposal(input: DraftProposalInput): Promise<DraftProposalOutput> {
  const { runOpenClawProposalDraft } = await import('./runtime');
  return runOpenClawProposalDraft(input);
}

export * from './runtime';
export * from './notify';
export * from './tasks';
