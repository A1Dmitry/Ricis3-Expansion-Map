import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sources(path);
    return path.endsWith('.tsx') && !path.includes('.test.') ? [path] : [];
  });
}

describe('Application-wide control contracts', () => {
  it('does not replace labelled tabs, selection cards or menu items with icon-only controls', () => {
    const violations: string[] = [];
    for (const file of sources(join(process.cwd(), 'src'))) {
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node: ts.Node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const name = node.tagName.getText(source);
          const attribute = (key: string) => node.attributes.properties.find(prop =>
            ts.isJsxAttribute(prop) && prop.name.getText(source) === key
          ) as ts.JsxAttribute | undefined;
          const role = attribute('role')?.initializer?.getText(source);
          const kind = attribute('data-control-kind')?.initializer?.getText(source);
          const presentation = attribute('presentation')?.initializer?.getText(source);
          const losesLabel = name === 'IconChoice' || (name === 'IconButton' && (
            role === '"tab"' || kind === '"selection"' || kind === '"tab"'
            || (role === '"menuitem"' && !['"menu"', '"menubar"'].includes(presentation ?? ''))
          ));
          if (losesLabel) violations.push(`${relative(process.cwd(), file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
    // Native buttons/links and keyboard-enabled SVG nodes are valid controls.
    // A shared-component count is not a usability requirement.
    expect(violations).toEqual([]);
  });

  it('fixes command geometry independently of legacy utility classes without forcing responsive visibility', () => {
    const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
    const rule = css.match(/:is\(button, a\)\.icon-button \{([^}]+)\}/)?.[1];
    expect(rule).toContain('width: 2rem');
    expect(rule).toContain('height: 2rem');
    expect(rule).toContain('padding: 0');
    expect(rule).toContain('flex: 0 0 2rem');
    expect(rule).not.toMatch(/display\s*:/);
    expect(css).toContain('@media (pointer: coarse)');
    expect(css).toContain('flex-basis: 2.75rem');
  });
});
