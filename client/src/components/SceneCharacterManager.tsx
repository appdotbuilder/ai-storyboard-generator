
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { Users, Plus, X } from 'lucide-react';
import type { Scene, Character } from '../../../server/src/schema';

interface SceneCharacterManagerProps {
  scene: Scene;
  allCharacters: Character[];
}

export function SceneCharacterManager({ scene, allCharacters }: SceneCharacterManagerProps) {
  const [sceneCharacters, setSceneCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const loadSceneCharacters = useCallback(async () => {
    try {
      const characters = await trpc.getSceneCharacters.query({ sceneId: scene.id });
      setSceneCharacters(characters);
    } catch (error) {
      console.error('Failed to load scene characters:', error);
    }
  }, [scene.id]);

  useEffect(() => {
    loadSceneCharacters();
  }, [loadSceneCharacters]);

  const handleAssignCharacter = async () => {
    if (!selectedCharacterId) return;

    setIsLoading(true);
    try {
      await trpc.assignCharacterToScene.mutate({
        scene_id: scene.id,
        character_id: parseInt(selectedCharacterId)
      });
      await loadSceneCharacters();
      setSelectedCharacterId('');
    } catch (error) {
      console.error('Failed to assign character to scene:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCharacter = async (characterId: number) => {
    setIsLoading(true);
    try {
      await trpc.removeCharacterFromScene.mutate({
        scene_id: scene.id,
        character_id: characterId
      });
      await loadSceneCharacters();
    } catch (error) {
      console.error('Failed to remove character from scene:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const availableCharacters = allCharacters.filter((char: Character) =>
    !sceneCharacters.some((sceneChar: Character) => sceneChar.id === char.id)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Users className="w-4 h-4" />
        Characters in this scene
      </div>

      {sceneCharacters.length === 0 ? (
        <p className="text-sm text-gray-500">No characters assigned to this scene yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sceneCharacters.map((character: Character) => (
            <Badge
              key={character.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {character.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-red-100"
                onClick={() => handleRemoveCharacter(character.id)}
                disabled={isLoading}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {availableCharacters.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            value={selectedCharacterId}
            onValueChange={setSelectedCharacterId}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Add character..." />
            </SelectTrigger>
            <SelectContent>
              {availableCharacters.map((character: Character) => (
                <SelectItem key={character.id} value={character.id.toString()}>
                  {character.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAssignCharacter}
            disabled={!selectedCharacterId || isLoading}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
