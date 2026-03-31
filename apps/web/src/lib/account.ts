export type AccountProfile = {
  id: string;
  displayName: string;
  telegramConnected: boolean;
  openclawWorkspaceMode: 'direct-integration';
};

export const mockAccountProfile: AccountProfile = {
  id: 'acct_demo',
  displayName: 'Instructor',
  telegramConnected: true,
  openclawWorkspaceMode: 'direct-integration',
};
