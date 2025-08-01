
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storyboardsTable, scenesTable } from '../db/schema';
import { type CreateStoryboardInput, type CreateSceneInput } from '../schema';
import { getScenes } from '../handlers/get_scenes';

describe('getScenes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return scenes for a storyboard ordered by sequence_number', async () => {
    // Create a test storyboard
    const storyboardInput: CreateStoryboardInput = {
      title: 'Test Storyboard',
      initial_prompt: 'A test story',
      script_content: null
    };

    const storyboardResult = await db.insert(storyboardsTable)
      .values(storyboardInput)
      .returning()
      .execute();

    const storyboardId = storyboardResult[0].id;

    // Create test scenes with different sequence numbers
    const sceneInputs: CreateSceneInput[] = [
      {
        storyboard_id: storyboardId,
        sequence_number: 3,
        title: 'Scene 3',
        description: 'Third scene',
        location_id: null
      },
      {
        storyboard_id: storyboardId,
        sequence_number: 1,
        title: 'Scene 1',
        description: 'First scene',
        location_id: null
      },
      {
        storyboard_id: storyboardId,
        sequence_number: 2,
        title: 'Scene 2',
        description: 'Second scene',
        location_id: null
      }
    ];

    // Insert scenes
    for (const sceneInput of sceneInputs) {
      await db.insert(scenesTable)
        .values(sceneInput)
        .execute();
    }

    // Get scenes
    const result = await getScenes(storyboardId);

    // Verify results
    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Scene 1');
    expect(result[0].sequence_number).toEqual(1);
    expect(result[1].title).toEqual('Scene 2');
    expect(result[1].sequence_number).toEqual(2);
    expect(result[2].title).toEqual('Scene 3');
    expect(result[2].sequence_number).toEqual(3);

    // Verify all scenes belong to the correct storyboard
    result.forEach(scene => {
      expect(scene.storyboard_id).toEqual(storyboardId);
      expect(scene.id).toBeDefined();
      expect(scene.created_at).toBeInstanceOf(Date);
      expect(scene.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for storyboard with no scenes', async () => {
    // Create a storyboard with no scenes
    const storyboardInput: CreateStoryboardInput = {
      title: 'Empty Storyboard',
      initial_prompt: 'An empty story',
      script_content: null
    };

    const storyboardResult = await db.insert(storyboardsTable)
      .values(storyboardInput)
      .returning()
      .execute();

    const storyboardId = storyboardResult[0].id;

    const result = await getScenes(storyboardId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent storyboard', async () => {
    const nonExistentId = 99999;
    
    const result = await getScenes(nonExistentId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return scenes for the specified storyboard', async () => {
    // Create two storyboards
    const storyboard1Input: CreateStoryboardInput = {
      title: 'Storyboard 1',
      initial_prompt: 'First story',
      script_content: null
    };

    const storyboard2Input: CreateStoryboardInput = {
      title: 'Storyboard 2',
      initial_prompt: 'Second story',
      script_content: null
    };

    const storyboard1Result = await db.insert(storyboardsTable)
      .values(storyboard1Input)
      .returning()
      .execute();

    const storyboard2Result = await db.insert(storyboardsTable)
      .values(storyboard2Input)
      .returning()
      .execute();

    const storyboard1Id = storyboard1Result[0].id;
    const storyboard2Id = storyboard2Result[0].id;

    // Create scenes for both storyboards
    await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard1Id,
        sequence_number: 1,
        title: 'Storyboard 1 Scene',
        description: 'Scene for first storyboard',
        location_id: null
      })
      .execute();

    await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard2Id,
        sequence_number: 1,
        title: 'Storyboard 2 Scene',
        description: 'Scene for second storyboard',
        location_id: null
      })
      .execute();

    // Get scenes for storyboard 1
    const result = await getScenes(storyboard1Id);

    // Should only return scenes for storyboard 1
    expect(result).toHaveLength(1);
    expect(result[0].storyboard_id).toEqual(storyboard1Id);
    expect(result[0].title).toEqual('Storyboard 1 Scene');
  });
});
