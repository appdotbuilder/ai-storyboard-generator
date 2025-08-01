
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { Upload, Sparkles, FileText } from 'lucide-react';
import type { Storyboard, CreateStoryboardInput } from '../../../server/src/schema';

interface StoryboardCreatorProps {
  onStoryboardCreated: (storyboard: Storyboard) => void;
}

export function StoryboardCreator({ onStoryboardCreated }: StoryboardCreatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateStoryboardInput>({
    title: '',
    initial_prompt: null,
    script_content: null
  });
  const [activeMethod, setActiveMethod] = useState<'prompt' | 'script'>('prompt');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      const storyboard = await trpc.createStoryboard.mutate(formData);
      onStoryboardCreated(storyboard);
      // Reset form
      setFormData({
        title: '',
        initial_prompt: null,
        script_content: null
      });
    } catch (error) {
      console.error('Failed to create storyboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData((prev: CreateStoryboardInput) => ({
        ...prev,
        script_content: content,
        initial_prompt: null // Clear prompt when uploading script
      }));
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Create New Storyboard
          </CardTitle>
          <CardDescription className="text-lg">
            Start with a story prompt or upload an existing script
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-lg font-semibold">
                Storyboard Title
              </Label>
              <Input
                id="title"
                placeholder="Enter a compelling title for your storyboard..."
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateStoryboardInput) => ({
                    ...prev,
                    title: e.target.value
                  }))
                }
                className="mt-2 text-lg"
                required
              />
            </div>

            <Tabs value={activeMethod} onValueChange={(value: string) => {
              setActiveMethod(value as 'prompt' | 'script');
              // Clear the other field when switching
              if (value === 'prompt') {
                setFormData((prev: CreateStoryboardInput) => ({
                  ...prev,
                  script_content: null
                }));
              } else {
                setFormData((prev: CreateStoryboardInput) => ({
                  ...prev,
                  initial_prompt: null
                }));
              }
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prompt" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Story Prompt
                </TabsTrigger>
                <TabsTrigger value="script" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Script
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prompt" className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold">Story Idea</Label>
                  <Textarea
                    placeholder="Describe your story idea... For example: 'A young wizard discovers a hidden magical academy where students learn to control the elements. The story follows their first year as they uncover a dark secret threatening the school.'"
                    value={formData.initial_prompt || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateStoryboardInput) => ({
                        ...prev,
                        initial_prompt: e.target.value || null
                      }))
                    }
                    className="mt-2 min-h-32"
                    required={activeMethod === 'prompt'}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    💡 The more detailed your prompt, the better the AI can generate scenes!
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="script" className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold">Upload Script File</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept=".txt,.md,.rtf"
                      onChange={handleFileUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      required={activeMethod === 'script' && !formData.script_content}
                    />
                  </div>
                  {formData.script_content && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-green-800 font-medium">Script uploaded successfully!</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        {formData.script_content.length} characters loaded
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    📄 Supported formats: .txt, .md, .rtf
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              type="submit"
              disabled={isLoading || !formData.title.trim() || 
                (activeMethod === 'prompt' && !formData.initial_prompt) ||
                (activeMethod === 'script' && !formData.script_content)
              }
              className="w-full text-lg py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Creating Storyboard...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Storyboard
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
