
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface GameLobbyProps {
  game: any;
  user: any;
  onGameStart: () => void;
  onLeaveGame: () => void;
}

export const GameLobby = ({ game, user, onGameStart, onLeaveGame }: GameLobbyProps) => {
  const [players, setPlayers] = useState(game.players);
  const { toast } = useToast();
  const isHost = user.id === game.hostId;

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() > 0.8 && players.length < game.maxPlayers) {
        const newPlayer = {
          id: Date.now(),
          name: `Player ${players.length + 1}`,
          handicap: Math.floor(Math.random() * 20) + 5,
          isHost: false
        };
        setPlayers(prev => [...prev, newPlayer]);
        toast({
          title: "Player Joined!",
          description: `${newPlayer.name} joined the game`,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [players.length, game.maxPlayers, toast]);

  const handleStartGame = () => {
    if (players.length < 2) {
      toast({
        title: "Cannot Start Game",
        description: "Need at least 2 players to start",
        variant: "destructive",
      });
      return;
    }
    onGameStart();
  };

  const copyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(game.joinCode);
      toast({
        title: "Copied!",
        description: "Join code copied to clipboard",
      });
    } catch (err) {
      console.log('Fallback: Could not copy text');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-green-800">{game.name}</CardTitle>
                <CardDescription className="text-lg">{game.courseName}</CardDescription>
              </div>
              <Button variant="outline" onClick={onLeaveGame}>
                Leave Game
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Join Code</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 px-3 py-2 rounded font-mono text-lg">
                    {game.joinCode}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyJoinCode}>
                    Copy
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Players</p>
                <p className="text-lg">
                  {players.length} / {game.maxPlayers} joined
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {players.map((player) => (
                <div 
                  key={player.id}
                  className="bg-white p-3 rounded-lg border flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-gray-600">Handicap: {player.handicap}</p>
                  </div>
                  {player.isHost && (
                    <Badge variant="secondary">Host</Badge>
                  )}
                </div>
              ))}
            </div>

            {isHost && (
              <div className="flex space-x-3">
                <Button 
                  onClick={handleStartGame}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={players.length < 2}
                >
                  Start Game
                </Button>
                <Button variant="destructive">
                  End Game
                </Button>
              </div>
            )}

            {!isHost && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-800">
                  ⏳ Waiting for host to start the game...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-9 gap-2 text-center text-sm">
              <div className="font-medium">Hole</div>
              {Array.from({length: 9}, (_, i) => (
                <div key={i} className="font-medium">{i + 1}</div>
              ))}
              
              <div className="font-medium">Par</div>
              {game.parValues.slice(0, 9).map((par, i) => (
                <div key={i} className="bg-green-100 p-1 rounded">{par}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-9 gap-2 text-center text-sm mt-4">
              <div className="font-medium">Hole</div>
              {Array.from({length: 9}, (_, i) => (
                <div key={i} className="font-medium">{i + 10}</div>
              ))}
              
              <div className="font-medium">Par</div>
              {game.parValues.slice(9, 18).map((par, i) => (
                <div key={i} className="bg-green-100 p-1 rounded">{par}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
