
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput } from '../schema';
import { createLocation } from '../handlers/create_location';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateLocationInput = {
  name: 'Test Location',
  description: 'A location for testing'
};

const testInputWithNullDescription: CreateLocationInput = {
  name: 'Location Without Description',
  description: null
};

describe('createLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a location with description', async () => {
    const result = await createLocation(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Location');
    expect(result.description).toEqual('A location for testing');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a location with null description', async () => {
    const result = await createLocation(testInputWithNullDescription);

    // Basic field validation
    expect(result.name).toEqual('Location Without Description');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save location to database', async () => {
    const result = await createLocation(testInput);

    // Query using proper drizzle syntax
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toEqual('Test Location');
    expect(locations[0].description).toEqual('A location for testing');
    expect(locations[0].created_at).toBeInstanceOf(Date);
  });

  it('should save location with null description to database', async () => {
    const result = await createLocation(testInputWithNullDescription);

    // Query using proper drizzle syntax
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toEqual('Location Without Description');
    expect(locations[0].description).toBeNull();
    expect(locations[0].created_at).toBeInstanceOf(Date);
  });
});
