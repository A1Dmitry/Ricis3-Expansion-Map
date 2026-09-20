import { Expression } from '../ast/ExpressionTypes';
import { ICanonicalizer, AstCanonicalizer } from './Canonicalizer';

/**
 * R-03 — `Identity` уже отделена от `Expr`.
 *   structure Identity where
 *     hash : IdentityHash
 *     canonical : String
 *
 * Замечание аудита: сейчас каноническая идентичность материализуется как
 * `hash + String`, а не как *доказуемое равенство канонических AST*. Это не ошибка,
 * а степень формализации (оставляем как есть, фиксируем в аудит-фреймворке T11).
 */
export type IdentityHash = string;

export interface Identity {
  readonly hash: IdentityHash;
  readonly canonical: string;
}

export interface IIdentityProvider {
  computeIdentity(expr: Expression): Identity;
}

/** FNV-1a 32-bit → hex. Детерминированная, чистая функция от канонической формы. */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export class IdentityProvider implements IIdentityProvider {
  constructor(private readonly canonicalizer: ICanonicalizer = new AstCanonicalizer()) {}

  computeIdentity(expr: Expression): Identity {
    const canonical = this.canonicalizer.canonicalize(expr);
    return { hash: fnv1a(canonical), canonical };
  }
}
