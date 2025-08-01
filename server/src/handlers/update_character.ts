
import { db } from '../db';
import { charactersTable } from '../db/schema';
import { type UpdateCharacterInput, type Character } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCharacter = async (input: UpdateCharacterInput): Promise<Character> => {
  try {
    // Build update object with only provided fields
    const updateData: { name?: string; description?: string | null } = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // If no fields to update, just return the existing character
    if (Object.keys(updateData).length === 0) {
      const existing = await db.select()
        .from(charactersTable)
        .where(eq(charactersTable.id, input.id))
        .execute();

      if (existing.length === 0) {
        throw new Error(`Character with id ${input.id} not found`);
      }

      return existing[0];
    }

    // Update character record
    const result = await db.update(charactersTable)
      .set(updateData)
      .where(eq(charactersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Character with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Character update failed:', error);
    throw error;
  }
};
