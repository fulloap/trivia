import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/hooks/useLocalization';
import type { Country, UserProgress } from '@shared/schema';

interface LevelSelectionProps {
  selectedCountry: Country;
  onLevelSelect: (level: number) => void;
  onBack: () => void;
}

export function LevelSelection({ selectedCountry, onLevelSelect, onBack }: LevelSelectionProps) {
  const { getText, currentLocalization } = useLocalization(selectedCountry.code);
  
  const { data: userProgress = [] } = useQuery({
    queryKey: ['/api/progress', selectedCountry.code],
  });

  const levels = [
    {
      id: 1,
      title: '🌱 Casi no soy de aquí',
      description: 'Nivel principiante - Expresiones básicas',
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      hoverColor: 'hover:border-green-400',
      textColor: 'text-green-800 dark:text-green-300',
      subtextColor: 'text-green-600 dark:text-green-400',
    },
    {
      id: 2,
      title: `😎 ${getText('levelSelection.level2') || 'Soy de aquí'}`,
      description: 'Nivel intermedio - Frases populares',
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      hoverColor: 'hover:border-blue-400',
      textColor: 'text-blue-800 dark:text-blue-300',
      subtextColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 3,
      title: `🔥 ${getText('levelSelection.level3') || 'Estoy duro'}`,
      description: 'Nivel avanzado - Jerga y memes',
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      hoverColor: 'hover:border-orange-400',
      textColor: 'text-orange-800 dark:text-orange-300',
      subtextColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 4,
      title: '👑 Modo leyenda',
      description: 'Solo para locales de verdad',
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      hoverColor: 'hover:border-purple-400',
      textColor: 'text-purple-800 dark:text-purple-300',
      subtextColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  const getUserProgressForLevel = (level: number) => {
    return userProgress.find((p: UserProgress) => p.level === level);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-4xl w-full">
        {/* Country Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-2xl px-6 py-3 shadow-lg mb-4">
            <span className="text-3xl mr-3">{selectedCountry.flag}</span>
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              {selectedCountry.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="ml-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-800 dark:text-white mb-2">
            {getText('levelSelection.title') || '¡Elige tu nivel!'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 font-inter">
            {getText('levelSelection.subtitle') || '¿Qué tan local eres de verdad?'}
          </p>
        </div>

        {/* Level Cards */}
        <div className="grid gap-6">
          {levels.map((level) => {
            const progress = getUserProgressForLevel(level.id);
            const isCompleted = progress?.isCompleted;
            const accuracy = progress?.questionsAnswered 
              ? (progress.correctAnswers / progress.questionsAnswered) * 100 
              : 0;

            return (
              <Card
                key={level.id}
                className={cn(
                  "cursor-pointer transition-all duration-300 border-2",
                  level.bgColor,
                  level.borderColor,
                  level.hoverColor
                )}
                onClick={() => onLevelSelect(level.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className={cn("text-xl font-bold mb-1", level.textColor)}>
                        {level.title}
                      </h3>
                      <p className={cn("font-inter", level.subtextColor)}>
                        {level.description}
                      </p>
                      {progress && (
                        <div className="mt-2 flex items-center space-x-4">
                          <span className={cn("text-sm font-semibold", level.subtextColor)}>
                            {progress.totalScore} pts
                          </span>
                          {isCompleted && (
                            <span className={cn("text-sm", level.subtextColor)}>
                              {accuracy.toFixed(0)}% precisión
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={cn("flex items-center", level.subtextColor)}>
                      {isCompleted ? (
                        <span className="text-2xl mr-2">✅</span>
                      ) : progress ? (
                        <span className="text-2xl mr-2">🔄</span>
                      ) : null}
                      <ArrowRight className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Card className="text-center shadow-lg">
            <CardContent className="p-4">
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: selectedCountry.primaryColor }}
              >
                🏆 {userProgress.reduce((sum: number, p: UserProgress) => sum + p.totalScore, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                Puntos
              </div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg">
            <CardContent className="p-4">
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: selectedCountry.primaryColor }}
              >
                📊 {Math.round((userProgress.filter((p: UserProgress) => p.isCompleted).length / levels.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                Progreso
              </div>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg">
            <CardContent className="p-4">
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: selectedCountry.primaryColor }}
              >
                🔥 {Math.max(...userProgress.map((p: UserProgress) => p.correctAnswers), 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                Mejor racha
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
