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

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
