import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  // Get countries for country selector
  const { data: countries } = useQuery<any[]>({
    queryKey: ['/api/countries'],
  });

  const [selectedCountryForRanking, setSelectedCountryForRanking] = useState(selectedCountryCode || 'cuba');

  const { data: countryRankings, isLoading: loadingCountry } = useQuery<RankingWithUsername[]>({
    queryKey: [`/api/rankings/${selectedCountryForRanking}/${selectedLevel}`],
    enabled: activeTab === 'country',
  });

  const { data: globalRankings, isLoading: loadingGlobal } = useQuery<RankingWithUsername[]>({
    queryKey: [`/api/rankings/global/${selectedLevel}`],
    enabled: activeTab === 'global',
  });

  const { data: userRankings, isLoading: loadingUser } = useQuery<RankingWithUsername[]>({
    queryKey: [`/api/rankings/user/${selectedCountryForRanking}`],
    enabled: !!user && activeTab === 'user',
    select: (data) => data?.filter(ranking => ranking.level === selectedLevel) || [],
  });

  const getRankIcon = (position: number) => {
    if (position === 1) return (
      <div className="relative">
        <Trophy className="w-7 h-7 text-yellow-500 drop-shadow-lg" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
      </div>
    );
    if (position === 2) return (
      <div className="relative">
        <Medal className="w-7 h-7 text-gray-400 drop-shadow-md" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>
    );
    if (position === 3) return (
      <div className="relative">
        <Award className="w-7 h-7 text-amber-600 drop-shadow-md" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></div>
      </div>
    );
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border shadow-sm">
        <span className="text-sm font-bold text-muted-foreground">#{position}</span>
      </div>
    );
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
        {rankings.map((ranking, index) => {
          const isCurrentUser = user && ranking.username === user.username;
          const position = index + 1;
          
          return (
            <div 
              key={ranking.id} 
              className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                isCurrentUser
                  ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 shadow-lg ring-1 ring-primary/20' 
                  : position <= 3
                  ? 'bg-gradient-to-r from-muted/50 to-background border-border/50 shadow-md hover:shadow-lg'
                  : 'bg-card hover:bg-muted/30 border-border/30 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Posición y icono */}
              <div className="flex items-center justify-center w-12 h-12">
                {getRankIcon(position)}
              </div>
              
              {/* Información del usuario */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold truncate text-lg ${
                    isCurrentUser ? 'text-primary' : position <= 3 ? 'text-foreground' : 'text-foreground/90'
                  }`}>
                    {ranking.username}
                  </span>
                  {isCurrentUser && (
                    <Badge variant="default" className="text-xs px-2 py-1 bg-primary text-primary-foreground">
                      Tú
                    </Badge>
                  )}
                  {position <= 3 && !isCurrentUser && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {ranking.correctAnswers}/{ranking.totalQuestions} correctas
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {ranking.accuracy}% precisión
                  </span>
                  <span className="text-xs opacity-75">
                    {ranking.completedAt ? new Date(ranking.completedAt).toLocaleDateString() : 'Sin fecha'}
                  </span>
                </div>
              </div>
              
              {/* Puntuación */}
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  isCurrentUser ? 'text-primary' : position <= 3 ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {ranking.score.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground font-medium">puntos</div>
              </div>

              {/* Efecto de brillo para top 3 */}
              {position <= 3 && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Trophy className="w-6 h-6" />
            🏆 Rankings de Jugadores
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Compite con otros jugadores y alcanza la cima del ranking
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Level Selection */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Seleccionar Nivel de Competencia
          </CardTitle>
          <CardDescription>
            Compite en diferentes niveles de dificultad
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((level) => {
              const isSelected = selectedLevel === level;
              const levelInfo = {
                1: { icon: "🌱", gradient: "from-green-100 to-green-50", border: "border-green-200", text: "text-green-700", name: "Principiante" },
                2: { icon: "⚡", gradient: "from-blue-100 to-blue-50", border: "border-blue-200", text: "text-blue-700", name: "Intermedio" },
                3: { icon: "🔥", gradient: "from-orange-100 to-orange-50", border: "border-orange-200", text: "text-orange-700", name: "Avanzado" },
                4: { icon: "👑", gradient: "from-purple-100 to-purple-50", border: "border-purple-200", text: "text-purple-700", name: "Leyenda" }
              };
              
              const info = levelInfo[level as keyof typeof levelInfo];
              
              return (
                <Button
                  key={level}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => setSelectedLevel(level)}
                  className={`h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20' 
                      : `bg-gradient-to-br ${info.gradient} ${info.border} ${info.text} hover:shadow-md`
                  }`}
                >
                  <span className="text-2xl">{info.icon}</span>
                  <span className="text-sm font-semibold">{info.name}</span>
                </Button>
              );
            })}
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
          <TabsTrigger value="country" className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Por País
          </TabsTrigger>
          {user && (
            <TabsTrigger value="user" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Mis Rankings
            </TabsTrigger>
          )}
        </TabsList>

        {/* Country selector for country rankings */}
        {activeTab === 'country' && (
          <div className="mt-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flag className="w-5 h-5 text-primary" />
                  Seleccionar País
                </CardTitle>
                <CardDescription>
                  Ve los mejores jugadores de cada país
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedCountryForRanking} onValueChange={setSelectedCountryForRanking}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries && countries.map((country: any) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{country.flag}</span>
                          <span>{country.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        )}

        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Globe className="w-5 h-5" />
                🌍 Ranking Global - {getLevelName(selectedLevel)}
              </CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-300">
                Los mejores jugadores de todos los países
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {renderRankingList(globalRankings, loadingGlobal)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="country" className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Flag className="w-5 h-5" />
                {countries && countries.find((c: any) => c.code === selectedCountryForRanking)?.flag} Rankings de {countries && countries.find((c: any) => c.code === selectedCountryForRanking)?.name} - {getLevelName(selectedLevel)}
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-300">
                Los mejores jugadores de este país
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {renderRankingList(countryRankings, loadingCountry)}
            </CardContent>
          </Card>
        </TabsContent>

        {user && (
          <TabsContent value="user" className="space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                  <Users className="w-5 h-5" />
                  📊 Mis Rankings - {getLevelName(selectedLevel)}
                </CardTitle>
                <CardDescription className="text-purple-600 dark:text-purple-300">
                  Tu historial de puntuaciones en {countries && countries.find((c: any) => c.code === selectedCountryForRanking)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {renderRankingList(userRankings, loadingUser)}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}