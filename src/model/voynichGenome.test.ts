import { describe, expect, it } from 'vitest';
import { VOYNICH_DECRYPTION_SPEC } from './voynichGenome';
import { initialMap } from './initialMap';

describe('Voynich Monolith (EVA Genome) Decryption v1.0.0_RICIS_v7.8 Test Suite', () => {
  it('verifies metadata, author DOI, version, and economic profile', () => {
    expect(VOYNICH_DECRYPTION_SPEC.project).toBe('Voynich_Monolith_Decryption');
    expect(VOYNICH_DECRYPTION_SPEC.version).toBe('1.0.0_RICIS_v7.8');
    expect(VOYNICH_DECRYPTION_SPEC.author).toBe('Dmitry V. Aleinikov');
    expect(VOYNICH_DECRYPTION_SPEC.doi).toBe('10.5281/zenodo.18001299');
    expect(VOYNICH_DECRYPTION_SPEC.methodology).toBe('RICIS-III Multi-Channel Mechanical Forth Core');

    // Economic Profile Verification ($50 Trillion Market)
    const econ = VOYNICH_DECRYPTION_SPEC.economicProfile;
    expect(econ.costUnresolved).toBe(1_000_000_000_000); // $1T
    expect(econ.costToSolve).toBe(5_000_000);           // $5M
    expect(econ.marketGain).toBe(50_000_000_000_000);   // $50T
    expect(econ.riskLoss).toBe(10_000_000_000_000);      // $10T
  });

  it('validates 8 Forth stack routing prefixes and unary charge rules', () => {
    const prefixes = VOYNICH_DECRYPTION_SPEC.decryptionRules.stackRoutingPrefixes;
    expect(prefixes['da'].stack).toBe('PRIMARY_STACK');
    expect(prefixes['ai_oai'].stack).toBe('ALTERNATIVE_STACK');
    expect(prefixes['chai_shai'].stack).toBe('STABILIZE_STACK');
    expect(prefixes['tai_pai_kai'].stack).toBe('PORT_STACK');
    expect(prefixes['qai'].stack).toBe('IMPULSE_STACK');
    expect(prefixes['l_suffix'].stack).toBe('LEAK_STACK');
    expect(prefixes['r_l_m_suffix'].stack).toBe('ROT_STACK');
    expect(prefixes['dy_suffix'].stack).toBe('EMIT_DIRECT');

    // Unary Charge Rules
    const charges = VOYNICH_DECRYPTION_SPEC.decryptionRules.unaryChargeAccumulation.examples;
    expect(charges['dain']).toBe('+1 charge');
    expect(charges['daiin']).toBe('+2 charge');
    expect(charges['daiiin']).toBe('+3 charge');
    expect(charges['daiiiin']).toBe('+4 charge');
  });

  it('verifies all 5 Forth core macros (M1 - M5) and invariants', () => {
    const macros = VOYNICH_DECRYPTION_SPEC.macroLibrary;
    expect(Object.keys(macros)).toHaveLength(5);
    expect(macros['M1_INJECT_PULSE_RESONANCE'].pattern).toBe('cthan shey qokedy dal chor tchedy');
    expect(macros['M2_VORTEX_TORUS_LOCK'].invariant).toBe('Omega_vortex * r_phase');
    expect(macros['M3_PWM_WALL_DISSIPATION'].physics).toContain('Wall friction');
    expect(macros['M4_LEAK_DRAIN_SAFETY'].pattern).toBe('ychey cthy shol qokaiin dshey');
    expect(macros['M5_INTERSTAGE_COLLECTOR'].invariant).toBe('Handoff_Trigger');
  });

  it('verifies all 33 decoded folios (f1r - f27v) and critical LENR cell f5r', () => {
    const folios = VOYNICH_DECRYPTION_SPEC.decodedFolios;
    expect(folios).toHaveLength(33);

    const lenrCell = folios.find(f => f.folio === 'f5r');
    expect(lenrCell).toBeDefined();
    expect(lenrCell?.subsystem).toBe('R1 Core');
    expect(lenrCell?.function).toBe('Sonoluminescence LENR Cavitation Cell');
    expect(lenrCell?.visual_checksum).toBe('Chladni nodes, +4 charge (daiiiin)');
    expect(lenrCell?.ricis_invariant).toContain('4 * P_implosion');
  });

  it('verifies zone "energy_lenr" topology and 33 foliant node registration in initialMap', () => {
    const lenrZone = initialMap.zones.find(z => z.id === 'energy_lenr');
    expect(lenrZone).toBeDefined();
    expect(lenrZone?.name).toContain('LENR');

    // Check node presence in initialMap
    const voynichNodes = initialMap.nodes.filter(n => n.id.startsWith('voynich-f'));
    expect(voynichNodes.length).toEqual(33);

    // Check f5r node binding
    const f5rNode = initialMap.nodes.find(n => n.id === 'voynich-f5r');
    expect(f5rNode).toBeDefined();
    expect(f5rNode?.zoneIds).toContain('energy_lenr');
    expect(f5rNode?.title).toContain('f5r');
  });
});
