
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { charactersTable, locationsTable, storyboardsTable, scenesTable, sceneCharactersTable } from '../db/schema';
import { type RemoveCharacterFromSceneInput } from '../schema';
import { removeCharacterFromScene } from '../handlers/remove_character_from_scene';
import { eq, and } from 'drizzle-orm';

describe('removeCharacterFromScene', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove character from scene successfully', async () => {
    // Create prerequisite data
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt',
        status: 'draft'
      })
      .returning()
      .execute();

    const character = await db.insert(charactersTable)
      .values({
        name: 'Test Character',
        description: 'A test character'
      })
      .returning()
      .execute();

    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Test Scene',
        description: 'A test scene'
      })
      .returning()
      .execute();

    // Create the scene-character relationship
    await db.insert(sceneCharactersTable)
      .values({
        scene_id: scene[0].id,
        character_id: character[0].id
      })
      .execute();

    const input: RemoveCharacterFromSceneInput = {
      scene_id: scene[0].id,
      character_id: character[0].id
    };

    const result = await removeCharacterFromScene(input);

    expect(result).toBe(true);

    // Verify the relationship was removed from database
    const relationships = await db.select()
      .from(sceneCharactersTable)
      .where(
        and(
          eq(sceneCharactersTable.scene_id, scene[0].id),
          eq(sceneCharactersTable.character_id, character[0].id)
        )
      )
      .execute();

    expect(relationships).toHaveLength(0);
  });

  it('should return false when character is not assigned to scene', async () => {
    // Create prerequisite data
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt',
        status: 'draft'
      })
      .returning()
      .execute();

    const character = await db.insert(charactersTable)
      .values({
        name: 'Test Character',
        description: 'A test character'
      })
      .returning()
      .execute();

    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Test Scene',
        description: 'A test scene'
      })
      .returning()
      .execute();

    // No scene-character relationship created

    const input: RemoveCharacterFromSceneInput = {
      scene_id: scene[0].id,
      character_id: character[0].id
    };

    const result = await removeCharacterFromScene(input);

    expect(result).toBe(false);
  });

  it('should only remove the specific character from scene', async () => {
    // Create prerequisite data
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt',
        status: 'draft'
      })
      .returning()
      .execute();

    const character1 = await db.insert(charactersTable)
      .values({
        name: 'Character 1',
        description: 'First character'
      })
      .returning()
      .execute();

    const character2 = await db.insert(charactersTable)
      .values({
        name: 'Character 2',
        description: 'Second character'
      })
      .returning()
      .execute();

    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Test Scene',
        description: 'A test scene'
      })
      .returning()
      .execute();

    // Create relationships for both characters
    await db.insert(sceneCharactersTable)
      .values([
        {
          scene_id: scene[0].id,
          character_id: character1[0].id
        },
        {
          scene_id: scene[0].id,
          character_id: character2[0].id
        }
      ])
      .execute();

    const input: RemoveCharacterFromSceneInput = {
      scene_id: scene[0].id,
      character_id: character1[0].id
    };

    const result = await removeCharacterFromScene(input);

    expect(result).toBe(true);

    // Verify only character1 was removed
    const remainingRelationships = await db.select()
      .from(sceneCharactersTable)
      .where(eq(sceneCharactersTable.scene_id, scene[0].id))
      .execute();

    expect(remainingRelationships).toHaveLength(1);
    expect(remainingRelationships[0].character_id).toBe(character2[0].id);
  });

  it('should handle non-existent scene or character gracefully', async () => {
    const input: RemoveCharacterFromSceneInput = {
      scene_id: 999,
      character_id: 999
    };

    const result = await removeCharacterFromScene(input);

    expect(result).toBe(false);
  });
});
