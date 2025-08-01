
import { db } from '../db';
import { scenesTable, storyboardsTable, locationsTable } from '../db/schema';
import { type CreateSceneInput, type Scene } from '../schema';
import { eq } from 'drizzle-orm';

export const createScene = async (input: CreateSceneInput): Promise<Scene> => {
  try {
    // Verify storyboard exists
    const storyboards = await db.select()
      .from(storyboardsTable)
      .where(eq(storyboardsTable.id, input.storyboard_id))
      .execute();

    if (storyboards.length === 0) {
      throw new Error(`Storyboard with id ${input.storyboard_id} not found`);
    }

    // Verify location exists if provided
    if (input.location_id !== null) {
      const locations = await db.select()
        .from(locationsTable)
        .where(eq(locationsTable.id, input.location_id))
        .execute();

      if (locations.length === 0) {
        throw new Error(`Location with id ${input.location_id} not found`);
      }
    }

    // Insert scene record
    const result = await db.insert(scenesTable)
      .values({
        storyboard_id: input.storyboard_id,
        sequence_number: input.sequence_number,
        title: input.title,
        description: input.description,
        location_id: input.location_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Scene creation failed:', error);
    throw error;
  }
};
