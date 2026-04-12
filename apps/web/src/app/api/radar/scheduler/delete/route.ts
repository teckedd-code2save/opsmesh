import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const JOB_NAME = 'opsmesh_radar_poll';

async function getJobId() {
  const { stdout } = await execFileAsync('openclaw', ['cron', 'list', '--all', '--json']);
  const payload = JSON.parse(stdout || '{"jobs":[]}');
  return (payload.jobs ?? []).find((entry: any) => entry.name === JOB_NAME)?.id ?? null;
}

export async function POST() {
  try {
    const id = await getJobId();
    if (!id) return NextResponse.json({ ok: true, deleted: false, reason: 'job-not-found' });
    await execFileAsync('openclaw', ['cron', 'rm', id]);
    return NextResponse.json({ ok: true, deleted: true, jobId: id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not delete scheduler job' }, { status: 500 });
  }
}
