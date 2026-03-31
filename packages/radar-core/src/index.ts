export * from './types';
export * from './mock-data';
export * from './persistence';
export * from './repository';
export * from './store';

export function makeOpportunityDedupeHash(input: string) {
  return input.trim().toLowerCase();
}
