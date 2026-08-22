import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const mapSource = readFileSync(resolve(process.cwd(), 'src/ui/Map3D.tsx'), 'utf8');

describe('Map3D CommunityRewards status-line contract', () => {
  it('renders the Invite · Tokens action in the desktop status strip with an accessible test hook', () => {
    const stripStart = mapSource.indexOf('data-testid="desktop-status-strip"');
    const buttonIndex = mapSource.indexOf('data-testid="community-rewards-status-button"');

    expect(stripStart).toBeGreaterThanOrEqual(0);
    expect(buttonIndex).toBeGreaterThan(stripStart);
    expect(mapSource).toContain('Пригласить · Tokens');
    expect(mapSource).toContain('<Gift size={11}');
    expect(mapSource).toContain('role="status"');
  });

  it('uses only the typed server availability client and ordinary share URL; it does not create a local balance or reward', () => {
    expect(mapSource).toContain('getCommunityRewardsClientStatus()');
    expect(mapSource).toContain('UrlShareService.copyShareUrlToClipboard({})');
    expect(mapSource).toContain('Referral Tokens появятся после подключения защищённого identity и server ledger.');
    expect(mapSource).not.toContain("localStorage.setItem('ricis_token_balance'");
    expect(mapSource).not.toContain('offlineBalance');
    expect(mapSource).not.toContain('awardReferralTokens');
  });
});
