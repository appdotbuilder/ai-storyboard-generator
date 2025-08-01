
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storyboardsTable } from '../db/schema';
import { type CreateStoryboardInput } from '../schema';
import { getStoryboards } from '../handlers/get_storyboards';

describe('getStoryboards', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no storyboards exist', async () => {
    const result = await getStoryboards();

    expect(result).toEqual([]);
  });

  it('should return all storyboards', async () => {
    // Create test storyboards
    const storyboard1 = await db.insert(storyboardsTable)
      .values({
        title: 'First Storyboard',
        initial_prompt: 'A story about adventure',
        script_content: null,
        status: 'draft'
      })
      .returning()
      .execute();

    const storyboard2 = await db.insert(storyboardsTable)
      .values({
        title: 'Second Storyboard',
        initial_prompt: null,
        script_content: 'Script content here',
        status: 'completed'
      })
      .returning()
      .execute();

    const result = await getStoryboards();

    expect(result).toHaveLength(2);
    
    // Verify first storyboard
    const first = result.find(s => s.title === 'First Storyboard');
    expect(first).toBeDefined();
    expect(first!.initial_prompt).toEqual('A story about adventure');
    expect(first!.script_content).toBeNull();
    expect(first!.status).toEqual('draft');
    expect(first!.id).toBeDefined();
    expect(first!.created_at).toBeInstanceOf(Date);
    expect(first!.updated_at).toBeInstanceOf(Date);

    // Verify second storyboard
    const second = result.find(s => s.title === 'Second Storyboard');
    expect(second).toBeDefined();
    expect(second!.initial_prompt).toBeNull();
    expect(second!.script_content).toEqual('Script content here');
    expect(second!.status).toEqual('completed');
    expect(second!.id).toBeDefined();
    expect(second!.created_at).toBeInstanceOf(Date);
    expect(second!.updated_at).toBeInstanceOf(Date);
  });

  it('should return storyboards with different statuses', async () => {
    // Create storyboards with all possible statuses
    await db.insert(storyboardsTable)
      .values([
        {
          title: 'Draft Storyboard',
          initial_prompt: 'Draft prompt',
          status: 'draft'
        },
        {
          title: 'Generating Storyboard',
          initial_prompt: 'Generating prompt',
          status: 'generating'
        },
        {
          title: 'Completed Storyboard',
          initial_prompt: 'Completed prompt',
          status: 'completed'
        },
        {
          title: 'Exported Storyboard',
          initial_prompt: 'Exported prompt',
          status: 'exported'
        }
      ])
      .execute();

    const result = await getStoryboards();

    expect(result).toHaveLength(4);
    
    const statuses = result.map(s => s.status);
    expect(statuses).toContain('draft');
    expect(statuses).toContain('generating');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('exported');
  });
});
