
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { charactersTable, locationsTable, storyboardsTable, scenesTable, sceneCharactersTable } from '../db/schema';
import { type AssignCharacterToSceneInput } from '../schema';
import { assignCharacterToScene } from '../handlers/assign_character_to_scene';
import { eq, and } from 'drizzle-orm';

describe('assignCharacterToScene', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCharacterId: number;
  let testSceneId: number;
  let testStoryboardId: number;

  beforeEach(async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt'
      })
      .returning()
      .execute();
    testStoryboardId = storyboard[0].id;

    // Create test character
    const character = await db.insert(charactersTable)
      .values({
        name: 'Test Character',
        description: 'A character for testing'
      })
      .returning()
      .execute();
    testCharacterId = character[0].id;

    // Create test scene
    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: testStoryboardId,
        sequence_number: 1,
        title: 'Test Scene',
        description: 'A scene for testing'
      })
      .returning()
      .execute();
    testSceneId = scene[0].id;
  });

  it('should assign character to scene successfully', async () => {
    const input: AssignCharacterToSceneInput = {
      scene_id: testSceneId,
      character_id: testCharacterId
    };

    const result = await assignCharacterToScene(input);

    // Verify return value
    expect(result.scene_id).toEqual(testSceneId);
    expect(result.character_id).toEqual(testCharacterId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save assignment to database', async () => {
    const input: AssignCharacterToSceneInput = {
      scene_id: testSceneId,
      character_id: testCharacterId
    };

    const result = await assignCharacterToScene(input);

    // Verify record exists in database
    const assignments = await db.select()
      .from(sceneCharactersTable)
      .where(eq(sceneCharactersTable.id, result.id))
      .execute();

    expect(assignments).toHaveLength(1);
    expect(assignments[0].scene_id).toEqual(testSceneId);
    expect(assignments[0].character_id).toEqual(testCharacterId);
    expect(assignments[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when scene does not exist', async () => {
    const input: AssignCharacterToSceneInput = {
      scene_id: 999, // Non-existent scene
      character_id: testCharacterId
    };

    await expect(assignCharacterToScene(input)).rejects.toThrow(/scene with id 999 not found/i);
  });

  it('should throw error when character does not exist', async () => {
    const input: AssignCharacterToSceneInput = {
      scene_id: testSceneId,
      character_id: 999 // Non-existent character
    };

    await expect(assignCharacterToScene(input)).rejects.toThrow(/character with id 999 not found/i);
  });

  it('should throw error when character is already assigned to scene', async () => {
    const input: AssignCharacterToSceneInput = {
      scene_id: testSceneId,
      character_id: testCharacterId
    };

    // First assignment should succeed
    await assignCharacterToScene(input);

    // Second assignment should fail
    await expect(assignCharacterToScene(input)).rejects.toThrow(/character .* is already assigned to scene/i);
  });

  it('should allow same character to be assigned to different scenes', async () => {
    // Create second scene
    const secondScene = await db.insert(scenesTable)
      .values({
        storyboard_id: testStoryboardId,
        sequence_number: 2,
        title: 'Second Test Scene',
        description: 'Another scene for testing'
      })
      .returning()
      .execute();

    const firstInput: AssignCharacterToSceneInput = {
      scene_id: testSceneId,
      character_id: testCharacterId
    };

    const secondInput: AssignCharacterToSceneInput = {
      scene_id: secondScene[0].id,
      character_id: testCharacterId
    };

    // Both assignments should succeed
    const firstResult = await assignCharacterToScene(firstInput);
    const secondResult = await assignCharacterToScene(secondInput);

    expect(firstResult.scene_id).toEqual(testSceneId);
    expect(secondResult.scene_id).toEqual(secondScene[0].id);
    expect(firstResult.character_id).toEqual(testCharacterId);
    expect(secondResult.character_id).toEqual(testCharacterId);
  });

  it('should allow different characters to be assigned to same scene', async () => {
    // Create second character
    const secondCharacter = await db.insert(charactersTable)
      .values({
        name: 'Second Test Character',
        description: 'Another character for testing'
      })
      .returning()
      .execute();

    const firstInput: AssignCharacterToSceneInput = {
      scene_id: testSceneId,
      character_id: testCharacterId
    };

    const secondInput: AssignCharacterToSceneInput = {
      scene_id: testSceneId,
      character_id: secondCharacter[0].id
    };

    // Both assignments should succeed
    const firstResult = await assignCharacterToScene(firstInput);
    const secondResult = await assignCharacterToScene(secondInput);

    expect(firstResult.character_id).toEqual(testCharacterId);
    expect(secondResult.character_id).toEqual(secondCharacter[0].id);
    expect(firstResult.scene_id).toEqual(testSceneId);
    expect(secondResult.scene_id).toEqual(testSceneId);
  });

  it('should verify assignment exists in database with proper foreign key relationships', async () => {
    const input: AssignCharacterToSceneInput = {
      scene_id: testSceneId,
      character_id: testCharacterId
    };

    await assignCharacterToScene(input);

    // Query with joins to verify relationships
    const assignments = await db.select()
      .from(sceneCharactersTable)
      .innerJoin(scenesTable, eq(sceneCharactersTable.scene_id, scenesTable.id))
      .innerJoin(charactersTable, eq(sceneCharactersTable.character_id, charactersTable.id))
      .where(and(
        eq(sceneCharactersTable.scene_id, testSceneId),
        eq(sceneCharactersTable.character_id, testCharacterId)
      ))
      .execute();

    expect(assignments).toHaveLength(1);
    expect(assignments[0].scenes.id).toEqual(testSceneId);
    expect(assignments[0].scenes.title).toEqual('Test Scene');
    expect(assignments[0].characters.id).toEqual(testCharacterId);
    expect(assignments[0].characters.name).toEqual('Test Character');
  });
});
