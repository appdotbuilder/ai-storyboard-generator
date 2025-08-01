
import { db } from '../db';
import { sceneCharactersTable, scenesTable, charactersTable } from '../db/schema';
import { type AssignCharacterToSceneInput, type SceneCharacter } from '../schema';
import { eq, and } from 'drizzle-orm';

export const assignCharacterToScene = async (input: AssignCharacterToSceneInput): Promise<SceneCharacter> => {
  try {
    // Verify scene exists
    const scene = await db.select()
      .from(scenesTable)
      .where(eq(scenesTable.id, input.scene_id))
      .execute();

    if (scene.length === 0) {
      throw new Error(`Scene with id ${input.scene_id} not found`);
    }

    // Verify character exists
    const character = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, input.character_id))
      .execute();

    if (character.length === 0) {
      throw new Error(`Character with id ${input.character_id} not found`);
    }

    // Check if relationship already exists
    const existingRelationship = await db.select()
      .from(sceneCharactersTable)
      .where(and(
        eq(sceneCharactersTable.scene_id, input.scene_id),
        eq(sceneCharactersTable.character_id, input.character_id)
      ))
      .execute();

    if (existingRelationship.length > 0) {
      throw new Error(`Character ${input.character_id} is already assigned to scene ${input.scene_id}`);
    }

    // Create the relationship
    const result = await db.insert(sceneCharactersTable)
      .values({
        scene_id: input.scene_id,
        character_id: input.character_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Character assignment to scene failed:', error);
    throw error;
  }
};
