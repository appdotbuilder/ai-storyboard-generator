
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storyboardsTable, scenesTable } from '../db/schema';
import { generateScenes } from '../handlers/generate_scenes';
import { eq } from 'drizzle-orm';

describe('generateScenes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate scenes from initial_prompt', async () => {
    // Create test storyboard with initial_prompt
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'A hero faces a great challenge and must overcome conflict to save the day',
        script_content: null,
        status: 'draft'
      })
      .returning()
      .execute();

    const result = await generateScenes(storyboard[0].id);

    // Should return generated scenes
    expect(result.length).toBeGreaterThan(0);
    
    // Verify scene properties
    result.forEach((scene, index) => {
      expect(scene.id).toBeDefined();
      expect(scene.storyboard_id).toEqual(storyboard[0].id);
      expect(scene.sequence_number).toEqual(index + 1);
      expect(scene.title).toBeDefined();
      expect(scene.description).toBeDefined();
      expect(scene.created_at).toBeInstanceOf(Date);
      expect(scene.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should generate scenes from script_content', async () => {
    // Create test storyboard with script_content
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Script Storyboard',
        initial_prompt: null,
        script_content: 'INT. OFFICE - DAY\nAction sequence begins with protagonist entering the building.',
        status: 'draft'
      })
      .returning()
      .execute();

    const result = await generateScenes(storyboard[0].id);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].storyboard_id).toEqual(storyboard[0].id);
    expect(result[0].sequence_number).toEqual(1);
  });

  it('should update storyboard status to completed', async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Status Test Storyboard',
        initial_prompt: 'Simple story prompt',
        script_content: null,
        status: 'draft'
      })
      .returning()
      .execute();

    await generateScenes(storyboard[0].id);

    // Check that storyboard status was updated
    const updatedStoryboards = await db.select()
      .from(storyboardsTable)
      .where(eq(storyboardsTable.id, storyboard[0].id))
      .execute();

    expect(updatedStoryboards[0].status).toEqual('completed');
    expect(updatedStoryboards[0].updated_at).toBeInstanceOf(Date);
    expect(updatedStoryboards[0].updated_at.getTime()).toBeGreaterThan(storyboard[0].updated_at.getTime());
  });

  it('should save scenes to database', async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Database Test',
        initial_prompt: 'Test prompt for database verification',
        script_content: null,
        status: 'draft'
      })
      .returning()
      .execute();

    const result = await generateScenes(storyboard[0].id);

    // Verify scenes were saved to database
    const savedScenes = await db.select()
      .from(scenesTable)
      .where(eq(scenesTable.storyboard_id, storyboard[0].id))
      .execute();

    expect(savedScenes.length).toEqual(result.length);
    expect(savedScenes.length).toBeGreaterThan(0);

    // Verify scene order
    savedScenes.forEach((scene, index) => {
      expect(scene.sequence_number).toEqual(index + 1);
      expect(scene.storyboard_id).toEqual(storyboard[0].id);
    });
  });

  it('should throw error for non-existent storyboard', async () => {
    await expect(generateScenes(999)).rejects.toThrow(/not found/i);
  });

  it('should throw error for storyboard without content', async () => {
    // Create storyboard without prompt or script
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Empty Storyboard',
        initial_prompt: null,
        script_content: null,
        status: 'draft'
      })
      .returning()
      .execute();

    await expect(generateScenes(storyboard[0].id)).rejects.toThrow(/must have either initial_prompt or script_content/i);
  });

  it('should generate different scenes based on content keywords', async () => {
    // Create storyboard with action keywords
    const actionStoryboard = await db.insert(storyboardsTable)
      .values({
        title: 'Action Story',
        initial_prompt: 'Epic action movie with fight scenes and heroic protagonist',
        script_content: null,
        status: 'draft'
      })
      .returning()
      .execute();

    const actionScenes = await generateScenes(actionStoryboard[0].id);

    // Should contain action-related scenes
    const actionTitles = actionScenes.map(scene => scene.title.toLowerCase());
    const hasActionContent = actionTitles.some(title => 
      title.includes('action') || title.includes('character') || title.includes('conflict')
    );
    expect(hasActionContent).toBe(true);
  });

  it('should handle database errors gracefully', async () => {
    // Create a storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Error Test',
        initial_prompt: 'Test prompt',
        script_content: null,
        status: 'draft'
      })
      .returning()
      .execute();

    // Test with an invalid storyboard ID to trigger error handling
    await expect(generateScenes(storyboard[0].id + 999)).rejects.toThrow(/not found/i);

    // Verify original storyboard is still in draft status (unchanged)
    const originalStoryboard = await db.select()
      .from(storyboardsTable)
      .where(eq(storyboardsTable.id, storyboard[0].id))
      .execute();

    expect(originalStoryboard[0].status).toEqual('draft');
  });
});
