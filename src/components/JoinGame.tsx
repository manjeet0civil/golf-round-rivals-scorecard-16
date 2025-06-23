
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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

    // Simulate finding and joining a game
    setTimeout(() => {
      const game = {
        id: Date.now(),
        name: "Demo Game",
        courseName: "Demo Course",
        hostId: '999',
        hostName: 'Demo Host',
        joinCode: joinCode.toUpperCase(),
        maxPlayers: 4,
        parValues: Array(18).fill(4),
        players: [
          {
            id: '999',
            name: 'Demo Host',
            handicap: 12,
            isHost: true
          },
          {
            id: user.id,
            name: user.name,
            handicap: user.handicap,
            isHost: false
          }
        ],
        status: 'lobby',
        createdAt: new Date().toISOString()
      };

      toast({
        title: "Game Joined!",
        description: `Successfully joined ${game.name}`,
      });
      onGameJoined(game);
      setIsLoading(false);
    }, 1000);
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
