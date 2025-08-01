
import { db } from '../db';
import { scenesTable } from '../db/schema';
import { type UpdateSceneInput, type Scene } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const updateScene = async (input: UpdateSceneInput): Promise<Scene> => {
  try {
    // Build update data object with only provided fields
    const updateData: any = {
      updated_at: sql`NOW()` // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.location_id !== undefined) {
      updateData.location_id = input.location_id;
    }

    // Update scene record
    const result = await db.update(scenesTable)
      .set(updateData)
      .where(eq(scenesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Scene with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Scene update failed:', error);
    throw error;
  }
};
