import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const mapSource = readFileSync(resolve(process.cwd(), 'src/ui/Map3D.tsx'), 'utf8');

function handlerSource(name: string, nextName: string): string {
  const start = mapSource.indexOf(`const ${name}`);
  const end = mapSource.indexOf(`const ${nextName}`, start);
  return mapSource.slice(start, end === -1 ? undefined : end);
}

const openHandler = () => handlerSource('handleOpenCommunityReadiness', 'handleCopyCommunityInvitation');
const copyHandler = () => handlerSource('handleCopyCommunityInvitation', 'handleCloseCommunityReadiness');
const closeHandler = () => handlerSource('handleCloseCommunityReadiness', 'communityReadinessProjection');

describe('COMMUNITY-READINESS-01 G3 — Map3D Route A composition', () => {
  it('CR01-QA-34: readiness control открывает local notice через existing community seam', () => {
    expect(mapSource).toContain('data-testid="community-rewards-status-button"');
    expect(mapSource).toContain('handleOpenCommunityReadiness');
    expect(mapSource).toContain('<CommunityReadinessNotice');
  });

  it('CR01-QA-35: open intent использует только getCommunityRewardsClientStatus', () => {
    expect(openHandler()).toContain('getCommunityRewardsClientStatus()');
    expect(openHandler()).not.toContain('UrlShareService.copyShareUrlToClipboard');
  });

  it('CR01-QA-36: raw availability payload сначала проходит pure projector', () => {
    expect(mapSource).toContain("import { projectCommunityReadiness } from '../communityReadiness/communityReadiness.domain';");
    expect(mapSource).toContain('projectCommunityReadiness(communityReadinessStatus)');
    expect(mapSource).toContain('communityReadinessProjection');
  });

  it('CR01-QA-37: copy выполняется отдельным явным пользовательским действием', () => {
    expect(copyHandler()).toContain('const handleCopyCommunityInvitation');
    expect(mapSource).toContain('onCopyInvitation={() => { void handleCopyCommunityInvitation(); }}');
  });

  it('CR01-QA-38: copy intent использует только existing UrlShareService action', () => {
    expect(copyHandler()).toContain('UrlShareService.copyShareUrlToClipboard({})');
    expect(copyHandler()).not.toContain('getCommunityRewardsClientStatus');
  });

  it('CR01-QA-39: copy result ограничен copied или failed local state', () => {
    expect(copyHandler()).toContain("setCommunityInvitationCopyResult(copied ? 'copied' : 'failed')");
    expect(mapSource).toContain("useState<CommunityInvitationCopyResult>('idle')");
  });

  it('CR01-QA-40: close не изменяет map node calculator или Telegram state', () => {
    expect(closeHandler()).not.toMatch(/setSelectedNodeId|setIsCalculatorExplorerOpen|setIsMonolithGuidedCaseTrailOpen|setShowTelegramBot/);
  });

  it('CR01-QA-41: close сбрасывает только временный readiness UI state', () => {
    expect(closeHandler()).toContain('setIsCommunityReadinessOpen(false)');
    expect(closeHandler()).toContain("setCommunityInvitationCopyResult('idle')");
  });

  it('CR01-QA-42: composition не создаёт community rewards command endpoint', () => {
    expect(mapSource).not.toMatch(/\/api\/community-rewards|fetch\(/);
    expect(mapSource).not.toMatch(/createReferralLink|captureReferral|postReferralRewards/);
  });

  it('CR01-QA-43: composition не получает reward Telegram server Core Lean or graph dependency', () => {
    expect(mapSource).not.toContain('communityRewardsApplication');
    expect(mapSource).not.toMatch(/from ['"]\.\.\/\.\.\/server/);
    expect(mapSource).not.toMatch(/AuthoritativeProofStatePolicy|leanEvidenceConsent/);
  });

  it('CR01-QA-44: composition не создаёт analytics identity ledger external navigation or authority change', () => {
    const routeAHandlers = `${openHandler()}${copyHandler()}${closeHandler()}`;
    expect(routeAHandlers).not.toMatch(/localStorage|window\.open|analytics|ledger|identityAccess|rewardReceipt/);
    expect(routeAHandlers).not.toMatch(/setNodeState|setProof|setSelectedNodeId/);
    expect(mapSource).not.toContain('communityRewardsApplication');
  });
});
