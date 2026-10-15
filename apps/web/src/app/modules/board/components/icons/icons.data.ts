import * as Lucide from 'lucide-angular';

// Lucide icons are exposed as an array of [tagName, attributes] tuples.
type LucideIconNode = ReadonlyArray<
  readonly [string, Record<string, string | number>]
>;

function toSvg(node: LucideIconNode): string {
  const children = node
    .map(([tag, attrs]) => {
      const serializedAttrs = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');

      return `<${tag} ${serializedAttrs}/>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e254b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

export interface BoardIcon {
  name: string;
  svg: string;
}

// Turn a Lucide export name (PascalCase, e.g. "ArrowRight", "Trash2") into a
// searchable label (e.g. "arrow right", "trash 2").
function toSearchName(exportName: string): string {
  return exportName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d+)/g, '$1 $2')
    .toLowerCase()
    .trim();
}

// A Lucide icon export is an array of [tag, attrs] tuples; everything else in
// the module (the Angular module, injection tokens, helpers) is skipped.
function isIconNode(value: unknown): value is LucideIconNode {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (child) =>
        Array.isArray(child) &&
        typeof child[0] === 'string' &&
        typeof child[1] === 'object' &&
        child[1] !== null,
    )
  );
}

// The full Lucide icon set, generated once, de-duplicated by rendered SVG,
// sorted and searchable by name.
export const boardIcons: BoardIcon[] = (() => {
  const seen = new Set<string>();

  return Object.entries(Lucide as unknown as Record<string, unknown>)
    .filter(([name, value]) => /^[A-Z]/.test(name) && isIconNode(value))
    .map(([name, value]) => ({
      name: toSearchName(name),
      svg: toSvg(value as LucideIconNode),
    }))
    .filter((icon) => {
      if (seen.has(icon.svg)) {
        return false;
      }

      seen.add(icon.svg);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
})();
