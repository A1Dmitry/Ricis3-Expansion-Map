import type {
  ZenodoDepositionMetadata,
  ZenodoUploadType,
  ZenodoPublicationType,
  ZenodoAccessRight,
} from './types';

export interface ZenodoValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly sanitizedMetadata?: ZenodoDepositionMetadata;
}

const VALID_UPLOAD_TYPES: readonly ZenodoUploadType[] = [
  'publication',
  'poster',
  'presentation',
  'dataset',
  'image',
  'video',
  'software',
  'lesson',
  'other',
];

const VALID_PUBLICATION_TYPES: readonly ZenodoPublicationType[] = [
  'book',
  'section',
  'conferencepaper',
  'article',
  'patent',
  'preprint',
  'report',
  'softwaredocumentation',
  'thesis',
  'technicalnote',
  'workingpaper',
  'other',
];

const VALID_ACCESS_RIGHTS: readonly ZenodoAccessRight[] = [
  'open',
  'embargoed',
  'restricted',
  'closed',
];

const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates metadata object against official Zenodo InvenioRDM deposit API specifications.
 */
export function validateZenodoMetadata(input: unknown): ZenodoValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      errors: ['Zenodo metadata must be a non-null object.'],
    };
  }

  const meta = input as Partial<ZenodoDepositionMetadata>;

  // 1. Title
  if (!meta.title || typeof meta.title !== 'string' || meta.title.trim().length === 0) {
    errors.push('ZENODO_SCHEMA_ERROR: "title" is required and cannot be empty.');
  }

  // 2. Upload Type
  if (!meta.upload_type || !VALID_UPLOAD_TYPES.includes(meta.upload_type)) {
    errors.push(
      `ZENODO_SCHEMA_ERROR: "upload_type" is required and must be one of: ${VALID_UPLOAD_TYPES.join(', ')}.`
    );
  }

  // 3. Publication Type (Conditional requirement)
  if (meta.upload_type === 'publication') {
    if (!meta.publication_type || !VALID_PUBLICATION_TYPES.includes(meta.publication_type)) {
      errors.push(
        `ZENODO_SCHEMA_ERROR: "publication_type" is required when upload_type is "publication" and must be one of: ${VALID_PUBLICATION_TYPES.join(
          ', '
        )}.`
      );
    }
  }

  // 4. Description
  if (
    !meta.description ||
    typeof meta.description !== 'string' ||
    meta.description.trim().length < 3
  ) {
    errors.push(
      'ZENODO_SCHEMA_ERROR: "description" is required and must be at least 3 characters long.'
    );
  }

  // 5. Creators
  if (!meta.creators || !Array.isArray(meta.creators) || meta.creators.length === 0) {
    errors.push(
      'ZENODO_SCHEMA_ERROR: "creators" is required and must contain at least one creator object.'
    );
  } else {
    meta.creators.forEach((creator, idx) => {
      if (!creator || typeof creator !== 'object') {
        errors.push(`ZENODO_SCHEMA_ERROR: creators[${idx}] must be a non-null object.`);
        return;
      }
      if (!creator.name || typeof creator.name !== 'string' || creator.name.trim().length === 0) {
        errors.push(
          `ZENODO_SCHEMA_ERROR: creators[${idx}].name is required (format: "Family name, Given names").`
        );
      }
      if (creator.orcid) {
        if (typeof creator.orcid !== 'string' || !ORCID_REGEX.test(creator.orcid.trim())) {
          errors.push(
            `ZENODO_SCHEMA_ERROR: creators[${idx}].orcid "${creator.orcid}" must match standard ORCID format (e.g. "0009-0004-3226-7700").`
          );
        }
      }
    });
  }

  // 6. Access Right (Optional, validate if provided)
  if (meta.access_right && !VALID_ACCESS_RIGHTS.includes(meta.access_right)) {
    errors.push(
      `ZENODO_SCHEMA_ERROR: "access_right" if provided must be one of: ${VALID_ACCESS_RIGHTS.join(', ')}.`
    );
  }

  // 7. Publication Date (Optional, format YYYY-MM-DD)
  if (meta.publication_date) {
    if (typeof meta.publication_date !== 'string' || !DATE_REGEX.test(meta.publication_date)) {
      errors.push(
        `ZENODO_SCHEMA_ERROR: "publication_date" "${meta.publication_date}" must follow ISO YYYY-MM-DD format.`
      );
    }
  }

  // 8. Related Identifiers (Optional)
  if (meta.related_identifiers) {
    if (!Array.isArray(meta.related_identifiers)) {
      errors.push('ZENODO_SCHEMA_ERROR: "related_identifiers" must be an array.');
    } else {
      meta.related_identifiers.forEach((rel, idx) => {
        if (!rel.identifier || typeof rel.identifier !== 'string') {
          errors.push(`ZENODO_SCHEMA_ERROR: related_identifiers[${idx}].identifier is required.`);
        }
        if (!rel.relation || typeof rel.relation !== 'string') {
          errors.push(`ZENODO_SCHEMA_ERROR: related_identifiers[${idx}].relation is required.`);
        }
        if (!rel.scheme || typeof rel.scheme !== 'string') {
          errors.push(`ZENODO_SCHEMA_ERROR: related_identifiers[${idx}].scheme is required.`);
        }
      });
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  // Sanitize and prepare default values
  const todayIso = new Date().toISOString().split('T')[0] ?? '2026-09-17';
  const sanitized: ZenodoDepositionMetadata = {
    title: meta.title!.trim(),
    description: meta.description!.trim(),
    upload_type: meta.upload_type!,
    publication_type: meta.publication_type,
    image_type: meta.image_type,
    creators: meta.creators!.map(c => ({
      name: c.name.trim(),
      affiliation: c.affiliation?.trim() || undefined,
      orcid: c.orcid?.trim() || undefined,
    })),
    access_right: meta.access_right || 'open',
    license: meta.license?.trim() || (meta.upload_type === 'software' ? 'Apache-2.0' : 'cc-by-4.0'),
    publication_date: meta.publication_date || todayIso,
    keywords: meta.keywords ? meta.keywords.map(k => k.trim()).filter(Boolean) : undefined,
    version: meta.version?.trim() || undefined,
    language: meta.language?.trim() || 'eng',
    related_identifiers: meta.related_identifiers,
    contributors: meta.contributors,
    references: meta.references,
    notes: meta.notes?.trim() || undefined,
  };

  return {
    isValid: true,
    errors: [],
    sanitizedMetadata: sanitized,
  };
}

/**
 * Transforms metadata into the exact JSON payload expected by Zenodo REST API.
 */
export function formatZenodoMetadataPayload(metadata: ZenodoDepositionMetadata): Record<string, unknown> {
  const validation = validateZenodoMetadata(metadata);
  if (!validation.isValid || !validation.sanitizedMetadata) {
    throw new Error(
      `ZENODO_METADATA_INVALID: Metadata failed validation:\n${validation.errors.join('\n')}`
    );
  }

  const m = validation.sanitizedMetadata;
  const payload: Record<string, unknown> = {
    title: m.title,
    upload_type: m.upload_type,
    description: m.description,
    creators: m.creators.map(c => {
      const creatorObj: Record<string, unknown> = { name: c.name };
      if (c.affiliation) creatorObj.affiliation = c.affiliation;
      if (c.orcid) creatorObj.orcid = c.orcid;
      return creatorObj;
    }),
    access_right: m.access_right ?? 'open',
    license: m.license ?? 'cc-by-4.0',
    publication_date: m.publication_date,
  };

  if (m.publication_type) {
    payload.publication_type = m.publication_type;
  }
  if (m.image_type) {
    payload.image_type = m.image_type;
  }
  if (m.keywords && m.keywords.length > 0) {
    payload.keywords = [...m.keywords];
  }
  if (m.version) {
    payload.version = m.version;
  }
  if (m.language) {
    payload.language = m.language;
  }
  if (m.notes) {
    payload.notes = m.notes;
  }
  if (m.related_identifiers && m.related_identifiers.length > 0) {
    payload.related_identifiers = m.related_identifiers.map(r => ({
      identifier: r.identifier,
      relation: r.relation,
      scheme: r.scheme,
      ...(r.resource_type ? { resource_type: r.resource_type } : {}),
    }));
  }
  if (m.contributors && m.contributors.length > 0) {
    payload.contributors = m.contributors.map(c => ({
      name: c.name,
      type: c.type,
      ...(c.affiliation ? { affiliation: c.affiliation } : {}),
      ...(c.orcid ? { orcid: c.orcid } : {}),
    }));
  }
  if (m.references && m.references.length > 0) {
    payload.references = [...m.references];
  }

  return payload;
}
