
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface JoinGameProps {
  onGameJoined: (game: any) => void;
  user: any;
}

export const JoinGame = ({ onGameJoined, user }: JoinGameProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Find the game by join code
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .eq('status', 'lobby')
        .single();

      if (gameError || !gameData) {
        throw new Error('Game not found or already started');
      }

      // Check if user is already in this game
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameData.id)
        .eq('user_id', user.id)
        .single();

      if (existingPlayer) {
        // User is already in the game, just join
        const { data: players } = await supabase
          .from('players')
          .select(`
            *,
            profiles!players_user_id_fkey(name)
          `)
          .eq('game_id', gameData.id);

        const gameWithPlayers = {
          ...gameData,
          players: players?.map(p => ({
            id: p.user_id,
            name: p.profiles?.name || 'Unknown',
            handicap: p.handicap_at_start,
            isHost: p.is_host
          })) || []
        };

        toast({
          title: "Rejoined Game!",
          description: `Welcome back to ${gameData.game_name}`,
        });
        
        onGameJoined(gameWithPlayers);
        return;
      }

      // Check if game is full
      const { count: playerCount } = await supabase
        .from('players')
        .select('*', { count: 'exact' })
        .eq('game_id', gameData.id);

      if ((playerCount || 0) >= gameData.max_players) {
        throw new Error('Game is full');
      }

      // Add player to the game
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          game_id: gameData.id,
          user_id: user.id,
          handicap_at_start: user.handicap || 20,
          is_host: false
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

      // Get all players for the game
      const { data: players } = await supabase
        .from('players')
        .select(`
          *,
          profiles!players_user_id_fkey(name)
        `)
        .eq('game_id', gameData.id);

      const gameWithPlayers = {
        ...gameData,
        players: players?.map(p => ({
          id: p.user_id,
          name: p.profiles?.name || 'Unknown',
          handicap: p.handicap_at_start,
          isHost: p.is_host
        })) || []
      };

      toast({
        title: "Game Joined!",
        description: `Successfully joined ${gameData.game_name}`,
      });
      
      onGameJoined(gameWithPlayers);
    } catch (error: any) {
      toast({
        title: "Failed to join game",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🔗</span>
          <span>Join Existing Game</span>
        </CardTitle>
        <CardDescription>Enter a join code to join your friends' game</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="joinCode">Join Code</Label>
            <Input 
              id="joinCode"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ABC123"
              className="text-center text-lg font-mono"
              maxLength={6}
              required 
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            disabled={isLoading || joinCode.length < 6}
          >
            {isLoading ? "Joining..." : "Join Game"}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Ask your friend to share their 6-character join code with you.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
