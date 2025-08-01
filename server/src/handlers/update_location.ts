
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type UpdateLocationInput, type Location } from '../schema';
import { eq } from 'drizzle-orm';

export const updateLocation = async (input: UpdateLocationInput): Promise<Location> => {
  try {
    // Build update object with only defined fields
    const updateData: Partial<{
      name: string;
      description: string | null;
    }> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // If no fields to update, just return the existing location
    if (Object.keys(updateData).length === 0) {
      const existing = await db.select()
        .from(locationsTable)
        .where(eq(locationsTable.id, input.id))
        .execute();

      if (existing.length === 0) {
        throw new Error(`Location with id ${input.id} not found`);
      }

      return existing[0];
    }

    // Update the location
    const result = await db.update(locationsTable)
      .set(updateData)
      .where(eq(locationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Location with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Location update failed:', error);
    throw error;
  }
};
