
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storyboardsTable } from '../db/schema';
import { type CreateStoryboardInput, type UpdateStoryboardInput } from '../schema';
import { updateStoryboard } from '../handlers/update_storyboard';
import { eq } from 'drizzle-orm';

// Test inputs
const createInput: CreateStoryboardInput = {
  title: 'Original Title',
  initial_prompt: 'A story about adventure',
  script_content: null
};

const updateTitleInput: UpdateStoryboardInput = {
  id: 1,
  title: 'Updated Title'
};

const updateStatusInput: UpdateStoryboardInput = {
  id: 1,
  status: 'completed'
};

const updateBothInput: UpdateStoryboardInput = {
  id: 1,
  title: 'New Title',
  status: 'exported'
};

describe('updateStoryboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update storyboard title', async () => {
    // Create initial storyboard
    const created = await db.insert(storyboardsTable)
      .values({
        title: createInput.title,
        initial_prompt: createInput.initial_prompt,
        script_content: createInput.script_content
      })
      .returning()
      .execute();

    const storyboardId = created[0].id;

    // Update the title
    const result = await updateStoryboard({
      id: storyboardId,
      title: 'Updated Title'
    });

    // Verify updated fields
    expect(result.title).toEqual('Updated Title');
    expect(result.id).toEqual(storyboardId);
    expect(result.status).toEqual('draft'); // Should remain unchanged
    expect(result.initial_prompt).toEqual('A story about adventure');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update storyboard status', async () => {
    // Create initial storyboard
    const created = await db.insert(storyboardsTable)
      .values({
        title: createInput.title,
        initial_prompt: createInput.initial_prompt,
        script_content: createInput.script_content
      })
      .returning()
      .execute();

    const storyboardId = created[0].id;

    // Update the status
    const result = await updateStoryboard({
      id: storyboardId,
      status: 'completed'
    });

    // Verify updated fields
    expect(result.status).toEqual('completed');
    expect(result.id).toEqual(storyboardId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.initial_prompt).toEqual('A story about adventure');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both title and status', async () => {
    // Create initial storyboard
    const created = await db.insert(storyboardsTable)
      .values({
        title: createInput.title,
        initial_prompt: createInput.initial_prompt,
        script_content: createInput.script_content
      })
      .returning()
      .execute();

    const storyboardId = created[0].id;

    // Update both fields
    const result = await updateStoryboard({
      id: storyboardId,
      title: 'New Title',
      status: 'exported'
    });

    // Verify updated fields
    expect(result.title).toEqual('New Title');
    expect(result.status).toEqual('exported');
    expect(result.id).toEqual(storyboardId);
    expect(result.initial_prompt).toEqual('A story about adventure');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Create initial storyboard
    const created = await db.insert(storyboardsTable)
      .values({
        title: createInput.title,
        initial_prompt: createInput.initial_prompt,
        script_content: createInput.script_content
      })
      .returning()
      .execute();

    const originalUpdatedAt = created[0].updated_at;
    const storyboardId = created[0].id;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the storyboard
    const result = await updateStoryboard({
      id: storyboardId,
      title: 'Updated Title'
    });

    // Verify updated_at was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should save changes to database', async () => {
    // Create initial storyboard
    const created = await db.insert(storyboardsTable)
      .values({
        title: createInput.title,
        initial_prompt: createInput.initial_prompt,
        script_content: createInput.script_content
      })
      .returning()
      .execute();

    const storyboardId = created[0].id;

    // Update the storyboard
    await updateStoryboard({
      id: storyboardId,
      title: 'Database Update Test',
      status: 'generating'
    });

    // Query database to verify changes were persisted
    const storyboards = await db.select()
      .from(storyboardsTable)
      .where(eq(storyboardsTable.id, storyboardId))
      .execute();

    expect(storyboards).toHaveLength(1);
    expect(storyboards[0].title).toEqual('Database Update Test');
    expect(storyboards[0].status).toEqual('generating');
    expect(storyboards[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent storyboard', async () => {
    await expect(updateStoryboard({
      id: 999,
      title: 'Non-existent'
    })).rejects.toThrow(/not found/i);
  });
});
