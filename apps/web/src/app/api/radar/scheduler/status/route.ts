import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const JOB_NAME = 'opsmesh_radar_poll';

export async function GET() {
  try {
    const { stdout } = await execFileAsync('openclaw', ['cron', 'list', '--all', '--json']);
    const payload = JSON.parse(stdout || '{"jobs":[]}');
    const job = (payload.jobs ?? []).find((entry: any) => entry.name === JOB_NAME) ?? null;
    return NextResponse.json({
      installed: Boolean(job?.id),
      job,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load scheduler status' }, { status: 500 });
  }
}
