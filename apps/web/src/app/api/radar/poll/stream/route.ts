import { radarRepository } from '@opsmesh/radar-core';

export const dynamic = 'force-dynamic';

function formatSse(data: unknown, event?: string) {
  const lines: string[] = [];
  if (event) lines.push(`event: ${event}`);
  lines.push(`data: ${JSON.stringify(data)}`);
  lines.push('');
  return lines.join('\n');
}

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let interval: ReturnType<typeof setInterval> | undefined;
      let heartbeat: ReturnType<typeof setInterval> | undefined;
      let timeout: ReturnType<typeof setTimeout> | undefined;

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (interval) clearInterval(interval);
        if (heartbeat) clearInterval(heartbeat);
        if (timeout) clearTimeout(timeout);
        interval = undefined;
        heartbeat = undefined;
        timeout = undefined;
      };

      const safeEnqueue = (text: string) => {
        if (closed) return false;
        try {
          controller.enqueue(encoder.encode(text));
          return true;
        } catch {
          cleanup();
          return false;
        }
      };

      const push = () => {
        if (closed) return;
        const sources = radarRepository.listSources().filter((s) => s.active && s.feedUrl);
        safeEnqueue(formatSse({ sources, ts: new Date().toISOString() }, 'sources'));
      };

      const abortHandler = () => {
        cleanup();
        try {
          controller.close();
        } catch {}
      };

      req.signal.addEventListener('abort', abortHandler, { once: true });

      push();
      interval = setInterval(push, 800);
      heartbeat = setInterval(() => {
        safeEnqueue(': keep-alive\n\n');
      }, 15000);

      timeout = setTimeout(() => {
        cleanup();
        try {
          controller.close();
        } catch {}
      }, 120000);
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
