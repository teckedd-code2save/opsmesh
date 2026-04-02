export * from './types';
export * from './mock-data';
export * from './persistence';
export * from './repository';
export * from './store';

import { createHash } from 'node:crypto';

export function makeOpportunityDedupeHash(input: string) {
  return createHash('sha1').update(input.trim().toLowerCase()).digest('hex');
}

export function makeCompactOpportunityId(input: string) {
  return `opp_${makeOpportunityDedupeHash(input).slice(0, 16)}`;
}

export function makeTelegramCallbackToken(opportunityId: string) {
  return makeOpportunityDedupeHash(`tg:${opportunityId}`).slice(0, 12);
}
