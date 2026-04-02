import { buildHighSignalAlertText, buildTelegramCallbackData } from './tasks';

type GatewayConfig = {
  gateway?: {
    port?: number;
    auth?: {
      token?: string;
    };
  };
};

export type HighSignalAlert = {
  opportunityId: string;
  title: string;
  sourceName: string;
  canonicalUrl: string;
  summary?: string;
  payLabel?: string;
  recommendation: string;
  fitScore: number;
  reasoningSummary: string;
};

function normalizeBase(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function readGatewayConfig(): Promise<GatewayConfig | null> {
  try {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const raw = await readFile(path.resolve(process.env.HOME ?? '~', '.openclaw/openclaw.json'), 'utf8');
    return JSON.parse(raw) as GatewayConfig;
  } catch {
    return null;
  }
}

async function getGatewaySettings() {
  const config = await readGatewayConfig();
  const port = Number(process.env.OPENCLAW_GATEWAY_PORT ?? config?.gateway?.port ?? 18789);
  const token =
    process.env.OPENCLAW_GATEWAY_TOKEN ??
    process.env.OPENCLAW_AUTH_TOKEN ??
    config?.gateway?.auth?.token ??
    '';
  const baseUrl = normalizeBase(process.env.OPENCLAW_GATEWAY_URL ?? `http://127.0.0.1:${port}`);
  const target = process.env.OPSMESH_TELEGRAM_CHAT_ID ?? 'telegram:6266009472';

  return { baseUrl, token, target };
}

export async function deliverTelegramMessage(
  message: string,
  options?: {
    buttons?: { text: string; callback_data: string; style?: 'danger' | 'success' | 'primary' }[][];
  },
) {
  const { baseUrl, token, target } = await getGatewaySettings();

  if (!token) {
    return {
      channel: 'telegram',
      delivered: false,
      mode: 'missing-token',
      target,
      preview: message,
    };
  }

  const res = await fetch(`${baseUrl}/tools/invoke`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tool: 'message',
      args: {
        action: 'send',
        channel: 'telegram',
        target,
        message,
        buttons: options?.buttons,
      },
    }),
  });

  const rawText = await res.text();
  let payload: any = null;

  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  const toolError = payload?.error ?? payload?.result?.error ?? payload?.data?.error;
  const ok = res.ok && !toolError && payload?.ok !== false && payload?.result?.ok !== false && payload?.success !== false;
  const derivedError =
    toolError?.message ??
    toolError ??
    payload?.result?.message ??
    payload?.data?.message ??
    payload?.message ??
    rawText ??
    `HTTP ${res.status}`;

  return {
    channel: 'telegram',
    delivered: ok,
    mode: ok ? 'openclaw-message-tool' : 'openclaw-message-tool-error',
    target,
    preview: message,
    error: ok ? undefined : `Telegram send failed: ${derivedError}`,
    payload,
  };
}

export async function notifyHighSignalOpportunity(input: HighSignalAlert) {
  const message = buildHighSignalAlertText(input);
  return deliverTelegramMessage(message, {
    buttons: [
      [
        { text: 'More', callback_data: buildTelegramCallbackData('more', input.opportunityId), style: 'primary' },
        { text: 'Save', callback_data: buildTelegramCallbackData('save', input.opportunityId) },
      ],
      [
        { text: 'Reject', callback_data: buildTelegramCallbackData('reject', input.opportunityId), style: 'danger' },
        { text: 'Draft', callback_data: buildTelegramCallbackData('draft', input.opportunityId), style: 'primary' },
      ],
    ],
  });
}
