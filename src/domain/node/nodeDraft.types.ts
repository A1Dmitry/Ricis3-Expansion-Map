/**
 * Shared structural contract for node content exchanged between UI input and AI enrichment.
 *
 * This is a DTO contract, not a domain entity: it intentionally contains only optional
 * presentation/input fields and does not own persistence or RICIS invariants.
 */
export interface NodeContentFields {
  title?: string;
  targetFunction?: string;
  description?: string;
  hint?: string;
  link?: string;
}

/** User-provided prefill data for creating a map node. */
export interface AddNodePrefillData extends NodeContentFields {
  zoneId?: string;
}

/** AI response that enriches node content with a normalized function. */
export interface AiAssistantNodeResponse extends NodeContentFields {
  normalizedFunction?: string;
}
