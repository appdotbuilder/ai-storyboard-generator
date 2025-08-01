
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storyboardsTable } from '../db/schema';
import { getStoryboard } from '../handlers/get_storyboard';

describe('getStoryboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a storyboard by id', async () => {
    // Create test storyboard
    const insertResult = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'A test prompt',
        script_content: null,
        status: 'draft'
      })
      .returning()
      .execute();

    const createdStoryboard = insertResult[0];

    // Test the handler
    const result = await getStoryboard(createdStoryboard.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdStoryboard.id);
    expect(result!.title).toBe('Test Storyboard');
    expect(result!.initial_prompt).toBe('A test prompt');
    expect(result!.script_content).toBeNull();
    expect(result!.status).toBe('draft');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent storyboard', async () => {
    const result = await getStoryboard(999);
    expect(result).toBeNull();
  });

  it('should return storyboard with script content when provided', async () => {
    // Create storyboard with script content instead of initial prompt
    const insertResult = await db.insert(storyboardsTable)
      .values({
        title: 'Script Storyboard',
        initial_prompt: null,
        script_content: 'FADE IN: A test script',
        status: 'completed'
      })
      .returning()
      .execute();

    const createdStoryboard = insertResult[0];

    const result = await getStoryboard(createdStoryboard.id);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Script Storyboard');
    expect(result!.initial_prompt).toBeNull();
    expect(result!.script_content).toBe('FADE IN: A test script');
    expect(result!.status).toBe('completed');
  });

  it('should return storyboard with generating status', async () => {
    const insertResult = await db.insert(storyboardsTable)
      .values({
        title: 'Generating Storyboard',
        initial_prompt: 'A generating prompt',
        script_content: null,
        status: 'generating'
      })
      .returning()
      .execute();

    const createdStoryboard = insertResult[0];

    const result = await getStoryboard(createdStoryboard.id);

    expect(result).not.toBeNull();
    expect(result!.status).toBe('generating');
    expect(result!.title).toBe('Generating Storyboard');
  });
});
