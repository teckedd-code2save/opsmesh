import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { radarRepository } from '@opsmesh/radar-core';

const execFileAsync = promisify(execFile);
const JOB_NAME = 'opsmesh_radar_poll';
const TARGET = '6266009472';
const CHANNEL = 'telegram';
const MESSAGE = 'Run: cd /Users/welcome/.openclaw/workspace/opsmesh && pnpm --filter @opsmesh/worker run-once. Treat this as the scheduled OpsMesh radar poll. Report only a compact summary: leads found, notifications sent, errors, and whether cron execution succeeded.';

function cronFromInterval(min: number) {
  if (min < 60) return `*/${min} * * * *`;
  const hours = Math.floor(min / 60);
  return `0 */${hours} * * *`;
}

async function listJobs() {
  const { stdout } = await execFileAsync('openclaw', ['cron', 'list', '--all', '--json']);
  return JSON.parse(stdout || '{"jobs":[]}');
}

export async function POST() {
  try {
    const prefs = radarRepository.getPreferences();
    const cronExpr = cronFromInterval(prefs.autoPollingIntervalMin ?? 30);
    const jobsPayload = await listJobs();
    const existing = (jobsPayload.jobs ?? []).find((job: any) => job.name === JOB_NAME);

    if (!prefs.autoPollingEnabled) {
      if (existing?.id) {
        await execFileAsync('openclaw', ['cron', 'disable', existing.id]);
      }
      const runtime = radarRepository.getRadarRuntime() ?? {};
      radarRepository.recordWorkerRun(runtime.lastWorkerResult ?? { sourceCount: 0, resultCount: 0, notifiedCount: 0, errorCount: 0, trigger: 'manual' });
      return NextResponse.json({ ok: true, enabled: false, cronExpr, jobId: existing?.id ?? null });
    }

    if (!existing?.id) {
      await execFileAsync('openclaw', [
        'cron', 'add', '--json', '--name', JOB_NAME, '--cron', cronExpr,
        '--session', 'isolated', '--wake', 'now', '--announce', '--channel', CHANNEL, '--to', TARGET,
        '--message', MESSAGE,
      ]);
    } else {
      await execFileAsync('openclaw', ['cron', 'edit', existing.id, '--enable', '--cron', cronExpr]);
    }

    const refreshed = await listJobs();
    const job = (refreshed.jobs ?? []).find((entry: any) => entry.name === JOB_NAME);
    const state = radarRepository.getRadarRuntime() ?? {};
    state.scheduler = {
      installed: Boolean(job?.id),
      mode: 'openclaw-cron',
      command: MESSAGE,
      checkedAt: new Date().toISOString(),
      status: job?.enabled ? 'configured' : 'unknown',
      jobId: job?.id,
      jobName: job?.name,
      cronExpr: job?.schedule?.expr,
      nextRunAtMs: job?.state?.nextRunAtMs,
      lastRunAtMs: job?.state?.lastRunAtMs,
      lastRunStatus: job?.state?.lastRunStatus,
      lastDeliveryStatus: job?.state?.lastDeliveryStatus,
      consecutiveErrors: job?.state?.consecutiveErrors ?? 0,
    };

    return NextResponse.json({ ok: true, enabled: true, scheduler: state.scheduler });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not sync OpenClaw cron job' }, { status: 500 });
  }
}
