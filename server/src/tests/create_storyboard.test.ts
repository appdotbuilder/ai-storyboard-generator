
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storyboardsTable } from '../db/schema';
import { type CreateStoryboardInput } from '../schema';
import { createStoryboard } from '../handlers/create_storyboard';
import { eq } from 'drizzle-orm';

// Test input with initial_prompt
const testInputWithPrompt: CreateStoryboardInput = {
  title: 'Test Storyboard',
  initial_prompt: 'A story about adventure',
  script_content: null
};

// Test input with script_content
const testInputWithScript: CreateStoryboardInput = {
  title: 'Script-based Storyboard',
  initial_prompt: null,
  script_content: 'FADE IN:\nINT. LIVING ROOM - DAY\nJohn sits reading.'
};

// Test input with both
const testInputWithBoth: CreateStoryboardInput = {
  title: 'Complete Storyboard',
  initial_prompt: 'A dramatic story',
  script_content: 'FADE IN:\nINT. KITCHEN - MORNING'
};

describe('createStoryboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a storyboard with initial prompt', async () => {
    const result = await createStoryboard(testInputWithPrompt);

    // Basic field validation
    expect(result.title).toEqual('Test Storyboard');
    expect(result.initial_prompt).toEqual('A story about adventure');
    expect(result.script_content).toBeNull();
    expect(result.status).toEqual('draft');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a storyboard with script content', async () => {
    const result = await createStoryboard(testInputWithScript);

    // Basic field validation
    expect(result.title).toEqual('Script-based Storyboard');
    expect(result.initial_prompt).toBeNull();
    expect(result.script_content).toEqual('FADE IN:\nINT. LIVING ROOM - DAY\nJohn sits reading.');
    expect(result.status).toEqual('draft');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a storyboard with both prompt and script', async () => {
    const result = await createStoryboard(testInputWithBoth);

    // Basic field validation
    expect(result.title).toEqual('Complete Storyboard');
    expect(result.initial_prompt).toEqual('A dramatic story');
    expect(result.script_content).toEqual('FADE IN:\nINT. KITCHEN - MORNING');
    expect(result.status).toEqual('draft');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save storyboard to database', async () => {
    const result = await createStoryboard(testInputWithPrompt);

    // Query using proper drizzle syntax
    const storyboards = await db.select()
      .from(storyboardsTable)
      .where(eq(storyboardsTable.id, result.id))
      .execute();

    expect(storyboards).toHaveLength(1);
    expect(storyboards[0].title).toEqual('Test Storyboard');
    expect(storyboards[0].initial_prompt).toEqual('A story about adventure');
    expect(storyboards[0].script_content).toBeNull();
    expect(storyboards[0].status).toEqual('draft');
    expect(storyboards[0].created_at).toBeInstanceOf(Date);
    expect(storyboards[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set default status to draft', async () => {
    const result = await createStoryboard(testInputWithPrompt);

    expect(result.status).toEqual('draft');

    // Verify in database
    const storyboards = await db.select()
      .from(storyboardsTable)
      .where(eq(storyboardsTable.id, result.id))
      .execute();

    expect(storyboards[0].status).toEqual('draft');
  });

  it('should handle multiple storyboard creation', async () => {
    const result1 = await createStoryboard(testInputWithPrompt);
    const result2 = await createStoryboard(testInputWithScript);

    // Different IDs
    expect(result1.id).not.toEqual(result2.id);

    // Both exist in database
    const allStoryboards = await db.select()
      .from(storyboardsTable)
      .execute();

    expect(allStoryboards).toHaveLength(2);
    
    const titles = allStoryboards.map(s => s.title);
    expect(titles).toContain('Test Storyboard');
    expect(titles).toContain('Script-based Storyboard');
  });
});
