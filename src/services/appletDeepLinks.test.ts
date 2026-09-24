import { describe, expect, it } from 'vitest';

import type { AppletId } from '../types/appletRegistry';
import {
  NEW_TAB_APPLETS,
  buildAppletDeepLink,
  opensInNewTab,
} from './appletDeepLinks';

const ALL_APPLETS: readonly AppletId[] = [
  'map',
  'kinematic',
  'seed',
  'comparison',
  'roadmap',
  'voynich',
  'qa-tests',
  'terminal',
  'settings',
];

describe('appletDeepLinks — workspace-preserving new-tab policy', () => {
  it('marks exactly the workspace-replacing, deep-linkable satellites as new-tab targets', () => {
    expect([...NEW_TAB_APPLETS].sort()).toEqual(
      ['comparison', 'kinematic', 'qa-tests', 'roadmap', 'seed', 'voynich'].sort(),
    );
  });

  it('keeps map, terminal and settings in-place (context-sensitive surfaces)', () => {
    const expected: Record<AppletId, boolean> = {
      map: false,
      kinematic: true,
      seed: true,
      comparison: true,
      roadmap: true,
      voynich: true,
      'qa-tests': true,
      'proof-logs': false,
      // terminal receives its expression via useTerminalStore, not the URL:
      terminal: false,
      // settings must mutate the live workspace, not an isolated tab:
      settings: false,
    };
    for (const applet of ALL_APPLETS) {
      expect(opensInNewTab(applet), applet).toBe(expected[applet]);
    }
  });

  it('builds an absolute canonical deep link with the applet parameter', () => {
    const href = buildAppletDeepLink('roadmap');
    const url = new URL(href);
    expect(url.searchParams.get('applet')).toBe('roadmap');
    expect(url.origin).toBe(window.location.origin);
  });

  it('mirrors node/root/mode context into the deep link', () => {
    const url = new URL(
      buildAppletDeepLink('roadmap', {
        nodeId: 'node-1',
        rootNodeId: 'node-1',
        mode: 'challenge',
      }),
    );
    expect(url.searchParams.get('applet')).toBe('roadmap');
    expect(url.searchParams.get('node')).toBe('node-1');
    expect(url.searchParams.get('root')).toBe('node-1');
    expect(url.searchParams.get('mode')).toBe('challenge');
  });

  it('omits absent context parameters instead of writing empty values', () => {
    const url = new URL(buildAppletDeepLink('kinematic'));
    expect(url.searchParams.get('node')).toBeNull();
    expect(url.searchParams.get('root')).toBeNull();
    expect(url.searchParams.get('mode')).toBeNull();
  });
});
