import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { OpportunityRecord, ProposalDraftRecord, RadarPreferenceRecord, RadarSourceRecord } from './types';

type RadarState = {
  opportunities: OpportunityRecord[];
  sources: RadarSourceRecord[];
  preferences: RadarPreferenceRecord;
  drafts: ProposalDraftRecord[];
};

const DATA_DIR = path.resolve(process.cwd(), '.opsmesh');
const DATA_FILE = path.join(DATA_DIR, 'radar-state.json');

function makeDefaultState(): RadarState {
  return {
    opportunities: [],
    sources: [
      {
        id: 'src_live_1',
        name: 'RemoteOK RSS',
        kind: 'rss',
        baseUrl: 'https://remoteok.com',
        feedUrl: 'https://remoteok.com/remote-dev-jobs.rss',
        parserKey: 'rss:remoteok',
        active: true,
        pollIntervalMin: 30,
      },
      {
        id: 'src_live_2',
        name: 'Hacker News Jobs RSS',
        kind: 'rss',
        baseUrl: 'https://hnrss.org',
        feedUrl: 'https://hnrss.org/jobs',
        parserKey: 'rss:hn-jobs',
        active: true,
        pollIntervalMin: 30,
      },
      {
        id: 'src_live_3',
        name: 'Hacker News Who Is Hiring RSS',
        kind: 'rss',
        baseUrl: 'https://hnrss.org',
        feedUrl: 'https://hnrss.org/whoishiring',
        parserKey: 'rss:hn-whoishiring',
        active: true,
        pollIntervalMin: 60,
      },
      {
        id: 'src_live_4',
        name: 'WeWorkRemotely RSS',
        kind: 'rss',
        baseUrl: 'https://weworkremotely.com',
        feedUrl: 'https://weworkremotely.com/remote-jobs.rss',
        parserKey: 'rss:wwr',
        active: true,
        pollIntervalMin: 45,
      },
    ],
    preferences: {
      userId: 'demo-user',
      displayName: 'Instructor',
      minHourlyRate: '15',
      minFixedBudget: '50',
      remoteOnly: true,
      preferredKeywords: ['api', 'automation', 'telegram', 'typescript', 'node', 'backend'],
      excludedKeywords: ['commission-only', 'cold calling'],
      allowedCategories: ['automation', 'api', 'bot', 'backend'],
      notes: 'Bias toward small, winnable technical tasks that can be shipped quickly.',
    },
    drafts: [],
  };
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function normalizeState(value: Partial<RadarState> | undefined): RadarState {
  const defaults = makeDefaultState();
  return {
    opportunities: value?.opportunities ?? defaults.opportunities,
    sources: value?.sources ?? defaults.sources,
    preferences: value?.preferences ?? defaults.preferences,
    drafts: value?.drafts ?? defaults.drafts,
  };
}

export function loadRadarState(): RadarState {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) {
    const initial = makeDefaultState();
    saveRadarState(initial);
    return initial;
  }

  try {
    const raw = readFileSync(DATA_FILE, 'utf8');
    return normalizeState(JSON.parse(raw) as Partial<RadarState>);
  } catch {
    const fallback = makeDefaultState();
    saveRadarState(fallback);
    return fallback;
  }
}

export function saveRadarState(state: RadarState) {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

export function updateRadarState(mutator: (state: RadarState) => RadarState | void) {
  const current = loadRadarState();
  const next = mutator(current) ?? current;
  saveRadarState(next);
  return next;
}

export function resetRadarState() {
  const next = makeDefaultState();
  saveRadarState(next);
  return next;
}
