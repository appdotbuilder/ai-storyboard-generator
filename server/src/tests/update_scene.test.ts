
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storyboardsTable, scenesTable, locationsTable } from '../db/schema';
import { type UpdateSceneInput } from '../schema';
import { updateScene } from '../handlers/update_scene';
import { eq } from 'drizzle-orm';

describe('updateScene', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update scene title', async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt'
      })
      .returning()
      .execute();

    // Create test scene
    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Original Title',
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateSceneInput = {
      id: scene[0].id,
      title: 'Updated Title'
    };

    const result = await updateScene(updateInput);

    expect(result.id).toEqual(scene[0].id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.storyboard_id).toEqual(storyboard[0].id);
    expect(result.sequence_number).toEqual(1);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > scene[0].updated_at).toBe(true);
  });

  it('should update scene description', async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt'
      })
      .returning()
      .execute();

    // Create test scene
    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Test Scene',
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateSceneInput = {
      id: scene[0].id,
      description: 'Updated description'
    };

    const result = await updateScene(updateInput);

    expect(result.id).toEqual(scene[0].id);
    expect(result.title).toEqual('Test Scene'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > scene[0].updated_at).toBe(true);
  });

  it('should update scene location', async () => {
    // Create test location
    const location = await db.insert(locationsTable)
      .values({
        name: 'Test Location',
        description: 'A test location'
      })
      .returning()
      .execute();

    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt'
      })
      .returning()
      .execute();

    // Create test scene
    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Test Scene',
        description: 'Test description'
      })
      .returning()
      .execute();

    const updateInput: UpdateSceneInput = {
      id: scene[0].id,
      location_id: location[0].id
    };

    const result = await updateScene(updateInput);

    expect(result.id).toEqual(scene[0].id);
    expect(result.location_id).toEqual(location[0].id);
    expect(result.title).toEqual('Test Scene'); // Should remain unchanged
    expect(result.description).toEqual('Test description'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > scene[0].updated_at).toBe(true);
  });

  it('should update multiple scene fields', async () => {
    // Create test location
    const location = await db.insert(locationsTable)
      .values({
        name: 'Test Location',
        description: 'A test location'
      })
      .returning()
      .execute();

    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt'
      })
      .returning()
      .execute();

    // Create test scene
    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Original Title',
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateSceneInput = {
      id: scene[0].id,
      title: 'Updated Title',
      description: 'Updated description',
      location_id: location[0].id
    };

    const result = await updateScene(updateInput);

    expect(result.id).toEqual(scene[0].id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.location_id).toEqual(location[0].id);
    expect(result.storyboard_id).toEqual(storyboard[0].id);
    expect(result.sequence_number).toEqual(1);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > scene[0].updated_at).toBe(true);
  });

  it('should set location_id to null', async () => {
    // Create test location
    const location = await db.insert(locationsTable)
      .values({
        name: 'Test Location',
        description: 'A test location'
      })
      .returning()
      .execute();

    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt'
      })
      .returning()
      .execute();

    // Create test scene with location
    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Test Scene',
        description: 'Test description',
        location_id: location[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateSceneInput = {
      id: scene[0].id,
      location_id: null
    };

    const result = await updateScene(updateInput);

    expect(result.id).toEqual(scene[0].id);
    expect(result.location_id).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > scene[0].updated_at).toBe(true);
  });

  it('should save updated scene to database', async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt'
      })
      .returning()
      .execute();

    // Create test scene
    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Original Title',
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateSceneInput = {
      id: scene[0].id,
      title: 'Updated Title',
      description: 'Updated description'
    };

    await updateScene(updateInput);

    // Verify changes were saved to database
    const updatedScene = await db.select()
      .from(scenesTable)
      .where(eq(scenesTable.id, scene[0].id))
      .execute();

    expect(updatedScene).toHaveLength(1);
    expect(updatedScene[0].title).toEqual('Updated Title');
    expect(updatedScene[0].description).toEqual('Updated description');
    expect(updatedScene[0].updated_at).toBeInstanceOf(Date);
    expect(updatedScene[0].updated_at > scene[0].updated_at).toBe(true);
  });

  it('should throw error for non-existent scene', async () => {
    const updateInput: UpdateSceneInput = {
      id: 999,
      title: 'Updated Title'
    };

    await expect(updateScene(updateInput)).rejects.toThrow(/Scene with id 999 not found/i);
  });
});
