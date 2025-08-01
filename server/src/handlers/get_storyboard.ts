
import { db } from '../db';
import { storyboardsTable } from '../db/schema';
import { type Storyboard } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStoryboard(id: number): Promise<Storyboard | null> {
  try {
    const results = await db.select()
      .from(storyboardsTable)
      .where(eq(storyboardsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Failed to get storyboard:', error);
    throw error;
  }
}
