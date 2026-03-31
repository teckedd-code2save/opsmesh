import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { AnalyzeOpportunityInput, AnalyzeOpportunityOutput, DraftProposalInput, DraftProposalOutput } from './index';
import {
  buildAnalyzeOpportunityTask,
  buildDraftProposalTask,
  coerceAnalyzeOpportunityOutput,
  coerceDraftProposalOutput,
} from './tasks';

type GatewayConfig = {
  gateway?: {
    port?: number;
    auth?: {
      token?: string;
    };
    http?: {
      endpoints?: {
        responses?: { enabled?: boolean };
        chatCompletions?: { enabled?: boolean };
      };
    };
  };
};

function readGatewayConfig(): GatewayConfig | null {
  try {
    const raw = readFileSync(path.resolve(process.env.HOME ?? '~', '.openclaw/openclaw.json'), 'utf8');
    return JSON.parse(raw) as GatewayConfig;
  } catch {
    return null;
  }
}

function getGatewaySettings() {
  const config = readGatewayConfig();
  const port = Number(process.env.OPENCLAW_GATEWAY_PORT ?? config?.gateway?.port ?? 18789);
  const token =
    process.env.OPENCLAW_GATEWAY_TOKEN ??
    process.env.OPENCLAW_AUTH_TOKEN ??
    config?.gateway?.auth?.token ??
    '';
  const baseUrl = process.env.OPENCLAW_GATEWAY_URL ?? `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    token,
    responsesEnabled: Boolean(config?.gateway?.http?.endpoints?.responses?.enabled),
    chatEnabled: Boolean(config?.gateway?.http?.endpoints?.chatCompletions?.enabled),
  };
}

async function callOpenClawHttp(prompt: string) {
  const { baseUrl, token, responsesEnabled, chatEnabled } = getGatewaySettings();
  if (!token) return null;

  if (responsesEnabled) {
    const res = await fetch(`${baseUrl}/v1/responses`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'x-openclaw-agent-id': 'main',
      },
      body: JSON.stringify({
        model: 'openclaw',
        input: prompt,
      }),
    });

    if (res.ok) {
      const payload = (await res.json()) as {
        output_text?: string;
        output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
      };

      if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
        return payload.output_text.trim();
      }

      const text = payload.output
        ?.flatMap((item) => item.content ?? [])
        .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
        .map((item) => item.text)
        .join('\n')
        .trim();

      if (text) return text;
    }
  }

  if (chatEnabled) {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'x-openclaw-agent-id': 'main',
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.ok) {
      const payload = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = payload.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    }
  }

  return null;
}

function parseJsonObject<T>(text: string | null): T | null {
  if (!text) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();

  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

export async function runOpenClawOpportunityAnalysis(
  input: AnalyzeOpportunityInput,
): Promise<AnalyzeOpportunityOutput> {
  const task = buildAnalyzeOpportunityTask(input);

  try {
    const raw = await callOpenClawHttp(task);
    const parsed = parseJsonObject<AnalyzeOpportunityOutput>(raw);
    if (parsed) return parsed;
  } catch {
    // fall through to deterministic local fallback
  }

  return coerceAnalyzeOpportunityOutput(input);
}

export async function runOpenClawProposalDraft(input: DraftProposalInput): Promise<DraftProposalOutput> {
  const task = buildDraftProposalTask(input);

  try {
    const raw = await callOpenClawHttp(task);
    const parsed = parseJsonObject<DraftProposalOutput>(raw);
    if (parsed) return parsed;
  } catch {
    // fall through to deterministic local fallback
  }

  return coerceDraftProposalOutput(input);
}
