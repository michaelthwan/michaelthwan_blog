import type { CollectionEntry } from 'astro:content';

// Dates for the listing views. `written` (when set) is when the post was written;
// otherwise `published` is. Paper explainers keep the paper's date in `published`,
// which these views show as a "Paper" label instead of sorting by it.
// ISO dates parse as UTC midnight, so everything here formats in UTC.

type Post = CollectionEntry<'posts'>;

export function writtenDate(post: Post) {
    const raw = post.data.written ?? post.data.published;
    const date = new Date(raw);
    return {
        date,
        valid: !isNaN(date.getTime()),
        hasDay: /^\d{4}-\d{2}-\d{2}/.test(raw),  // "April 2026" knows only the month
        raw,
    };
}

export function paperYear(post: Post): string | null {
    if (!post.data.written) return null;
    const d = new Date(post.data.published);
    return isNaN(d.getTime()) ? post.data.published : String(d.getUTCFullYear());
}

export const fmt = (date: Date, opts: Intl.DateTimeFormatOptions) =>
    date.toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
