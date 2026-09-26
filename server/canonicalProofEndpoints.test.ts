// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  proxyRicisCoreProofApi,
  type RicisCoreProofOperation,
} from './ricisCoreSupervisor';

vi.mock('./ricisCoreSupervisor', () => ({
  proxyRicisCoreProofApi: vi.fn(),
  getRicisCoreIntegrationInfo: vi.fn(() => ({
    url: 'http://127.0.0.1:5044',
    running: false,
    mode: 'bundled-dll',
  })),
  ensureRicisCoreApi: vi.fn(),
}));

describe('Canonical Proof Endpoints (/api/proofs/*)', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());

    const proofRunIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
    const proofFormats = new Set(['Academic', 'Json', 'Latex', 'Log', 'Lean']);
    const proofError = (code: string, messageResourceKey: string, retryable: boolean) => ({
      apiVersion: 'v1',
      code,
      messageResourceKey,
      retryable,
      safeParameters: {},
    });

    const forwardProof = async (res: express.Response, operation: RicisCoreProofOperation) => {
      try {
        const result = await proxyRicisCoreProofApi(operation);
        return res.status(result.status).json(result.body);
      } catch {
        return res.status(503).json(proofError('CORE_PROOF_UNAVAILABLE', 'proof.core.unavailable', true));
      }
    };

    app.post('/api/proofs/generate', async (req, res) => {
      return forwardProof(res, { kind: 'create', body: req.body });
    });

    app.post('/api/proofs/verify', async (req, res) => {
      const proofRunId = req.body?.proofRunId;
      if (typeof proofRunId === 'string' && proofRunIdPattern.test(proofRunId)) {
        return forwardProof(res, { kind: 'getRun', proofRunId });
      }
      return forwardProof(res, { kind: 'create', body: req.body });
    });

    app.post('/api/proofs/export', async (req, res) => {
      const { proofRunId, format = 'Json' } = req.body || {};
      const normalizedFormat = String(format).charAt(0).toUpperCase() + String(format).slice(1).toLowerCase();
      if (!proofRunId || !proofRunIdPattern.test(String(proofRunId)) || !proofFormats.has(normalizedFormat)) {
        return res.status(400).json(proofError('INVALID_EXPORT_REQUEST', 'proof.core.export.invalid', false));
      }
      return forwardProof(res, {
        kind: 'getDocument',
        proofRunId: String(proofRunId),
        format: normalizedFormat as 'Academic' | 'Json' | 'Latex' | 'Log' | 'Lean',
      });
    });

    app.get('/api/proofs/capabilities', async (_req, res) => {
      return forwardProof(res, { kind: 'capabilities' });
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('POST /api/proofs/generate forwards request payload and returns 200 when Core succeeds', async () => {
    vi.mocked(proxyRicisCoreProofApi).mockResolvedValueOnce({
      status: 200,
      body: {
        apiVersion: 'v1',
        proofRunId: 'a0b1c2d3-e4f5-4a6b-8c9d-0e1f2a3b4c5d',
        canonicalClaim: '0_F * inf_G = F * G',
        structuralVerification: 'StructurallyVerified',
        trustStatus: 'LeanVerified',
      },
    });

    const res = await fetch(`${baseUrl}/api/proofs/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression: '0_5 * inf_3', scenario: 'A6_Product' }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.proofRunId).toBe('a0b1c2d3-e4f5-4a6b-8c9d-0e1f2a3b4c5d');
    expect(proxyRicisCoreProofApi).toHaveBeenCalledWith({
      kind: 'create',
      body: { expression: '0_5 * inf_3', scenario: 'A6_Product' },
    });
  });

  it('POST /api/proofs/generate returns 503 CORE_PROOF_UNAVAILABLE when supervisor rejects', async () => {
    vi.mocked(proxyRicisCoreProofApi).mockRejectedValueOnce(new Error('Supervisor unavailable'));

    const res = await fetch(`${baseUrl}/api/proofs/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression: '0_F * inf_G' }),
    });

    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.code).toBe('CORE_PROOF_UNAVAILABLE');
    expect(body.retryable).toBe(true);
  });

  it('POST /api/proofs/export rejects malformed proofRunId with 400', async () => {
    const res = await fetch(`${baseUrl}/api/proofs/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proofRunId: 'not-a-uuid', format: 'Latex' }),
    });

    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.code).toBe('INVALID_EXPORT_REQUEST');
  });

  it('POST /api/proofs/export rejects unsupported format with 400', async () => {
    const res = await fetch(`${baseUrl}/api/proofs/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofRunId: 'a0b1c2d3-e4f5-4a6b-8c9d-0e1f2a3b4c5d',
        format: 'UnrealFormat',
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.code).toBe('INVALID_EXPORT_REQUEST');
  });

  it('POST /api/proofs/export forwards valid request to getDocument', async () => {
    vi.mocked(proxyRicisCoreProofApi).mockResolvedValueOnce({
      status: 200,
      body: {
        apiVersion: 'v1',
        proofRunId: 'a0b1c2d3-e4f5-4a6b-8c9d-0e1f2a3b4c5d',
        format: 'Latex',
        content: '\\begin{align} 0_F \\times \\infty_G = F \\cdot G \\end{align}',
      },
    });

    const res = await fetch(`${baseUrl}/api/proofs/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofRunId: 'a0b1c2d3-e4f5-4a6b-8c9d-0e1f2a3b4c5d',
        format: 'latex',
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.format).toBe('Latex');
    expect(proxyRicisCoreProofApi).toHaveBeenCalledWith({
      kind: 'getDocument',
      proofRunId: 'a0b1c2d3-e4f5-4a6b-8c9d-0e1f2a3b4c5d',
      format: 'Latex',
    });
  });

  it('GET /api/proofs/capabilities returns capabilities from Core', async () => {
    vi.mocked(proxyRicisCoreProofApi).mockResolvedValueOnce({
      status: 200,
      body: {
        apiVersion: 'v1',
        scenarios: ['A6_GeometricBridge', 'L1_Identity', 'Singularity_0_over_0'],
        formats: ['Academic', 'Json', 'Latex', 'Lean', 'Log'],
      },
    });

    const res = await fetch(`${baseUrl}/api/proofs/capabilities`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.scenarios).toContain('A6_GeometricBridge');
  });
});
