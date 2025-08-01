
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { StoryboardCreator } from '@/components/StoryboardCreator';
import { StoryboardEditor } from '@/components/StoryboardEditor';
import { CharacterManager } from '@/components/CharacterManager';
import { LocationManager } from '@/components/LocationManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, FileText, Users, MapPin } from 'lucide-react';
import type { Storyboard, Character, Location } from '../../server/src/schema';

function App() {
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [selectedStoryboard, setSelectedStoryboard] = useState<Storyboard | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState('storyboards');

  const loadStoryboards = useCallback(async () => {
    try {
      const result = await trpc.getStoryboards.query();
      setStoryboards(result);
    } catch (error) {
      console.error('Failed to load storyboards:', error);
    }
  }, []);

  const loadCharacters = useCallback(async () => {
    try {
      const result = await trpc.getCharacters.query();
      setCharacters(result);
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const result = await trpc.getLocations.query();
      setLocations(result);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  }, []);

  useEffect(() => {
    loadStoryboards();
    loadCharacters();
    loadLocations();
  }, [loadStoryboards, loadCharacters, loadLocations]);

  const handleStoryboardCreated = (storyboard: Storyboard) => {
    setStoryboards((prev: Storyboard[]) => [...prev, storyboard]);
    setSelectedStoryboard(storyboard);
    setActiveTab('editor');
  };

  const handleStoryboardUpdated = (updatedStoryboard: Storyboard) => {
    setStoryboards((prev: Storyboard[]) =>
      prev.map((sb: Storyboard) =>
        sb.id === updatedStoryboard.id ? updatedStoryboard : sb
      )
    );
    if (selectedStoryboard?.id === updatedStoryboard.id) {
      setSelectedStoryboard(updatedStoryboard);
    }
  };

  const handleCharacterCreated = (character: Character) => {
    setCharacters((prev: Character[]) => [...prev, character]);
  };

  const handleCharacterUpdated = (updatedCharacter: Character) => {
    setCharacters((prev: Character[]) =>
      prev.map((char: Character) =>
        char.id === updatedCharacter.id ? updatedCharacter : char
      )
    );
  };

  const handleLocationCreated = (location: Location) => {
    setLocations((prev: Location[]) => [...prev, location]);
  };

  const handleLocationUpdated = (updatedLocation: Location) => {
    setLocations((prev: Location[]) =>
      prev.map((loc: Location) =>
        loc.id === updatedLocation.id ? updatedLocation : loc
      )
    );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🎬 AI Storyboard Studio
          </h1>
          <p className="text-gray-600 text-lg">
            Create visual stories with AI-powered scene generation
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="storyboards" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Storyboards
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="characters" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Characters
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Locations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="storyboards" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Your Storyboards</h2>
              <Button
                onClick={() => setActiveTab('editor')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Storyboard
              </Button>
            </div>

            {storyboards.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No storyboards yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first AI-powered storyboard to get started!
                  </p>
                  <Button
                    onClick={() => setActiveTab('editor')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Storyboard
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {storyboards.map((storyboard: Storyboard) => (
                  <Card
                    key={storyboard.id}
                    className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                    onClick={() => {
                      setSelectedStoryboard(storyboard);
                      setActiveTab('editor');
                    }}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{storyboard.title}</CardTitle>
                        <Badge className={getStatusColor(storyboard.status)}>
                          {storyboard.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Created {storyboard.created_at.toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {storyboard.initial_prompt && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {storyboard.initial_prompt}
                        </p>
                      )}
                      {storyboard.script_content && !storyboard.initial_prompt && (
                        <p className="text-sm text-gray-600">
                          📄 Script uploaded
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="editor" className="space-y-4">
            {!selectedStoryboard ? (
              <StoryboardCreator onStoryboardCreated={handleStoryboardCreated} />
            ) : (
              <StoryboardEditor
                storyboard={selectedStoryboard}
                characters={characters}
                locations={locations}
                onStoryboardUpdated={handleStoryboardUpdated}
                onBack={() => {
                  setSelectedStoryboard(null);
                  setActiveTab('storyboards');
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="characters">
            <CharacterManager
              characters={characters}
              onCharacterCreated={handleCharacterCreated}
              onCharacterUpdated={handleCharacterUpdated}
            />
          </TabsContent>

          <TabsContent value="locations">
            <LocationManager
              locations={locations}
              onLocationCreated={handleLocationCreated}
              onLocationUpdated={handleLocationUpdated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
