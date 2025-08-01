
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createStoryboardInputSchema,
  updateStoryboardInputSchema,
  createSceneInputSchema,
  updateSceneInputSchema,
  createCharacterInputSchema,
  updateCharacterInputSchema,
  createLocationInputSchema,
  updateLocationInputSchema,
  assignCharacterToSceneInputSchema,
  removeCharacterFromSceneInputSchema,
  exportStoryboardInputSchema
} from './schema';

// Import handlers
import { createStoryboard } from './handlers/create_storyboard';
import { getStoryboards } from './handlers/get_storyboards';
import { getStoryboard } from './handlers/get_storyboard';
import { updateStoryboard } from './handlers/update_storyboard';
import { generateScenes } from './handlers/generate_scenes';
import { createScene } from './handlers/create_scene';
import { updateScene } from './handlers/update_scene';
import { getScenes } from './handlers/get_scenes';
import { createCharacter } from './handlers/create_character';
import { getCharacters } from './handlers/get_characters';
import { updateCharacter } from './handlers/update_character';
import { createLocation } from './handlers/create_location';
import { getLocations } from './handlers/get_locations';
import { updateLocation } from './handlers/update_location';
import { assignCharacterToScene } from './handlers/assign_character_to_scene';
import { removeCharacterFromScene } from './handlers/remove_character_from_scene';
import { getSceneCharacters } from './handlers/get_scene_characters';
import { exportStoryboard } from './handlers/export_storyboard';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Storyboard routes
  createStoryboard: publicProcedure
    .input(createStoryboardInputSchema)
    .mutation(({ input }) => createStoryboard(input)),
  
  getStoryboards: publicProcedure
    .query(() => getStoryboards()),
  
  getStoryboard: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getStoryboard(input.id)),
  
  updateStoryboard: publicProcedure
    .input(updateStoryboardInputSchema)
    .mutation(({ input }) => updateStoryboard(input)),
  
  generateScenes: publicProcedure
    .input(z.object({ storyboardId: z.number() }))
    .mutation(({ input }) => generateScenes(input.storyboardId)),

  // Scene routes
  createScene: publicProcedure
    .input(createSceneInputSchema)
    .mutation(({ input }) => createScene(input)),
  
  updateScene: publicProcedure
    .input(updateSceneInputSchema)
    .mutation(({ input }) => updateScene(input)),
  
  getScenes: publicProcedure
    .input(z.object({ storyboardId: z.number() }))
    .query(({ input }) => getScenes(input.storyboardId)),

  // Character routes
  createCharacter: publicProcedure
    .input(createCharacterInputSchema)
    .mutation(({ input }) => createCharacter(input)),
  
  getCharacters: publicProcedure
    .query(() => getCharacters()),
  
  updateCharacter: publicProcedure
    .input(updateCharacterInputSchema)
    .mutation(({ input }) => updateCharacter(input)),

  // Location routes
  createLocation: publicProcedure
    .input(createLocationInputSchema)
    .mutation(({ input }) => createLocation(input)),
  
  getLocations: publicProcedure
    .query(() => getLocations()),
  
  updateLocation: publicProcedure
    .input(updateLocationInputSchema)
    .mutation(({ input }) => updateLocation(input)),

  // Scene-Character relationship routes
  assignCharacterToScene: publicProcedure
    .input(assignCharacterToSceneInputSchema)
    .mutation(({ input }) => assignCharacterToScene(input)),
  
  removeCharacterFromScene: publicProcedure
    .input(removeCharacterFromSceneInputSchema)
    .mutation(({ input }) => removeCharacterFromScene(input)),
  
  getSceneCharacters: publicProcedure
    .input(z.object({ sceneId: z.number() }))
    .query(({ input }) => getSceneCharacters(input.sceneId)),

  // Export route
  exportStoryboard: publicProcedure
    .input(exportStoryboardInputSchema)
    .mutation(({ input }) => exportStoryboard(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
