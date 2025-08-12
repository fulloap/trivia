import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Gift, Star, Users } from 'lucide-react';

interface UserStats {
  totalScore: number;
  gamesPlayed: number;
  bonusHelps: number;
  referralsCount: number;
  accuracy: number;
  bestLevel: number;
}

export function UserProfile() {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ['/api/user/stats'],
    enabled: !!user,
  });

  const { data: referralInfo } = useQuery<{
    referralCode: string;
    referralLink: string;
    bonusHelps: number;
    referralsCount: number;
  }>({
    queryKey: ['/api/user/referral-info'],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información del Usuario */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <CardTitle className="text-xl">{user?.username}</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Jugador de trivia cultural
          </p>
        </CardHeader>
      </Card>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{stats?.totalScore || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Puntos Totales</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats?.gamesPlayed || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Juegos Jugados</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{stats?.bonusHelps || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Ayudas Bonus</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{stats?.referralsCount || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Amigos</div>
          </CardContent>
        </Card>
      </div>

      {/* Información de Invitar Amigos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Invitar Amigos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm block mb-2">Tu enlace de invitación:</span>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded border text-xs font-mono break-all">
              {referralInfo?.referralLink || 'Generando enlace...'}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Amigos invitados:</span>
            <span className="font-semibold">{stats?.referralsCount || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Ayudas ganadas:</span>
            <span className="font-semibold text-green-600">{stats?.bonusHelps || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Nivel y Progreso */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso del Jugador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Mejor nivel alcanzado:</span>
            <Badge variant={stats?.bestLevel ? "default" : "secondary"}>
              {stats?.bestLevel ? `Nivel ${stats.bestLevel}` : 'Sin completar'}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Precisión promedio:</span>
            <span className="font-semibold">
              {stats?.accuracy ? `${Math.round(stats.accuracy)}%` : 'Sin datos'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}