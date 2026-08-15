/**
 * Runs a paginated find plus its count, returning a consistent envelope.
 *
 * @param {import('mongoose').Model} model
 * @param {object} options.query      Mongo filter
 * @param {number} options.page       1-indexed
 * @param {number} options.limit
 * @param {string} [options.select]   Field projection
 * @param {object} [options.sort]
 * @param {Array}  [options.populate] Populate specs
 */
export async function paginate(model, { query, page, limit, select, sort = { createdAt: -1 }, populate = [] }) {
  let find = model.find(query).sort(sort).skip((page - 1) * limit).limit(limit);

  if (select) {
    find = find.select(select);
  }

  for (const spec of populate) {
    find = find.populate(spec);
  }

  const [items, total] = await Promise.all([find, model.countDocuments(query)]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Escapes user input before it is used inside a regular expression. */
export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
