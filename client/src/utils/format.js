const LOCALE = 'en-NG';

export function formatCurrency(amount, currency = 'NGN') {
  if (typeof amount !== 'number') {
    return '—';
  }

  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency }).format(amount);
}

export function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

/** Formats a date for an <input type="date"> value. */
export function toDateInputValue(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
}

/** "React, Node.js" -> ["React", "Node.js"], dropping blanks and duplicates. */
export function parseList(value) {
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(items)];
}

export function formatList(items) {
  return Array.isArray(items) ? items.join(', ') : '';
}
