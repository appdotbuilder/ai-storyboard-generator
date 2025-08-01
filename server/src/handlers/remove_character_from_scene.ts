
import { db } from '../db';
import { sceneCharactersTable } from '../db/schema';
import { type RemoveCharacterFromSceneInput } from '../schema';
import { and, eq } from 'drizzle-orm';

export async function removeCharacterFromScene(input: RemoveCharacterFromSceneInput): Promise<boolean> {
  try {
    // Remove the relationship between scene and character
    const result = await db.delete(sceneCharactersTable)
      .where(
        and(
          eq(sceneCharactersTable.scene_id, input.scene_id),
          eq(sceneCharactersTable.character_id, input.character_id)
        )
      )
      .execute();

    // Return true if at least one record was deleted, false otherwise
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Remove character from scene failed:', error);
    throw error;
  }
}
