import Counter from '../models/counter.model.js';

const REFERENCE_DIGITS = 5;

/**
 * Atomically increments a named counter and returns the new value.
 *
 * `findOneAndUpdate` with an upsert is a single atomic operation, so parallel
 * callers never receive the same number. Two callers racing to create the
 * document itself can still collide on the unique _id; that surfaces as a
 * duplicate-key error, and retrying once is enough because the document then
 * exists for everyone.
 */
async function nextSequence(key) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: key },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true },
      );

      return counter.sequence;
    } catch (error) {
      if (error.code !== 11000 || attempt === 1) {
        throw error;
      }
    }
  }

  throw new Error(`Unable to allocate a sequence number for ${key}.`);
}

/**
 * Produces the next candidate reference, e.g. TAL-2026-00021.
 * Numbering restarts each calendar year, matching the format in the SRS.
 */
export async function generateCandidateReference(date = new Date()) {
  const year = date.getFullYear();
  const sequence = await nextSequence(`candidate-reference-${year}`);

  return `TAL-${year}-${String(sequence).padStart(REFERENCE_DIGITS, '0')}`;
}
