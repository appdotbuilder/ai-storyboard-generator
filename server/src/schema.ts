
import { z } from 'zod';

// Character schema
export const characterSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Character = z.infer<typeof characterSchema>;

// Location schema
export const locationSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Location = z.infer<typeof locationSchema>;

// Storyboard schema
export const storyboardSchema = z.object({
  id: z.number(),
  title: z.string(),
  initial_prompt: z.string().nullable(),
  script_content: z.string().nullable(),
  status: z.enum(['draft', 'generating', 'completed', 'exported']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Storyboard = z.infer<typeof storyboardSchema>;

// Scene schema
export const sceneSchema = z.object({
  id: z.number(),
  storyboard_id: z.number(),
  sequence_number: z.number().int(),
  title: z.string(),
  description: z.string(),
  location_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Scene = z.infer<typeof sceneSchema>;

// Scene Character relationship schema
export const sceneCharacterSchema = z.object({
  id: z.number(),
  scene_id: z.number(),
  character_id: z.number(),
  created_at: z.coerce.date()
});

export type SceneCharacter = z.infer<typeof sceneCharacterSchema>;

// Input schemas for creating entities
export const createStoryboardInputSchema = z.object({
  title: z.string(),
  initial_prompt: z.string().nullable(),
  script_content: z.string().nullable()
}).refine((data) => data.initial_prompt !== null || data.script_content !== null, {
  message: "Either initial_prompt or script_content must be provided"
});

export type CreateStoryboardInput = z.infer<typeof createStoryboardInputSchema>;

export const createSceneInputSchema = z.object({
  storyboard_id: z.number(),
  sequence_number: z.number().int().nonnegative(),
  title: z.string(),
  description: z.string(),
  location_id: z.number().nullable()
});

export type CreateSceneInput = z.infer<typeof createSceneInputSchema>;

export const createCharacterInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable()
});

export type CreateCharacterInput = z.infer<typeof createCharacterInputSchema>;

export const createLocationInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable()
});

export type CreateLocationInput = z.infer<typeof createLocationInputSchema>;

// Update schemas
export const updateStoryboardInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  status: z.enum(['draft', 'generating', 'completed', 'exported']).optional()
});

export type UpdateStoryboardInput = z.infer<typeof updateStoryboardInputSchema>;

export const updateSceneInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  location_id: z.number().nullable().optional()
});

export type UpdateSceneInput = z.infer<typeof updateSceneInputSchema>;

export const updateCharacterInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional()
});

export type UpdateCharacterInput = z.infer<typeof updateCharacterInputSchema>;

export const updateLocationInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional()
});

export type UpdateLocationInput = z.infer<typeof updateLocationInputSchema>;

// Scene character assignment schemas
export const assignCharacterToSceneInputSchema = z.object({
  scene_id: z.number(),
  character_id: z.number()
});

export type AssignCharacterToSceneInput = z.infer<typeof assignCharacterToSceneInputSchema>;

export const removeCharacterFromSceneInputSchema = z.object({
  scene_id: z.number(),
  character_id: z.number()
});

export type RemoveCharacterFromSceneInput = z.infer<typeof removeCharacterFromSceneInputSchema>;

// Export storyboard schema
export const exportStoryboardInputSchema = z.object({
  id: z.number(),
  format: z.enum(['json', 'pdf', 'csv'])
});

export type ExportStoryboardInput = z.infer<typeof exportStoryboardInputSchema>;
