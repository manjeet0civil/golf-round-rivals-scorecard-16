
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GameHistoryProps {
  user: any;
}

export const GameHistory = ({ user }: GameHistoryProps) => {
  // Mock data for demonstration
  const gameHistory = [
    {
      id: 1,
      name: "Sunday Round at Augusta",
      courseName: "Augusta National Golf Club",
      date: "2024-06-20",
      totalScore: 85,
      netScore: 70,
      handicap: 15,
      rank: 1,
      totalPlayers: 4,
      status: "completed"
    },
    {
      id: 2,
      name: "Weekend Warriors",
      courseName: "Pebble Beach Golf Links",
      date: "2024-06-15", 
      totalScore: 92,
      netScore: 77,
      handicap: 15,
      rank: 3,
      totalPlayers: 4,
      status: "completed"
    },
    {
      id: 3,
      name: "Friday Fun Round",
      courseName: "St. Andrews Old Course",
      date: "2024-06-10",
      totalScore: 88,
      netScore: 73,
      handicap: 15,
      rank: 2,
      totalPlayers: 3,
      status: "completed"
    }
  ];

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  const getAverageScore = () => {
    const total = gameHistory.reduce((sum, game) => sum + game.netScore, 0);
    return (total / gameHistory.length).toFixed(1);
  };

  const getWinRate = () => {
    const wins = gameHistory.filter(game => game.rank === 1).length;
    return ((wins / gameHistory.length) * 100).toFixed(0);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{gameHistory.length}</p>
              <p className="text-sm text-gray-600">Games Played</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{getAverageScore()}</p>
              <p className="text-sm text-gray-600">Average Net Score</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{getWinRate()}%</p>
              <p className="text-sm text-gray-600">Win Rate</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{user.handicap}</p>
              <p className="text-sm text-gray-600">Current Handicap</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Games</CardTitle>
          <CardDescription>Your golf game history and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gameHistory.map((game) => (
              <div 
                key={game.id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getRankMedal(game.rank)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{game.name}</h3>
                        <p className="text-gray-600">{game.courseName}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline">
                        {game.rank}/{game.totalPlayers} place
                      </Badge>
                      <Badge variant="secondary">
                        Net: {game.netScore}
                      </Badge>
                      <Badge variant="outline">
                        Gross: {game.totalScore}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      Played on {new Date(game.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Scorecard
                    </Button>
                    <Button variant="outline" size="sm">
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {gameHistory.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No games played yet</p>
              <Button className="bg-green-600 hover:bg-green-700">
                Start Your First Game
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
