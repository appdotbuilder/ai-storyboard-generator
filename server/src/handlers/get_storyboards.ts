
import { db } from '../db';
import { storyboardsTable } from '../db/schema';
import { type Storyboard } from '../schema';

export const getStoryboards = async (): Promise<Storyboard[]> => {
  try {
    const results = await db.select()
      .from(storyboardsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch storyboards:', error);
    throw error;
  }
};
