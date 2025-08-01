
import { db } from '../db';
import { charactersTable } from '../db/schema';
import { type CreateCharacterInput, type Character } from '../schema';

export const createCharacter = async (input: CreateCharacterInput): Promise<Character> => {
  try {
    // Insert character record
    const result = await db.insert(charactersTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    // Return the created character
    const character = result[0];
    return character;
  } catch (error) {
    console.error('Character creation failed:', error);
    throw error;
  }
};
