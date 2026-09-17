import type {
  ZenodoDepositionMetadata,
  ZenodoArchivalRecord,
} from '../domain/types';
import { formatZenodoMetadataPayload } from '../domain/zenodoMetadataValidator';
import { calculateSha256 } from '../domain/hashBinding';

export interface ZenodoClientConfig {
  readonly environment: 'production' | 'sandbox';
  readonly apiToken?: string;
  readonly customBaseUrl?: string;
  readonly fetchFn?: typeof fetch;
}

export interface ZenodoDepositionResponse {
  readonly id: number;
  readonly conceptrecid: string;
  readonly conceptdoi?: string;
  readonly doi?: string;
  readonly links: {
    readonly bucket?: string;
    readonly publish?: string;
    readonly self?: string;
    readonly html?: string;
    readonly latest_html?: string;
  };
  readonly metadata: Record<string, unknown>;
  readonly state: string;
  readonly submitted: boolean;
}

export interface IZenodoClient {
  createDeposition(metadata: ZenodoDepositionMetadata): Promise<ZenodoDepositionResponse>;
  uploadFile(
    bucketUrl: string,
    filename: string,
    content: string | Uint8Array
  ): Promise<{ filename: string; filesize: number; checksum: string }>;
  publishDeposition(depositionId: number | string): Promise<ZenodoArchivalRecord>;
  getDeposition(depositionId: number | string): Promise<ZenodoDepositionResponse>;
}

export class ZenodoClient implements IZenodoClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly fetchImpl: typeof fetch;
  public readonly environment: 'production' | 'sandbox';

  constructor(config: ZenodoClientConfig) {
    this.environment = config.environment;
    this.baseUrl =
      config.customBaseUrl ??
      (config.environment === 'sandbox'
        ? 'https://sandbox.zenodo.org/api'
        : 'https://zenodo.org/api');

    this.apiToken =
      config.apiToken ??
      (typeof process !== 'undefined'
        ? (config.environment === 'sandbox'
            ? process.env.ZENODO_SANDBOX_TOKEN
            : process.env.ZENODO_API_TOKEN) ?? ''
        : '');

    this.fetchImpl = config.fetchFn ?? globalThis.fetch;
  }

  private getHeaders(contentType: string = 'application/json'): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return headers;
  }

  async createDeposition(metadata: ZenodoDepositionMetadata): Promise<ZenodoDepositionResponse> {
    if (!this.apiToken) {
      throw new Error('ZENODO_CREDENTIALS_MISSING: Zenodo API token is required for creating deposition.');
    }

    const payload = formatZenodoMetadataPayload(metadata);

    const res = await this.fetchImpl(`${this.baseUrl}/deposit/depositions`, {
      method: 'POST',
      headers: this.getHeaders('application/json'),
      body: JSON.stringify({ metadata: payload }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`ZENODO_CREATE_FAILED: HTTP ${res.status} - ${errorText}`);
    }

    return (await res.json()) as ZenodoDepositionResponse;
  }

  async uploadFile(
    targetUrlOrBucket: string,
    filename: string,
    content: string | Uint8Array
  ): Promise<{ filename: string; filesize: number; checksum: string }> {
    if (!this.apiToken) {
      throw new Error('ZENODO_CREDENTIALS_MISSING: Zenodo API token is required for upload.');
    }

    let uploadUrl: string;
    if (targetUrlOrBucket.startsWith('http://') || targetUrlOrBucket.startsWith('https://')) {
      uploadUrl = targetUrlOrBucket.endsWith('/')
        ? `${targetUrlOrBucket}${encodeURIComponent(filename)}`
        : `${targetUrlOrBucket}/${encodeURIComponent(filename)}`;
    } else {
      // If a depositionId is passed instead of bucket URL
      uploadUrl = `${this.baseUrl}/deposit/depositions/${targetUrlOrBucket}/files/${encodeURIComponent(filename)}`;
    }

    const uploadBody: BodyInit =
      typeof content === 'string'
        ? content
        : (content instanceof Uint8Array ? (content as unknown as BodyInit) : (content as any));

    const res = await this.fetchImpl(uploadUrl, {
      method: 'PUT',
      headers: this.getHeaders('application/octet-stream'),
      body: uploadBody,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`ZENODO_UPLOAD_FAILED: HTTP ${res.status} - ${errorText}`);
    }

    const payload = await res.json();
    return {
      filename,
      filesize: typeof content === 'string' ? Buffer.byteLength(content, 'utf8') : content.byteLength,
      checksum: payload.checksum || `md5:${payload.id || ''}`,
    };
  }

  async publishDeposition(depositionId: number | string): Promise<ZenodoArchivalRecord> {
    if (!this.apiToken) {
      throw new Error('ZENODO_CREDENTIALS_MISSING: Zenodo API token is required for publishing.');
    }

    const res = await this.fetchImpl(
      `${this.baseUrl}/deposit/depositions/${depositionId}/actions/publish`,
      {
        method: 'POST',
        headers: this.getHeaders('application/json'),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`ZENODO_PUBLISH_FAILED: HTTP ${res.status} - ${errorText}`);
    }

    const dep = (await res.json()) as ZenodoDepositionResponse;

    const conceptDoi = dep.conceptdoi ?? `10.5281/zenodo.${dep.conceptrecid || depositionId}`;
    const versionDoi = dep.doi ?? `10.5281/zenodo.${dep.id || depositionId}`;
    const recordUrl =
      dep.links.html ??
      (this.environment === 'sandbox'
        ? `https://sandbox.zenodo.org/record/${dep.id}`
        : `https://zenodo.org/record/${dep.id}`);

    return {
      environment: this.environment,
      depositionId: dep.id,
      conceptDoi,
      versionDoi,
      recordUrl,
      packageSha256: '', // Assigned by pipeline
      archivedAt: new Date().toISOString(),
    };
  }

  async getDeposition(depositionId: number | string): Promise<ZenodoDepositionResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/deposit/depositions/${depositionId}`, {
      method: 'GET',
      headers: this.getHeaders('application/json'),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`ZENODO_GET_FAILED: HTTP ${res.status} - ${errorText}`);
    }

    return (await res.json()) as ZenodoDepositionResponse;
  }
}
