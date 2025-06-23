
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface LiveScorecardProps {
  game: any;
  user: any;
  onGameEnd: () => void;
}

export const LiveScorecard = ({ game, user, onGameEnd }: LiveScorecardProps) => {
  const [scores, setScores] = useState(() => {
    const initialScores = {};
    game.players.forEach(player => {
      initialScores[player.id] = Array(18).fill(null);
    });
    return initialScores;
  });
  
  const [currentHole, setCurrentHole] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const { toast } = useToast();
  const isHost = user.id === game.hostId;

  useEffect(() => {
    updateLeaderboard();
  }, [scores]);

  const updateLeaderboard = () => {
    const playerStats = game.players.map(player => {
      const playerScores = scores[player.id];
      const totalStrokes = playerScores.reduce((sum, score) => sum + (score || 0), 0);
      const holesPlayed = playerScores.filter(score => score !== null).length;
      const netScore = holesPlayed > 0 ? totalStrokes - player.handicap : 0;
      
      return {
        ...player,
        totalStrokes,
        netScore,
        holesPlayed
      };
    }).sort((a, b) => {
      if (a.holesPlayed !== b.holesPlayed) {
        return b.holesPlayed - a.holesPlayed;
      }
      return a.netScore - b.netScore;
    });

    setLeaderboard(playerStats);
  };

  const updateScore = (playerId: string, holeIndex: number, strokes: number) => {
    setScores(prev => ({
      ...prev,
      [playerId]: prev[playerId].map((score, index) => 
        index === holeIndex ? strokes : score
      )
    }));

    if (playerId === user.id) {
      toast({
        title: `Hole ${holeIndex + 1} Recorded`,
        description: `${strokes} strokes recorded`,
      });
    }
  };

  const getQuickScoreButtons = (holeIndex: number) => {
    const par = game.parValues[holeIndex];
    return [
      { label: 'Eagle', value: par - 2, color: 'bg-yellow-500' },
      { label: 'Birdie', value: par - 1, color: 'bg-blue-500' },
      { label: 'Par', value: par, color: 'bg-green-500' },
      { label: 'Bogey', value: par + 1, color: 'bg-orange-500' },
      { label: 'Double', value: par + 2, color: 'bg-red-500' },
    ];
  };

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${rank + 1}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl text-green-800">{game.name}</CardTitle>
                <p className="text-gray-600">{game.courseName}</p>
              </div>
              {isHost && (
                <Button variant="destructive" onClick={onGameEnd}>
                  End Game
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Live Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === user.id ? 'bg-blue-50 border-blue-200 border' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getRankMedal(index)}</span>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-gray-600">Handicap: {player.handicap}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">Net: {player.netScore}</p>
                    <p className="text-sm text-gray-600">
                      {player.holesPlayed}/18 holes • {player.totalStrokes} strokes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scorecard */}
        <Card>
          <CardHeader>
            <CardTitle>Scorecard</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-max">
              {/* Front 9 */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Front 9</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player</th>
                      {Array.from({length: 9}, (_, i) => (
                        <th key={i} className="text-center p-2 min-w-12">{i + 1}</th>
                      ))}
                      <th className="text-center p-2">OUT</th>
                    </tr>
                    <tr className="border-b bg-green-50">
                      <td className="p-2 font-medium">Par</td>
                      {game.parValues.slice(0, 9).map((par, i) => (
                        <td key={i} className="text-center p-2 font-medium">{par}</td>
                      ))}
                      <td className="text-center p-2 font-medium">
                        {game.parValues.slice(0, 9).reduce((sum, par) => sum + par, 0)}
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {game.players.map(player => (
                      <tr key={player.id} className="border-b">
                        <td className="p-2 font-medium">{player.name}</td>
                        {Array.from({length: 9}, (_, holeIndex) => (
                          <td key={holeIndex} className="text-center p-1">
                            {player.id === user.id ? (
                              <Input
                                type="number"
                                min="1"
                                max="15"
                                value={scores[player.id][holeIndex] || ''}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (!isNaN(value) && value > 0) {
                                    updateScore(player.id, holeIndex, value);
                                  }
                                }}
                                className="w-12 h-8 text-center p-1"
                              />
                            ) : (
                              <span className="text-lg font-medium">
                                {scores[player.id][holeIndex] || '-'}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="text-center p-2 font-bold">
                          {scores[player.id].slice(0, 9).reduce((sum, score) => sum + (score || 0), 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Back 9 */}
              <div>
                <h3 className="font-semibold mb-2">Back 9</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player</th>
                      {Array.from({length: 9}, (_, i) => (
                        <th key={i} className="text-center p-2 min-w-12">{i + 10}</th>
                      ))}
                      <th className="text-center p-2">IN</th>
                      <th className="text-center p-2">TOT</th>
                      <th className="text-center p-2">NET</th>
                    </tr>
                    <tr className="border-b bg-green-50">
                      <td className="p-2 font-medium">Par</td>
                      {game.parValues.slice(9, 18).map((par, i) => (
                        <td key={i} className="text-center p-2 font-medium">{par}</td>
                      ))}
                      <td className="text-center p-2 font-medium">
                        {game.parValues.slice(9, 18).reduce((sum, par) => sum + par, 0)}
                      </td>
                      <td className="text-center p-2 font-medium">
                        {game.parValues.reduce((sum, par) => sum + par, 0)}
                      </td>
                      <td className="text-center p-2">-</td>
                    </tr>
                  </thead>
                  <tbody>
                    {game.players.map(player => {
                      const frontNine = scores[player.id].slice(0, 9).reduce((sum, score) => sum + (score || 0), 0);
                      const backNine = scores[player.id].slice(9, 18).reduce((sum, score) => sum + (score || 0), 0);
                      const total = frontNine + backNine;
                      const net = total - player.handicap;
                      
                      return (
                        <tr key={player.id} className="border-b">
                          <td className="p-2 font-medium">{player.name}</td>
                          {Array.from({length: 9}, (_, holeIndex) => {
                            const actualHoleIndex = holeIndex + 9;
                            return (
                              <td key={holeIndex} className="text-center p-1">
                                {player.id === user.id ? (
                                  <Input
                                    type="number"
                                    min="1"
                                    max="15"
                                    value={scores[player.id][actualHoleIndex] || ''}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value);
                                      if (!isNaN(value) && value > 0) {
                                        updateScore(player.id, actualHoleIndex, value);
                                      }
                                    }}
                                    className="w-12 h-8 text-center p-1"
                                  />
                                ) : (
                                  <span className="text-lg font-medium">
                                    {scores[player.id][actualHoleIndex] || '-'}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="text-center p-2 font-bold">{backNine}</td>
                          <td className="text-center p-2 font-bold">{total}</td>
                          <td className="text-center p-2 font-bold text-green-600">{net}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Score Entry for Current User */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Score Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-9 gap-2">
              {Array.from({length: 18}, (_, holeIndex) => (
                <div key={holeIndex} className="space-y-2">
                  <div className="text-center">
                    <p className="text-sm font-medium">Hole {holeIndex + 1}</p>
                    <p className="text-xs text-gray-500">Par {game.parValues[holeIndex]}</p>
                  </div>
                  <div className="space-y-1">
                    {getQuickScoreButtons(holeIndex).map(button => (
                      <Button
                        key={button.label}
                        size="sm"
                        variant={scores[user.id][holeIndex] === button.value ? "default" : "outline"}
                        className={`w-full text-xs ${scores[user.id][holeIndex] === button.value ? button.color : ''}`}
                        onClick={() => updateScore(user.id, holeIndex, button.value)}
                      >
                        {button.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
