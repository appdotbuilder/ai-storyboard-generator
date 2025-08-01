
import { db } from '../db';
import { sceneCharactersTable, charactersTable } from '../db/schema';
import { type Character } from '../schema';
import { eq } from 'drizzle-orm';

export async function getSceneCharacters(sceneId: number): Promise<Character[]> {
  try {
    // Join scene_characters with characters to get character data for the scene
    const results = await db.select()
      .from(sceneCharactersTable)
      .innerJoin(charactersTable, eq(sceneCharactersTable.character_id, charactersTable.id))
      .where(eq(sceneCharactersTable.scene_id, sceneId))
      .execute();

    // Extract character data from the joined results
    return results.map(result => ({
      id: result.characters.id,
      name: result.characters.name,
      description: result.characters.description,
      created_at: result.characters.created_at
    }));
  } catch (error) {
    console.error('Failed to get scene characters:', error);
    throw error;
  }
}
