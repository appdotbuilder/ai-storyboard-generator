
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { charactersTable, storyboardsTable, scenesTable, sceneCharactersTable } from '../db/schema';
import { getSceneCharacters } from '../handlers/get_scene_characters';

describe('getSceneCharacters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return characters assigned to a scene', async () => {
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
        description: 'A test scene'
      })
      .returning()
      .execute();

    // Create test characters
    const characters = await db.insert(charactersTable)
      .values([
        {
          name: 'Character One',
          description: 'First character'
        },
        {
          name: 'Character Two',
          description: 'Second character'
        }
      ])
      .returning()
      .execute();

    // Assign characters to scene
    await db.insert(sceneCharactersTable)
      .values([
        {
          scene_id: scene[0].id,
          character_id: characters[0].id
        },
        {
          scene_id: scene[0].id,
          character_id: characters[1].id
        }
      ])
      .execute();

    const result = await getSceneCharacters(scene[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Character One');
    expect(result[0].description).toEqual('First character');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[1].name).toEqual('Character Two');
    expect(result[1].description).toEqual('Second character');
  });

  it('should return empty array for scene with no characters', async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'Test prompt'
      })
      .returning()
      .execute();

    // Create test scene without characters
    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Empty Scene',
        description: 'A scene with no characters'
      })
      .returning()
      .execute();

    const result = await getSceneCharacters(scene[0].id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent scene', async () => {
    const result = await getSceneCharacters(999);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle characters with null descriptions', async () => {
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
        description: 'A test scene'
      })
      .returning()
      .execute();

    // Create character with null description
    const character = await db.insert(charactersTable)
      .values({
        name: 'Mysterious Character',
        description: null
      })
      .returning()
      .execute();

    // Assign character to scene
    await db.insert(sceneCharactersTable)
      .values({
        scene_id: scene[0].id,
        character_id: character[0].id
      })
      .execute();

    const result = await getSceneCharacters(scene[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Mysterious Character');
    expect(result[0].description).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
