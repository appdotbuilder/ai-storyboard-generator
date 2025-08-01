
import { db } from '../db';
import { storyboardsTable } from '../db/schema';
import { type UpdateStoryboardInput, type Storyboard } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const updateStoryboard = async (input: UpdateStoryboardInput): Promise<Storyboard> => {
  try {
    // Build the update object dynamically based on provided fields
    const updateData: any = {
      updated_at: sql`now()` // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update the storyboard record
    const result = await db.update(storyboardsTable)
      .set(updateData)
      .where(eq(storyboardsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Storyboard with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Storyboard update failed:', error);
    throw error;
  }
};
