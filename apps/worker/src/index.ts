import { radarRepository } from '@opsmesh/radar-core';
import { runRadarCycle } from './run-radar-cycle';

async function main() {
  const owner = `worker-${process.pid}-${Date.now()}`;
  const lock = radarRepository.acquireWorkerLock(owner);

  if (!lock) {
    console.log(JSON.stringify({ ok: false, skipped: true, reason: 'worker_locked', runtime: radarRepository.getRadarRuntime() }, null, 2));
    return;
  }

  try {
    const result = await runRadarCycle();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    radarRepository.releaseWorkerLock(owner);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
