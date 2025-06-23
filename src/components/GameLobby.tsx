
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GameLobbyProps {
  game: any;
  user: any;
  onGameStart: () => void;
  onLeaveGame: () => void;
}

export const GameLobby = ({ game, user, onGameStart, onLeaveGame }: GameLobbyProps) => {
  const [players, setPlayers] = useState(game.players || []);
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();
  const isHost = user.id === game.host_id;

  useEffect(() => {
    // Set up real-time subscription for player changes
    const channel = supabase
      .channel(`game-lobby-${game.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${game.id}`
        },
        async () => {
          // Refetch players when changes occur
          const { data: updatedPlayers } = await supabase
            .from('players')
            .select(`
              *,
              profiles!players_user_id_fkey(name)
            `)
            .eq('game_id', game.id);

          if (updatedPlayers) {
            setPlayers(updatedPlayers.map(p => ({
              id: p.user_id,
              name: p.profiles?.name || 'Unknown',
              handicap: p.handicap_at_start,
              isHost: p.is_host
            })));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game.id]);

  const handleStartGame = async () => {
    if (players.length < 2) {
      toast({
        title: "Cannot start game",
        description: "Need at least 2 players to start",
        variant: "destructive"
      });
      return;
    }

    setIsStarting(true);
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', game.id);

      if (error) throw error;
      
      onGameStart();
    } catch (error: any) {
      toast({
        title: "Failed to start game",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeaveGame = async () => {
    try {
      // Remove player from game
      const { error: playerError } = await supabase
        .from('players')
        .delete()
        .eq('game_id', game.id)
        .eq('user_id', user.id);

      if (playerError) throw playerError;

      // Remove scores
      const { error: scoreError } = await supabase
        .from('scores')
        .delete()
        .eq('game_id', game.id)
        .eq('user_id', user.id);

      if (scoreError) throw scoreError;

      toast({
        title: "Left game",
        description: "You have left the game"
      });
      
      onLeaveGame();
    } catch (error: any) {
      toast({
        title: "Failed to leave game",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl text-green-800">{game.game_name}</CardTitle>
                <p className="text-gray-600">{game.course_name}</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {game.join_code}
                </Badge>
                <p className="text-sm text-gray-500 mt-1">Join Code</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Players ({players.length}/{game.max_players})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {players.map((player) => (
                <div 
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === user.id ? 'bg-blue-50 border-blue-200 border' : 'bg-white border'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-800 font-semibold">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-gray-600">Handicap: {player.handicap}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {player.isHost && (
                      <Badge variant="default">Host</Badge>
                    )}
                    {player.id === user.id && (
                      <Badge variant="secondary">You</Badge>
                    )}
                  </div>
                </div>
              ))}

              {players.length < game.max_players && (
                <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <p className="text-gray-500">Waiting for more players...</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Share the join code: <strong>{game.join_code}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Front 9</h4>
                <div className="grid grid-cols-9 gap-1 text-sm">
                  {game.par_values.slice(0, 9).map((par, i) => (
                    <div key={i} className="text-center p-1 bg-green-50 rounded">
                      <div className="text-xs text-gray-500">{i + 1}</div>
                      <div className="font-medium">{par}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Back 9</h4>
                <div className="grid grid-cols-9 gap-1 text-sm">
                  {game.par_values.slice(9, 18).map((par, i) => (
                    <div key={i} className="text-center p-1 bg-green-50 rounded">
                      <div className="text-xs text-gray-500">{i + 10}</div>
                      <div className="font-medium">{par}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-lg">
                Total Par: <span className="font-bold">{game.par_values.reduce((sum, par) => sum + par, 0)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          {isHost ? (
            <Button 
              onClick={handleStartGame} 
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isStarting || players.length < 2}
            >
              {isStarting ? "Starting..." : "Start Game"}
            </Button>
          ) : (
            <div className="flex-1 text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">Waiting for host to start the game...</p>
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleLeaveGame}
            className="px-8"
          >
            Leave Game
          </Button>
        </div>
      </div>
    </div>
  );
};
