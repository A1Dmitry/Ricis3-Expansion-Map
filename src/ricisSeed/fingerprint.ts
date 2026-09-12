/**
 * RICIS SEED — детерминированные структурные отпечатки аксиом и поколений системы.
 *
 * Требования (RCVAP / anti-tukhta):
 *  1. Отпечаток обязан быть одинаковым в Node, в браузере и между запусками:
 *     идентичность аксиомы (L1: X = X) проверяется структурой, а не объектной ссылкой.
 *  2. Никакой криптографии, никакого `Math.random()`, никакого `Date.now()`:
 *     расширение RICIS должно быть воспроизводимым экспериментом, а не «уникальным артефактом».
 *  3. Отпечаток считается по канонической форме (ключи объектов сортируются),
 *     поэтому перестановка полей во входных данных не создаёт «новую» аксиому.
 */

export type AxiomFingerprint = `axiom-v1:${string}`;
export type SeedFingerprint = `seed-v1:${string}`;

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const MIX_PRIME = 0x85ebca6b;

/**
 * Дайджест строки на двух 32-битных дорожках FNV-1a (64 бита суммарно).
 * Возвращает ровно 16 hex-символов.
 */
export function fnv1a64Hex(input: string): string {
  let low = FNV_OFFSET_BASIS;
  let high = FNV_OFFSET_BASIS ^ 0x5f;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    low = Math.imul(low ^ code, FNV_PRIME) >>> 0;
    high = Math.imul(high ^ ((code + index) & 0xff), MIX_PRIME) >>> 0;
    high = (high ^ (high >>> 13)) >>> 0;
  }
  return `${low.toString(16).padStart(8, '0')}${high.toString(16).padStart(8, '0')}`;
}

export type CanonicalValue =
  | string
  | number
  | boolean
  | null
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue };

/** Каноническая сериализация: ключи объектов сортируются, порядок массивов сохраняется. */
export function canonicalize(value: CanonicalValue): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const record = value as { readonly [key: string]: CanonicalValue };
  const keys = Object.keys(record).sort();
  return `{${keys.map(key => `${JSON.stringify(key)}:${canonicalize(record[key] as CanonicalValue)}`).join(',')}}`;
}

export interface AxiomFingerprintInput {
  readonly id: string;
  readonly layer: string;
  readonly statement: string;
  readonly covers: readonly string[];
  readonly consequences: readonly { readonly inputForm: string; readonly outputForm: string }[];
}

/**
 * Отпечаток аксиомы намеренно НЕ включает origin, proof и solvedProblemId:
 * аксиома, полученная расширением, и аксиома из исходного зерна с тем же
 * математическим содержанием — это одна и та же аксиома (запрет дублирования).
 */
export function axiomFingerprint(input: AxiomFingerprintInput): AxiomFingerprint {
  const digest = fnv1a64Hex(
    canonicalize({
      id: input.id,
      layer: input.layer,
      statement: input.statement,
      covers: [...input.covers],
      consequences: input.consequences.map(entry => ({ inputForm: entry.inputForm, outputForm: entry.outputForm })),
    }),
  );
  return `axiom-v1:${digest}`;
}

/** Отпечаток поколения: номер поколения + отсортированный список отпечатков аксиом. */
export function seedFingerprint(generation: number, axiomFingerprints: readonly string[]): SeedFingerprint {
  const digest = fnv1a64Hex(canonicalize({ generation, axioms: [...axiomFingerprints].sort() }));
  return `seed-v1:${digest}`;
}
