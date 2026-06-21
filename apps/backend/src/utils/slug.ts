import { randomBytes } from 'node:crypto';

/**
 * Converts a string to a URL-safe slug.
 *
 * @param text - The input string to slugify.
 * @param options - Options for slug generation.
 * @param options.unique - If true, appends a short random suffix to ensure uniqueness.
 * @returns A lowercase, hyphen-separated slug.
 *
 * @example
 * generateSlug('Hello World!')           // 'hello-world'
 * generateSlug('CSE A 2025', { unique: true }) // 'cse-a-2025-a3f1b2'
 */
export function generateSlug(text: string, options?: { unique?: boolean }): string {
  let slug = text
    .toString()
    .normalize('NFD')                   // Decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')    // Strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')      // Remove non-alphanumeric (except spaces/hyphens)
    .replace(/[\s_]+/g, '-')           // Replace spaces/underscores with hyphens
    .replace(/-+/g, '-')              // Collapse consecutive hyphens
    .replace(/^-|-$/g, '');           // Trim leading/trailing hyphens

  if (options?.unique) {
    const suffix = randomBytes(3).toString('hex'); // 6-char hex string
    slug = `${slug}-${suffix}`;
  }

  return slug;
}
