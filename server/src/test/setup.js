import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const { collections } = mongoose.connection;

  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  vi.restoreAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
