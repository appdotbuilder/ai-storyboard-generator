
import { db } from '../db';
import { storyboardsTable } from '../db/schema';
import { type CreateStoryboardInput, type Storyboard } from '../schema';

export const createStoryboard = async (input: CreateStoryboardInput): Promise<Storyboard> => {
  try {
    // Insert storyboard record
    const result = await db.insert(storyboardsTable)
      .values({
        title: input.title,
        initial_prompt: input.initial_prompt,
        script_content: input.script_content,
        status: 'draft' // Default status
      })
      .returning()
      .execute();

    const storyboard = result[0];
    return storyboard;
  } catch (error) {
    console.error('Storyboard creation failed:', error);
    throw error;
  }
};
