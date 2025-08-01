
import { db } from '../db';
import { storyboardsTable, scenesTable, charactersTable, locationsTable, sceneCharactersTable } from '../db/schema';
import { type ExportStoryboardInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function exportStoryboard(input: ExportStoryboardInput): Promise<{ data: string; filename: string }> {
  try {
    // First, verify storyboard exists and get its details
    const storyboards = await db.select()
      .from(storyboardsTable)
      .where(eq(storyboardsTable.id, input.id))
      .execute();

    if (storyboards.length === 0) {
      throw new Error(`Storyboard with id ${input.id} not found`);
    }

    const storyboard = storyboards[0];

    // Get all scenes for this storyboard with location data
    const scenesWithLocations = await db.select()
      .from(scenesTable)
      .leftJoin(locationsTable, eq(scenesTable.location_id, locationsTable.id))
      .where(eq(scenesTable.storyboard_id, input.id))
      .execute();

    // Get all scene-character relationships for this storyboard's scenes
    const sceneIds = scenesWithLocations.map(result => result.scenes.id);
    
    let sceneCharacterData: any[] = [];
    if (sceneIds.length > 0) {
      sceneCharacterData = await db.select()
        .from(sceneCharactersTable)
        .innerJoin(charactersTable, eq(sceneCharactersTable.character_id, charactersTable.id))
        .execute();
    }

    // Build complete storyboard data structure
    const exportData = {
      storyboard: {
        id: storyboard.id,
        title: storyboard.title,
        initial_prompt: storyboard.initial_prompt,
        script_content: storyboard.script_content,
        status: storyboard.status,
        created_at: storyboard.created_at,
        updated_at: storyboard.updated_at
      },
      scenes: scenesWithLocations.map(result => ({
        id: result.scenes.id,
        sequence_number: result.scenes.sequence_number,
        title: result.scenes.title,
        description: result.scenes.description,
        location: result.locations ? {
          id: result.locations.id,
          name: result.locations.name,
          description: result.locations.description
        } : null,
        characters: sceneCharacterData
          .filter(scChar => scChar.scene_characters.scene_id === result.scenes.id)
          .map(scChar => ({
            id: scChar.characters.id,
            name: scChar.characters.name,
            description: scChar.characters.description
          })),
        created_at: result.scenes.created_at,
        updated_at: result.scenes.updated_at
      }))
    };

    // Generate export data based on format
    let data: string;
    let filename: string;

    switch (input.format) {
      case 'json':
        data = JSON.stringify(exportData, null, 2);
        filename = `storyboard_${input.id}.json`;
        break;

      case 'csv':
        // Create CSV with scenes as main rows
        const csvRows = [
          'Scene ID,Sequence,Title,Description,Location,Characters,Created At,Updated At'
        ];
        
        exportData.scenes.forEach(scene => {
          const locationName = scene.location ? scene.location.name : '';
          const characterNames = scene.characters.map(char => char.name).join('; ');
          
          csvRows.push([
            scene.id.toString(),
            scene.sequence_number.toString(),
            `"${scene.title.replace(/"/g, '""')}"`,
            `"${scene.description.replace(/"/g, '""')}"`,
            `"${locationName.replace(/"/g, '""')}"`,
            `"${characterNames.replace(/"/g, '""')}"`,
            scene.created_at.toISOString(),
            scene.updated_at.toISOString()
          ].join(','));
        });
        
        data = csvRows.join('\n');
        filename = `storyboard_${input.id}.csv`;
        break;

      case 'pdf':
        // Simple PDF-like text format (in a real implementation, you'd use a PDF library)
        const pdfLines = [
          `STORYBOARD: ${exportData.storyboard.title}`,
          `Created: ${exportData.storyboard.created_at.toISOString()}`,
          `Status: ${exportData.storyboard.status}`,
          ''
        ];

        if (exportData.storyboard.initial_prompt) {
          pdfLines.push(`Initial Prompt: ${exportData.storyboard.initial_prompt}`, '');
        }

        if (exportData.storyboard.script_content) {
          pdfLines.push(`Script Content: ${exportData.storyboard.script_content}`, '');
        }

        pdfLines.push('SCENES:', '');

        exportData.scenes.forEach(scene => {
          pdfLines.push(`Scene ${scene.sequence_number}: ${scene.title}`);
          pdfLines.push(`Description: ${scene.description}`);
          
          if (scene.location) {
            pdfLines.push(`Location: ${scene.location.name}`);
          }
          
          if (scene.characters.length > 0) {
            pdfLines.push(`Characters: ${scene.characters.map(char => char.name).join(', ')}`);
          }
          
          pdfLines.push('');
        });

        data = pdfLines.join('\n');
        filename = `storyboard_${input.id}.pdf`;
        break;

      default:
        throw new Error(`Unsupported export format: ${input.format}`);
    }

    // Update storyboard status to 'exported'
    await db.update(storyboardsTable)
      .set({ 
        status: 'exported',
        updated_at: new Date()
      })
      .where(eq(storyboardsTable.id, input.id))
      .execute();

    return { data, filename };

  } catch (error) {
    console.error('Storyboard export failed:', error);
    throw error;
  }
}
