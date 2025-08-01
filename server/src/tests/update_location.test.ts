
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type UpdateLocationInput, type CreateLocationInput } from '../schema';
import { updateLocation } from '../handlers/update_location';
import { eq } from 'drizzle-orm';

// Test inputs
const createLocationInput: CreateLocationInput = {
  name: 'Original Location',
  description: 'Original description'
};

const updateLocationInput: UpdateLocationInput = {
  id: 1,
  name: 'Updated Location',
  description: 'Updated description'
};

describe('updateLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a location with all fields', async () => {
    // Create initial location
    const created = await db.insert(locationsTable)
      .values(createLocationInput)
      .returning()
      .execute();

    const locationId = created[0].id;

    // Update the location
    const result = await updateLocation({
      id: locationId,
      name: 'Updated Location',
      description: 'Updated description'
    });

    expect(result.id).toEqual(locationId);
    expect(result.name).toEqual('Updated Location');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update a location with partial fields', async () => {
    // Create initial location
    const created = await db.insert(locationsTable)
      .values(createLocationInput)
      .returning()
      .execute();

    const locationId = created[0].id;

    // Update only the name
    const result = await updateLocation({
      id: locationId,
      name: 'Only Name Updated'
    });

    expect(result.id).toEqual(locationId);
    expect(result.name).toEqual('Only Name Updated');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update location description to null', async () => {
    // Create initial location
    const created = await db.insert(locationsTable)
      .values(createLocationInput)
      .returning()
      .execute();

    const locationId = created[0].id;

    // Update description to null
    const result = await updateLocation({
      id: locationId,
      description: null
    });

    expect(result.id).toEqual(locationId);
    expect(result.name).toEqual('Original Location'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated location to database', async () => {
    // Create initial location
    const created = await db.insert(locationsTable)
      .values(createLocationInput)
      .returning()
      .execute();

    const locationId = created[0].id;

    // Update the location
    await updateLocation({
      id: locationId,
      name: 'Database Updated Location',
      description: 'Database updated description'
    });

    // Verify in database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toEqual('Database Updated Location');
    expect(locations[0].description).toEqual('Database updated description');
    expect(locations[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when location does not exist', async () => {
    // Try to update non-existent location
    await expect(updateLocation({
      id: 999,
      name: 'Non-existent Location'
    })).rejects.toThrow(/Location with id 999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    // Create initial location
    const created = await db.insert(locationsTable)
      .values(createLocationInput)
      .returning()
      .execute();

    const locationId = created[0].id;

    // Update with no changes (only id provided)
    const result = await updateLocation({
      id: locationId
    });

    expect(result.id).toEqual(locationId);
    expect(result.name).toEqual('Original Location'); // Should remain unchanged
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
