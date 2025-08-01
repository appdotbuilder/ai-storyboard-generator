
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { Users, Plus, Edit, User } from 'lucide-react';
import type { Character, CreateCharacterInput, UpdateCharacterInput } from '../../../server/src/schema';

interface CharacterManagerProps {
  characters: Character[];
  onCharacterCreated: (character: Character) => void;
  onCharacterUpdated: (character: Character) => void;
}

export function CharacterManager({ 
  characters, 
  onCharacterCreated, 
  onCharacterUpdated 
}: CharacterManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateCharacterInput>({
    name: '',
    description: null
  });

  const [editFormData, setEditFormData] = useState<UpdateCharacterInput>({
    id: 0,
    name: '',
    description: null
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name.trim()) return;

    setIsLoading(true);
    try {
      const character = await trpc.createCharacter.mutate(createFormData);
      onCharacterCreated(character);
      setCreateFormData({ name: '', description: null });
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create character:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name?.trim()) return;

    setIsLoading(true);
    try {
      const character = await trpc.updateCharacter.mutate(editFormData);
      onCharacterUpdated(character);
      setEditingCharacter(null);
    } catch (error) {
      console.error('Failed to update character:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (character: Character) => {
    setEditFormData({
      id: character.id,
      name: character.name,
      description: character.description
    });
    setEditingCharacter(character);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Character Library
          </h2>
          <p className="text-gray-600 mt-1">
            Manage characters for your storyboards
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Character
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Character</DialogTitle>
              <DialogDescription>
                Add a new character to your library
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="create-name">Character Name</Label>
                <Input
                  id="create-name"
                  value={createFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateCharacterInput) => ({
                      ...prev,
                      name: e.target.value
                    }))
                  }
                  placeholder="Enter character name..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="create-description">Description (Optional)</Label>
                <Textarea
                  id="create-description"
                  value={createFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateCharacterInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  placeholder="Describe the character's appearance, personality, etc..."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Character'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {characters.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No characters yet</h3>
            <p className="text-gray-600 mb-4">
              Create characters to use in your storyboard scenes.
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Character
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {characters.map((character: Character) => (
            <Card key={character.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    {character.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(character)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Created {character.created_at.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              {character.description && (
                <CardContent>
                  <p className="text-sm text-gray-600">{character.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Character Dialog */}
      {editingCharacter && (
        <Dialog open={true} onOpenChange={() => setEditingCharacter(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Character</DialogTitle>
              <DialogDescription>
                Update character details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Character Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateCharacterInput) => ({
                      ...prev,
                      name: e.target.value
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: UpdateCharacterInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCharacter(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Character'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
