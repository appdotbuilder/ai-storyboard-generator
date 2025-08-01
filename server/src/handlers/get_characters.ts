
import { db } from '../db';
import { charactersTable } from '../db/schema';
import { type Character } from '../schema';

export async function getCharacters(): Promise<Character[]> {
  try {
    const result = await db.select()
      .from(charactersTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Get characters failed:', error);
    throw error;
  }
}
