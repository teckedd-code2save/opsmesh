import { buildHighSignalAlertText } from './tasks';

export type HighSignalAlert = {
  title: string;
  sourceName: string;
  canonicalUrl: string;
  payLabel?: string;
  recommendation: string;
  fitScore: number;
  reasoningSummary: string;
};

export async function notifyHighSignalOpportunity(input: HighSignalAlert) {
  return {
    channel: 'telegram',
    delivered: false,
    mode: 'openclaw-ready-stub',
    preview: buildHighSignalAlertText(input),
  };
}
