
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storyboardsTable, scenesTable, charactersTable, locationsTable, sceneCharactersTable } from '../db/schema';
import { type ExportStoryboardInput } from '../schema';
import { exportStoryboard } from '../handlers/export_storyboard';
import { eq } from 'drizzle-orm';

describe('exportStoryboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export storyboard in JSON format', async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Test Storyboard',
        initial_prompt: 'A test story',
        status: 'completed'
      })
      .returning()
      .execute();

    // Create test location
    const location = await db.insert(locationsTable)
      .values({
        name: 'Test Location',
        description: 'A test location'
      })
      .returning()
      .execute();

    // Create test character
    const character = await db.insert(charactersTable)
      .values({
        name: 'Test Character',
        description: 'A test character'
      })
      .returning()
      .execute();

    // Create test scene
    const scene = await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Test Scene',
        description: 'A test scene',
        location_id: location[0].id
      })
      .returning()
      .execute();

    // Assign character to scene
    await db.insert(sceneCharactersTable)
      .values({
        scene_id: scene[0].id,
        character_id: character[0].id
      })
      .execute();

    const input: ExportStoryboardInput = {
      id: storyboard[0].id,
      format: 'json'
    };

    const result = await exportStoryboard(input);

    expect(result.filename).toEqual(`storyboard_${storyboard[0].id}.json`);
    
    const exportedData = JSON.parse(result.data);
    expect(exportedData.storyboard.title).toEqual('Test Storyboard');
    expect(exportedData.storyboard.initial_prompt).toEqual('A test story');
    expect(exportedData.scenes).toHaveLength(1);
    expect(exportedData.scenes[0].title).toEqual('Test Scene');
    expect(exportedData.scenes[0].location.name).toEqual('Test Location');
    expect(exportedData.scenes[0].characters).toHaveLength(1);
    expect(exportedData.scenes[0].characters[0].name).toEqual('Test Character');
  });

  it('should export storyboard in CSV format', async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'CSV Test Storyboard',
        status: 'completed'
      })
      .returning()
      .execute();

    // Create test scene without location or characters
    await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Simple Scene',
        description: 'A simple test scene'
      })
      .execute();

    const input: ExportStoryboardInput = {
      id: storyboard[0].id,
      format: 'csv'
    };

    const result = await exportStoryboard(input);

    expect(result.filename).toEqual(`storyboard_${storyboard[0].id}.csv`);
    
    const csvLines = result.data.split('\n');
    expect(csvLines[0]).toEqual('Scene ID,Sequence,Title,Description,Location,Characters,Created At,Updated At');
    expect(csvLines[1]).toContain('1,"Simple Scene","A simple test scene","",""');
    expect(csvLines).toHaveLength(2);
  });

  it('should export storyboard in PDF format', async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'PDF Test Storyboard',
        script_content: 'Test script content',
        status: 'completed'
      })
      .returning()
      .execute();

    // Create test scene
    await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'PDF Scene',
        description: 'A scene for PDF export'
      })
      .execute();

    const input: ExportStoryboardInput = {
      id: storyboard[0].id,
      format: 'pdf'
    };

    const result = await exportStoryboard(input);

    expect(result.filename).toEqual(`storyboard_${storyboard[0].id}.pdf`);
    expect(result.data).toContain('STORYBOARD: PDF Test Storyboard');
    expect(result.data).toContain('Script Content: Test script content');
    expect(result.data).toContain('Scene 1: PDF Scene');
    expect(result.data).toContain('Description: A scene for PDF export');
  });

  it('should update storyboard status to exported', async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Status Test Storyboard',
        status: 'completed'
      })
      .returning()
      .execute();

    const input: ExportStoryboardInput = {
      id: storyboard[0].id,
      format: 'json'
    };

    await exportStoryboard(input);

    // Verify status was updated
    const updatedStoryboard = await db.select()
      .from(storyboardsTable)
      .where(eq(storyboardsTable.id, storyboard[0].id))
      .execute();

    expect(updatedStoryboard[0].status).toEqual('exported');
    expect(updatedStoryboard[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle storyboard with no scenes', async () => {
    // Create test storyboard with no scenes
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Empty Storyboard',
        status: 'draft'
      })
      .returning()
      .execute();

    const input: ExportStoryboardInput = {
      id: storyboard[0].id,
      format: 'json'
    };

    const result = await exportStoryboard(input);
    const exportedData = JSON.parse(result.data);

    expect(exportedData.storyboard.title).toEqual('Empty Storyboard');
    expect(exportedData.scenes).toHaveLength(0);
  });

  it('should throw error for non-existent storyboard', async () => {
    const input: ExportStoryboardInput = {
      id: 999999,
      format: 'json'
    };

    expect(exportStoryboard(input)).rejects.toThrow(/not found/i);
  });

  it('should handle scenes with no location or characters', async () => {
    // Create test storyboard
    const storyboard = await db.insert(storyboardsTable)
      .values({
        title: 'Minimal Storyboard',
        status: 'completed'
      })
      .returning()
      .execute();

    // Create scene without location or characters
    await db.insert(scenesTable)
      .values({
        storyboard_id: storyboard[0].id,
        sequence_number: 1,
        title: 'Minimal Scene',
        description: 'Scene with no extras'
      })
      .execute();

    const input: ExportStoryboardInput = {
      id: storyboard[0].id,
      format: 'json'
    };

    const result = await exportStoryboard(input);
    const exportedData = JSON.parse(result.data);

    expect(exportedData.scenes[0].location).toBeNull();
    expect(exportedData.scenes[0].characters).toHaveLength(0);
  });
});
