import { makeTelegramCallbackToken } from '@opsmesh/radar-core';
import type { AnalyzeOpportunityInput, AnalyzeOpportunityOutput, DraftProposalInput, DraftProposalOutput } from './index';
import type { HighSignalAlert } from './notify';

export function buildAnalyzeOpportunityTask(input: AnalyzeOpportunityInput) {
  return `You are the Gig Radar analysis agent inside OpsMesh, running atop OpenClaw.
Analyze this opportunity for a solo operator who prefers small, winnable, reasonably paid technical tasks.
Return strict JSON only with keys: fitScore, payScore, qualityScore, effortScore, confidenceScore, recommendation, reasoningSummary, strengths, risks.
Scores must be integers from 0 to 100.
Recommendation must be one of: strong_match, maybe, weak, avoid.

Opportunity:
${JSON.stringify(input, null, 2)}`;
}

export function buildHighSignalAlertText(input: HighSignalAlert) {
  return [
    '📌 OpsMesh lead',
    input.title,
    `Fit ${input.fitScore}/100 · ${input.sourceName}`,
    input.summary?.trim() ? input.summary.trim() : input.reasoningSummary,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildTelegramCallbackData(action: 'save' | 'reject' | 'draft' | 'more', opportunityId: string) {
  return `ops:${action}:${makeTelegramCallbackToken(opportunityId)}`;
}

export function parseTelegramCallbackData(input: string) {
  const match = /^ops:(save|reject|draft|more):([a-z0-9_\-]+)$/i.exec(input.trim());
  if (!match) return null;

  return {
    action: match[1].toLowerCase() as 'save' | 'reject' | 'draft' | 'more',
    callbackToken: match[2],
  };
}

export function buildDraftProposalTask(input: DraftProposalInput) {
  return `You are drafting a short client-facing proposal for a solo technical operator.
Return strict JSON only with keys: subjectLine, body, talkingPoints.
Hard rules:
- Write as a proposal to the client, not an internal recommendation.
- Do not mention fit score, recommendation labels, or whether the lead is worth pursuing.
- Do not explain whether the operator should apply.
- Keep the body concise, practical, and ready to send.
- Talking points must be proposal-supporting bullets, not internal evaluation notes.

Opportunity:
${JSON.stringify(input, null, 2)}`;
}

export function coerceAnalyzeOpportunityOutput(input: AnalyzeOpportunityInput): AnalyzeOpportunityOutput {
  const text = `${input.title} ${input.summary ?? ''} ${input.rawText}`.toLowerCase();
  const fit = text.includes('telegram') || text.includes('api') || text.includes('automation') ? 78 : 58;
  const recommendation: AnalyzeOpportunityOutput['recommendation'] = fit >= 75 ? 'strong_match' : fit >= 55 ? 'maybe' : 'weak';

  return {
    fitScore: fit,
    payScore: 62,
    qualityScore: 60,
    effortScore: 55,
    confidenceScore: 66,
    recommendation,
    reasoningSummary:
      recommendation === 'strong_match'
        ? 'Strong match because the opportunity appears technical, scoped, and aligned with API/automation work.'
        : 'Possible fit, but the opportunity still needs human review for scope and payout quality.',
    strengths: recommendation === 'strong_match' ? ['API/automation keyword match', 'likely short-scope task'] : ['some keyword overlap'],
    risks: ['Needs human review before any external action'],
  };
}

export function coerceDraftProposalOutput(input: DraftProposalInput): DraftProposalOutput {
  const intro = input.company ? `Hi ${input.company} team —` : 'Hi —';

  return {
    subjectLine: `Proposal: ${input.title}`,
    body: [
      intro,
      '',
      'I can take ownership of this work, move quickly, and keep communication clear from scope confirmation through delivery.',
      input.summary ? `From your brief: ${input.summary}` : null,
      'I work best in tight iterations with clear milestones, fast feedback, and practical execution.',
      'If useful, I can begin by confirming the deliverable, edge cases, and turnaround, then ship the first pass quickly.',
      '',
      'Best,',
      'Instructor',
    ]
      .filter(Boolean)
      .join('\n'),
    talkingPoints: [
      'Clear scope confirmation before implementation',
      'Fast iteration with practical communication',
      'Reliable execution and clean handoff',
    ],
  };
}
