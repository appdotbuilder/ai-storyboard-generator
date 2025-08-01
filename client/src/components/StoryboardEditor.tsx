
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { ArrowLeft, Sparkles, Plus, Edit, MapPin, Download, Play } from 'lucide-react';
import { SceneCharacterManager } from '@/components/SceneCharacterManager';
import type { 
  Storyboard, 
  Scene, 
  Character, 
  Location, 
  CreateSceneInput, 
  UpdateSceneInput
} from '../../../server/src/schema';

interface StoryboardEditorProps {
  storyboard: Storyboard;
  characters: Character[];
  locations: Location[];
  onStoryboardUpdated: (storyboard: Storyboard) => void;
  onBack: () => void;
}

export function StoryboardEditor({ 
  storyboard, 
  characters, 
  locations, 
  onStoryboardUpdated, 
  onBack 
}: StoryboardEditorProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(storyboard.title);

  const loadScenes = useCallback(async () => {
    try {
      const result = await trpc.getScenes.query({ storyboardId: storyboard.id });
      setScenes(result);
    } catch (error) {
      console.error('Failed to load scenes:', error);
    }
  }, [storyboard.id]);

  useEffect(() => {
    loadScenes();
  }, [loadScenes]);

  const handleGenerateScenes = async () => {
    setIsGenerating(true);
    try {
      await trpc.generateScenes.mutate({ storyboardId: storyboard.id });
      // Update storyboard status
      const updatedStoryboard = await trpc.updateStoryboard.mutate({
        id: storyboard.id,
        status: 'completed'
      });
      onStoryboardUpdated(updatedStoryboard);
      // Reload scenes
      await loadScenes();
    } catch (error) {
      console.error('Failed to generate scenes:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (newTitle.trim() === storyboard.title) {
      setEditingTitle(false);
      return;
    }

    try {
      const updatedStoryboard = await trpc.updateStoryboard.mutate({
        id: storyboard.id,
        title: newTitle.trim()
      });
      onStoryboardUpdated(updatedStoryboard);
      setEditingTitle(false);
    } catch (error) {
      console.error('Failed to update title:', error);
      setNewTitle(storyboard.title); // Reset on error
    }
  };

  const handleCreateScene = async (sceneData: Omit<CreateSceneInput, 'storyboard_id'>) => {
    try {
      const newScene = await trpc.createScene.mutate({
        ...sceneData,
        storyboard_id: storyboard.id
      });
      setScenes((prev: Scene[]) => [...prev, newScene].sort((a, b) => a.sequence_number - b.sequence_number));
    } catch (error) {
      console.error('Failed to create scene:', error);
    }
  };

  const handleUpdateScene = async (sceneData: UpdateSceneInput) => {
    try {
      const updatedScene = await trpc.updateScene.mutate(sceneData);
      setScenes((prev: Scene[]) =>
        prev.map((scene: Scene) =>
          scene.id === updatedScene.id ? updatedScene : scene
        )
      );
      setEditingScene(null);
    } catch (error) {
      console.error('Failed to update scene:', error);
    }
  };

  const handleExport = async (format: 'json' | 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      await trpc.exportStoryboard.mutate({
        id: storyboard.id,
        format
      });
      // Update status to exported
      const updatedStoryboard = await trpc.updateStoryboard.mutate({
        id: storyboard.id,
        status: 'exported'
      });
      onStoryboardUpdated(updatedStoryboard);
    } catch (error) {
      console.error('Failed to export storyboard:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'exported': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationName = (locationId: number | null) => {
    if (!locationId) return 'No location';
    const location = locations.find((loc: Location) => loc.id === locationId);
    return location ? location.name : 'Unknown location';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Storyboards
            </Button>
            <Badge className={`${getStatusColor(storyboard.status)} text-xs`}>
              {storyboard.status}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            {editingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={newTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
                  className="text-2xl font-bold bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  onBlur={handleUpdateTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateTitle();
                    if (e.key === 'Escape') {
                      setNewTitle(storyboard.title);
                      setEditingTitle(false);
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <CardTitle 
                className="text-3xl cursor-pointer hover:opacity-80 flex items-center gap-2"
                onClick={() => setEditingTitle(true)}
              >
                {storyboard.title}
                <Edit className="w-5 h-5 opacity-70" />
              </CardTitle>
            )}
          </div>
          
          <CardDescription className="text-white/80 text-lg">
            Created {storyboard.created_at.toLocaleDateString()} • {scenes.length} scenes
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        {storyboard.status === 'draft' && (
          <Button
            onClick={handleGenerateScenes}
            disabled={isGenerating}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating Scenes...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Scenes
              </>
            )}
          </Button>
        )}

        <SceneCreator 
          onCreateScene={handleCreateScene}
          nextSequenceNumber={scenes.length + 1}
          locations={locations}
        />

        {storyboard.status === 'completed' && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>

      {/* Scenes */}
      {scenes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Play className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No scenes yet</h3>
            <p className="text-gray-600 mb-4">
              {storyboard.status === 'draft' 
                ? 'Generate AI scenes from your story or create scenes manually.'
                : 'Create your first scene to start building your storyboard.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {scenes.map((scene: Scene) => (
            <Card key={scene.id} className="border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline">Scene {scene.sequence_number}</Badge>
                      {scene.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {getLocationName(scene.location_id)}
                      </span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingScene(scene)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{scene.description}</p>
                <SceneCharacterManager 
                  scene={scene}
                  allCharacters={characters}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Scene Dialog */}
      {editingScene && (
        <SceneEditor
          scene={editingScene}
          locations={locations}
          onUpdateScene={handleUpdateScene}
          onClose={() => setEditingScene(null)}
        />
      )}
    </div>
  );
}

// Scene Creator Component
interface SceneCreatorProps {
  onCreateScene: (sceneData: Omit<CreateSceneInput, 'storyboard_id'>) => Promise<void>;
  nextSequenceNumber: number;
  locations: Location[];
}

function SceneCreator({ onCreateScene, nextSequenceNumber, locations }: SceneCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    sequence_number: nextSequenceNumber,
    title: '',
    description: '',
    location_id: null as number | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setIsLoading(true);
    try {
      await onCreateScene(formData);
      setFormData({
        sequence_number: nextSequenceNumber + 1,
        title: '',
        description: '',
        location_id: null
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create scene:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Scene
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Scene</DialogTitle>
          <DialogDescription>
            Add a new scene to your storyboard
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sequence">Sequence Number</Label>
            <Input
              id="sequence"
              type="number"
              value={formData.sequence_number}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  sequence_number: parseInt(e.target.value) || 1
                }))
              }
              min="1"
              required
            />
          </div>
          <div>
            <Label htmlFor="title">Scene Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter scene title..."
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe what happens in this scene..."
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="location">Location (Optional)</Label>
            <Select
              value={formData.location_id?.toString() || 'none'}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  location_id: value === 'none' ? null : parseInt(value)
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No location</SelectItem>
                {locations.map((location: Location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Scene'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Scene Editor Component
interface SceneEditorProps {
  scene: Scene;
  locations: Location[];
  onUpdateScene: (sceneData: UpdateSceneInput) => Promise<void>;
  onClose: () => void;
}

function SceneEditor({ scene, locations, onUpdateScene, onClose }: SceneEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: scene.title,
    description: scene.description,
    location_id: scene.location_id
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await onUpdateScene({
        id: scene.id,
        title: formData.title,
        description: formData.description,
        location_id: formData.location_id
      });
    } catch (error) {
      console.error('Failed to update scene:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Scene {scene.sequence_number}</DialogTitle>
          <DialogDescription>
            Update the scene details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Scene Title</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-location">Location</Label>
            <Select
              value={formData.location_id?.toString() || 'none'}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  location_id: value === 'none' ? null : parseInt(value)
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No location</SelectItem>
                {locations.map((location: Location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Scene'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
