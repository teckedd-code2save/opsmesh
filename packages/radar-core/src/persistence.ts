import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { OpportunityRecord, ProposalDraftRecord, RadarPreferenceRecord, RadarSourceRecord } from './types';

type RadarState = {
  opportunities: OpportunityRecord[];
  sources: RadarSourceRecord[];
  preferences: RadarPreferenceRecord;
  drafts: ProposalDraftRecord[];
  runtime?: {
    lastWorkerRunAt?: string;
    lastWorkerResult?: {
      sourceCount: number;
      resultCount: number;
      notifiedCount: number;
      errorCount: number;
      trigger?: 'manual' | 'scheduled';
    };
    recentRuns?: Array<{
      ranAt: string;
      sourceCount: number;
      resultCount: number;
      notifiedCount: number;
      errorCount: number;
      trigger: 'manual' | 'scheduled';
    }>;
    workerLock?: {
      lockedAt: string;
      owner: string;
    } | null;
  };
};

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../../');
const LEGACY_DATA_DIR = path.join(process.cwd(), '.opsmesh');
const DATA_DIR = process.env.OPSMESH_DATA_DIR
  ? path.resolve(process.env.OPSMESH_DATA_DIR)
  : path.join(REPO_ROOT, '.opsmesh');
const DATA_FILE = path.join(DATA_DIR, 'radar-state.json');
const LEGACY_DATA_FILE = path.join(LEGACY_DATA_DIR, 'radar-state.json');

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
      {
        id: 'src_live_5',
        name: 'Remotive RSS',
        kind: 'rss',
        baseUrl: 'https://remotive.com',
        feedUrl: 'https://remotive.com/remote-jobs/feed',
        parserKey: 'rss:remotive',
        active: true,
        pollIntervalMin: 30,
      },
      {
        id: 'src_live_6',
        name: 'JustRemote RSS',
        kind: 'rss',
        baseUrl: 'https://justremote.co',
        feedUrl: 'https://justremote.co/remote-jobs.rss',
        parserKey: 'rss:justremote',
        active: true,
        pollIntervalMin: 45,
      },
      {
        id: 'src_live_7',
        name: 'Remote.co RSS',
        kind: 'rss',
        baseUrl: 'https://remote.co',
        feedUrl: 'https://remote.co/remote-jobs/developer/feed/',
        parserKey: 'rss:remoteco',
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
    runtime: {
      lastWorkerRunAt: undefined,
      lastWorkerResult: undefined,
      recentRuns: [],
      workerLock: null,
    },
  };
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function ensureCanonicalDataFile() {
  ensureDataDir();

  if (!existsSync(DATA_FILE) && existsSync(LEGACY_DATA_FILE)) {
    copyFileSync(LEGACY_DATA_FILE, DATA_FILE);
  }
}

function normalizeState(value: Partial<RadarState> | undefined): RadarState {
  const defaults = makeDefaultState();
  const existingSources = value?.sources ?? [];
  const sourceIds = new Set(existingSources.map((source) => source.id));
  const mergedSources = [...existingSources, ...defaults.sources.filter((source) => !sourceIds.has(source.id))];

  return {
    opportunities: value?.opportunities ?? defaults.opportunities,
    sources: mergedSources,
    preferences: value?.preferences ?? defaults.preferences,
    drafts: value?.drafts ?? defaults.drafts,
    runtime: {
      lastWorkerRunAt: value?.runtime?.lastWorkerRunAt ?? defaults.runtime?.lastWorkerRunAt,
      lastWorkerResult: value?.runtime?.lastWorkerResult ?? defaults.runtime?.lastWorkerResult,
      recentRuns: value?.runtime?.recentRuns ?? defaults.runtime?.recentRuns ?? [],
      workerLock: value?.runtime?.workerLock ?? defaults.runtime?.workerLock ?? null,
    },
  };
}

export function loadRadarState(): RadarState {
  ensureCanonicalDataFile();
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
  ensureCanonicalDataFile();
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
