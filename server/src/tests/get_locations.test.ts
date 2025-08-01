
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { getLocations } from '../handlers/get_locations';

describe('getLocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no locations exist', async () => {
    const result = await getLocations();

    expect(result).toEqual([]);
  });

  it('should return all locations', async () => {
    // Create test locations
    await db.insert(locationsTable)
      .values([
        {
          name: 'Office Building',
          description: 'Modern corporate headquarters'
        },
        {
          name: 'Coffee Shop',
          description: 'Cozy neighborhood cafe'
        },
        {
          name: 'Park',
          description: null
        }
      ])
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(3);
    
    // Check first location
    expect(result[0].name).toEqual('Office Building');
    expect(result[0].description).toEqual('Modern corporate headquarters');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second location
    expect(result[1].name).toEqual('Coffee Shop');
    expect(result[1].description).toEqual('Cozy neighborhood cafe');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);

    // Check third location with null description
    expect(result[2].name).toEqual('Park');
    expect(result[2].description).toBeNull();
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
  });

  it('should return locations ordered by creation time', async () => {
    // Create locations with slight delay to ensure different timestamps
    await db.insert(locationsTable)
      .values({
        name: 'First Location',
        description: 'Created first'
      })
      .execute();

    await db.insert(locationsTable)
      .values({
        name: 'Second Location',
        description: 'Created second'
      })
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Location');
    expect(result[1].name).toEqual('Second Location');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
