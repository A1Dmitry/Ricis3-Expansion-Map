import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const mapSource = readFileSync(resolve(process.cwd(), 'src/ui/Map3D.tsx'), 'utf8');

function handlerSource(name: string, nextName: string): string {
  const start = mapSource.indexOf(`const ${name}`);
  const end = mapSource.indexOf(`const ${nextName}`, start);
  return mapSource.slice(start, end === -1 ? undefined : end);
}

describe('Map3D CommunityReadiness status-line contract', () => {
  it('renders the honest community-status action in the desktop strip with an accessible test hook', () => {
    const stripStart = mapSource.indexOf('data-testid="desktop-status-strip"');
    const buttonIndex = mapSource.indexOf('data-testid="community-rewards-status-button"');

    expect(stripStart).toBeGreaterThanOrEqual(0);
    expect(buttonIndex).toBeGreaterThan(stripStart);
    expect(mapSource).toContain('Сообщество · статус');
    expect(mapSource).toContain('<Gift size={11}');
    expect(mapSource).toContain('Открыть честный статус готовности сообщества');
  });

  it('separates typed status opening from an explicit ordinary share-url copy action and creates no local reward state', () => {
    const openHandler = handlerSource('handleOpenCommunityReadiness', 'handleCopyCommunityInvitation');
    const copyHandler = handlerSource('handleCopyCommunityInvitation', 'handleCloseCommunityReadiness');

    expect(openHandler).toContain('getCommunityRewardsClientStatus()');
    expect(openHandler).not.toContain('UrlShareService.copyShareUrlToClipboard');
    expect(copyHandler).toContain('UrlShareService.copyShareUrlToClipboard({})');
    expect(copyHandler).not.toContain('getCommunityRewardsClientStatus');
    expect(mapSource).toContain('<CommunityReadinessNotice');
    expect(mapSource).not.toContain("localStorage.setItem('ricis_token_balance'");
    expect(mapSource).not.toContain('offlineBalance');
    expect(mapSource).not.toContain('awardReferralTokens');
  });
});
