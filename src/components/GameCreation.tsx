
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GameCreationProps {
  onGameCreated: (game: any) => void;
  user: any;
}

export const GameCreation = ({ onGameCreated, user }: GameCreationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [gameName, setGameName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [parValues, setParValues] = useState(Array(18).fill(4));
  const { toast } = useToast();

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const joinCode = generateJoinCode();
      
      // Create the game in Supabase
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          game_name: gameName,
          course_name: courseName,
          host_id: user.id,
          join_code: joinCode,
          max_players: maxPlayers,
          par_values: parValues,
          status: 'lobby'
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Add the host as the first player
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          game_id: gameData.id,
          user_id: user.id,
          is_host: true,
          handicap_at_start: user.handicap || 20
        });

      if (playerError) throw playerError;

      // Create initial score record
      const { error: scoreError } = await supabase
        .from('scores')
        .insert({
          game_id: gameData.id,
          user_id: user.id,
          strokes: new Array(18).fill(null)
        });

      if (scoreError) throw scoreError;

      toast({
        title: "Game Created!",
        description: `Share join code: ${joinCode}`,
      });

      onGameCreated({
        ...gameData,
        players: [{
          id: user.id,
          name: user.name,
          handicap: user.handicap,
          is_host: true
        }]
      });
    } catch (error: any) {
      toast({
        title: "Error creating game",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePar = (holeIndex: number, par: number) => {
    const newPars = [...parValues];
    newPars[holeIndex] = par;
    setParValues(newPars);
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
          <span>🏌️</span>
          <span>Create New Game</span>
        </CardTitle>
        <CardDescription className="text-sm">Set up a new golf round for you and your friends</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gameName">Game Name</Label>
            <Input 
              id="gameName"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Sunday Round at Pebble Beach"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="courseName">Course Name</Label>
            <Input 
              id="courseName"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Pebble Beach Golf Links"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Max Players</Label>
            <Input 
              id="maxPlayers"
              type="number"
              min="2"
              max="8"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Course Par Values</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-sm">
              {parValues.map((par, index) => (
                <div key={index} className="space-y-1">
                  <label className="text-xs text-gray-500 block text-center">H{index + 1}</label>
                  <select 
                    value={par}
                    onChange={(e) => updatePar(index, parseInt(e.target.value))}
                    className="w-full p-1 border rounded text-sm"
                  >
                    <option value={3}>Par 3</option>
                    <option value={4}>Par 4</option>
                    <option value={5}>Par 5</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base" 
            disabled={isLoading}
          >
            {isLoading ? "Creating Game..." : "Create Game & Get Join Code"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
