
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scenesTable, storyboardsTable, locationsTable } from '../db/schema';
import { type CreateSceneInput } from '../schema';
import { createScene } from '../handlers/create_scene';
import { eq } from 'drizzle-orm';

describe('createScene', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a scene with all fields', async () => {
    // Create prerequisite storyboard and location
    const storyboardResult = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt'
      })
      .returning()
      .execute();
    
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Location',
        description: 'A test location'
      })
      .returning()
      .execute();

    const testInput: CreateSceneInput = {
      storyboard_id: storyboardResult[0].id,
      sequence_number: 1,
      title: 'Opening Scene',
      description: 'The story begins here',
      location_id: locationResult[0].id
    };

    const result = await createScene(testInput);

    // Basic field validation
    expect(result.storyboard_id).toEqual(storyboardResult[0].id);
    expect(result.sequence_number).toEqual(1);
    expect(result.title).toEqual('Opening Scene');
    expect(result.description).toEqual('The story begins here');
    expect(result.location_id).toEqual(locationResult[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a scene without location', async () => {
    // Create prerequisite storyboard
    const storyboardResult = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        script_content: 'Test script'
      })
      .returning()
      .execute();

    const testInput: CreateSceneInput = {
      storyboard_id: storyboardResult[0].id,
      sequence_number: 2,
      title: 'Second Scene',
      description: 'A scene without location',
      location_id: null
    };

    const result = await createScene(testInput);

    expect(result.storyboard_id).toEqual(storyboardResult[0].id);
    expect(result.sequence_number).toEqual(2);
    expect(result.title).toEqual('Second Scene');
    expect(result.description).toEqual('A scene without location');
    expect(result.location_id).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save scene to database', async () => {
    // Create prerequisite storyboard
    const storyboardResult = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt'
      })
      .returning()
      .execute();

    const testInput: CreateSceneInput = {
      storyboard_id: storyboardResult[0].id,
      sequence_number: 3,
      title: 'Database Test Scene',
      description: 'Testing database persistence',
      location_id: null
    };

    const result = await createScene(testInput);

    // Query database to verify persistence
    const scenes = await db.select()
      .from(scenesTable)
      .where(eq(scenesTable.id, result.id))
      .execute();

    expect(scenes).toHaveLength(1);
    expect(scenes[0].storyboard_id).toEqual(storyboardResult[0].id);
    expect(scenes[0].sequence_number).toEqual(3);
    expect(scenes[0].title).toEqual('Database Test Scene');
    expect(scenes[0].description).toEqual('Testing database persistence');
    expect(scenes[0].location_id).toBeNull();
    expect(scenes[0].created_at).toBeInstanceOf(Date);
    expect(scenes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent storyboard', async () => {
    const testInput: CreateSceneInput = {
      storyboard_id: 999,
      sequence_number: 1,
      title: 'Invalid Scene',
      description: 'This should fail',
      location_id: null
    };

    await expect(createScene(testInput)).rejects.toThrow(/storyboard.*not found/i);
  });

  it('should throw error for non-existent location', async () => {
    // Create prerequisite storyboard
    const storyboardResult = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt'
      })
      .returning()
      .execute();

    const testInput: CreateSceneInput = {
      storyboard_id: storyboardResult[0].id,
      sequence_number: 1,
      title: 'Invalid Location Scene',
      description: 'This should fail due to invalid location',
      location_id: 999
    };

    await expect(createScene(testInput)).rejects.toThrow(/location.*not found/i);
  });
});
