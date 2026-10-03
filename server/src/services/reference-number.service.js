import Counter from '../models/counter.model.js';

const REFERENCE_DIGITS = 5;

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

export async function generateCandidateReference(date = new Date()) {
  const year = date.getFullYear();
  const sequence = await nextSequence(`candidate-reference-${year}`);

  return `TAL-${year}-${String(sequence).padStart(REFERENCE_DIGITS, '0')}`;
}
