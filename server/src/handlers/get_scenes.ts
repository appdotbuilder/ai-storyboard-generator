
import { db } from '../db';
import { scenesTable } from '../db/schema';
import { type Scene } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getScenes(storyboardId: number): Promise<Scene[]> {
  try {
    const results = await db.select()
      .from(scenesTable)
      .where(eq(scenesTable.storyboard_id, storyboardId))
      .orderBy(asc(scenesTable.sequence_number))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get scenes:', error);
    throw error;
  }
}
