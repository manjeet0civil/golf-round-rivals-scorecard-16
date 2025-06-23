
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GameCreation } from '@/components/GameCreation';
import { JoinGame } from '@/components/JoinGame';
import { GameLobby } from '@/components/GameLobby';
import { LiveScorecard } from '@/components/LiveScorecard';
import { GameHistory } from '@/components/GameHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

type GameState = 'lobby' | 'playing' | 'finished' | null;

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState>(null);

  const handleGameCreated = (game: any) => {
    setCurrentGame(game);
    setGameState('lobby');
  };

  const handleGameJoined = (game: any) => {
    setCurrentGame(game);
    setGameState('lobby');
  };

  const handleGameStart = () => {
    setGameState('playing');
  };

  const handleGameEnd = () => {
    setGameState('finished');
    setTimeout(() => {
      setGameState(null);
      setCurrentGame(null);
    }, 5000);
  };

  if (gameState === 'lobby') {
    return (
      <GameLobby 
        game={currentGame}
        user={user}
        onGameStart={handleGameStart}
        onLeaveGame={() => {
          setGameState(null);
          setCurrentGame(null);
        }}
      />
    );
  }

  if (gameState === 'playing') {
    return (
      <LiveScorecard 
        game={currentGame}
        user={user}
        onGameEnd={handleGameEnd}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⛳</span>
              <h1 className="text-xl font-bold text-green-800">Golf Round Rivals</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="play" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="play">Play Golf</TabsTrigger>
            <TabsTrigger value="history">Game History</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="play" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GameCreation onGameCreated={handleGameCreated} user={user} />
              <JoinGame onGameJoined={handleGameJoined} user={user} />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <GameHistory user={user} />
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your golf profile and handicap</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-lg">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-lg">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Current Handicap</label>
                  <p className="text-lg font-bold text-green-600">{user.handicap}</p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700">
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
