
import { db } from '../db';
import { storyboardsTable, scenesTable } from '../db/schema';
import { type Scene } from '../schema';
import { eq } from 'drizzle-orm';

export async function generateScenes(storyboardId: number): Promise<Scene[]> {
  try {
    // First, verify the storyboard exists and get its content
    const storyboards = await db.select()
      .from(storyboardsTable)
      .where(eq(storyboardsTable.id, storyboardId))
      .execute();

    if (storyboards.length === 0) {
      throw new Error(`Storyboard with id ${storyboardId} not found`);
    }

    const storyboard = storyboards[0];

    // Check if we have content to work with
    if (!storyboard.initial_prompt && !storyboard.script_content) {
      throw new Error('Storyboard must have either initial_prompt or script_content to generate scenes');
    }

    // Update storyboard status to 'generating'
    await db.update(storyboardsTable)
      .set({ 
        status: 'generating',
        updated_at: new Date()
      })
      .where(eq(storyboardsTable.id, storyboardId))
      .execute();

    // Generate scenes based on available content
    // In a real implementation, this would use AI to analyze the prompt/script
    // For now, we'll create a basic set of scenes
    const scenesToCreate = generateSceneData(storyboard.initial_prompt, storyboard.script_content);

    // Insert the generated scenes
    const insertedScenes = await db.insert(scenesTable)
      .values(
        scenesToCreate.map((scene, index) => ({
          storyboard_id: storyboardId,
          sequence_number: index + 1,
          title: scene.title,
          description: scene.description,
          location_id: null // Will be set later when locations are assigned
        }))
      )
      .returning()
      .execute();

    // Update storyboard status to 'completed'
    await db.update(storyboardsTable)
      .set({ 
        status: 'completed',
        updated_at: new Date()
      })
      .where(eq(storyboardsTable.id, storyboardId))
      .execute();

    return insertedScenes;
  } catch (error) {
    console.error('Scene generation failed:', error);
    
    // If there was an error, revert storyboard status to 'draft'
    try {
      await db.update(storyboardsTable)
        .set({ 
          status: 'draft',
          updated_at: new Date()
        })
        .where(eq(storyboardsTable.id, storyboardId))
        .execute();
    } catch (revertError) {
      console.error('Failed to revert storyboard status:', revertError);
    }
    
    throw error;
  }
}

// Helper function to generate scene data based on content
// In a real implementation, this would use AI
function generateSceneData(initialPrompt: string | null, scriptContent: string | null): Array<{ title: string; description: string }> {
  const content = scriptContent || initialPrompt || '';
  
  // Basic scene generation based on content length and keywords
  const scenes = [];
  
  if (content.toLowerCase().includes('action') || content.toLowerCase().includes('fight')) {
    scenes.push({
      title: 'Opening Action Sequence',
      description: 'High-energy opening scene that establishes the tone and introduces key elements'
    });
  }

  if (content.toLowerCase().includes('character') || content.toLowerCase().includes('hero') || content.toLowerCase().includes('protagonist')) {
    scenes.push({
      title: 'Character Introduction',
      description: 'Scene introducing the main character and establishing their motivation'
    });
  }

  if (content.toLowerCase().includes('conflict') || content.toLowerCase().includes('problem') || content.toLowerCase().includes('challenge')) {
    scenes.push({
      title: 'Rising Conflict',
      description: 'Scene where the main conflict is established and stakes are raised'
    });
  }

  if (content.toLowerCase().includes('climax') || content.toLowerCase().includes('final') || content.toLowerCase().includes('showdown')) {
    scenes.push({
      title: 'Climactic Confrontation',
      description: 'The main conflict reaches its peak and resolution begins'
    });
  }

  // If no specific keywords found, create generic scenes
  if (scenes.length === 0) {
    scenes.push(
      {
        title: 'Opening Scene',
        description: 'Establishes setting and introduces key story elements'
      },
      {
        title: 'Development',
        description: 'Story develops and characters are further established'
      },
      {
        title: 'Resolution',
        description: 'Story conflicts are resolved and conclusion is reached'
      }
    );
  }

  return scenes;
}
