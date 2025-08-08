import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Users, Globe, Flag, Star } from 'lucide-react';
import { type Ranking } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';

interface RankingsProps {
  selectedCountryCode?: string;
}

type RankingWithUsername = Ranking & { username: string };

export function Rankings({ selectedCountryCode }: RankingsProps) {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [activeTab, setActiveTab] = useState(selectedCountryCode ? 'country' : 'global');

  const { data: countryRankings, isLoading: loadingCountry } = useQuery<RankingWithUsername[]>({
    queryKey: ['/api/rankings', selectedCountryCode, selectedLevel],
    enabled: !!selectedCountryCode && activeTab === 'country',
  });

  const { data: globalRankings, isLoading: loadingGlobal } = useQuery<RankingWithUsername[]>({
    queryKey: ['/api/rankings/global', selectedLevel],
    enabled: activeTab === 'global',
  });

  const { data: userRankings, isLoading: loadingUser } = useQuery<RankingWithUsername[]>({
    queryKey: ['/api/rankings/user', selectedCountryCode],
    enabled: !!user && !!selectedCountryCode && activeTab === 'user',
  });

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{position}</span>;
  };

  const getLevelName = (level: number) => {
    const names = {
      1: 'Principiante',
      2: 'Intermedio',
      3: 'Avanzado',
      4: 'Leyenda'
    };
    return names[level as keyof typeof names] || `Nivel ${level}`;
  };

  const renderRankingList = (rankings: RankingWithUsername[] | undefined, loading: boolean) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-muted-foreground/20 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-24" />
                <div className="h-3 bg-muted-foreground/20 rounded w-16" />
              </div>
              <div className="h-6 bg-muted-foreground/20 rounded w-12" />
            </div>
          ))}
        </div>
      );
    }

    if (!rankings?.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay rankings disponibles para este nivel</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {rankings.map((ranking, index) => (
          <div 
            key={ranking.id} 
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              user && ranking.username === user.username 
                ? 'bg-primary/10 border-primary/20' 
                : 'bg-card hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-center w-8 h-8">
              {getRankIcon(index + 1)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${
                user && ranking.username === user.username ? 'text-primary' : ''
              }`}>
                {ranking.username}
                {user && ranking.username === user.username && (
                  <Badge variant="secondary" className="ml-2 text-xs">Tú</Badge>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {ranking.correctAnswers}/{ranking.totalQuestions} correctas • {ranking.accuracy}% precisión
              </p>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-primary">{ranking.score}</p>
              <p className="text-xs text-muted-foreground">puntos</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Rankings
          </CardTitle>
          <CardDescription>
            Compite con otros jugadores y mejora tu posición
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar Nivel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4].map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevel(level)}
                className="flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                {getLevelName(level)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rankings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Global
          </TabsTrigger>
          {selectedCountryCode && (
            <TabsTrigger value="country" className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Por País
            </TabsTrigger>
          )}
          {user && selectedCountryCode && (
            <TabsTrigger value="user" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Mis Juegos
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Ranking Global - {getLevelName(selectedLevel)}
              </CardTitle>
              <CardDescription>
                Los mejores jugadores de todos los países
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderRankingList(globalRankings, loadingGlobal)}
            </CardContent>
          </Card>
        </TabsContent>

        {selectedCountryCode && (
          <TabsContent value="country">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Ranking por País - {getLevelName(selectedLevel)}
                </CardTitle>
                <CardDescription>
                  Los mejores jugadores de este país
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderRankingList(countryRankings, loadingCountry)}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {user && selectedCountryCode && (
          <TabsContent value="user">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Mis Juegos - {user.username}
                </CardTitle>
                <CardDescription>
                  Tus mejores resultados en este país
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderRankingList(userRankings, loadingUser)}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}