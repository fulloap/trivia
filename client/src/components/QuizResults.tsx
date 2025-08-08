import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocalization } from '@/hooks/useLocalization';
import type { Country } from '@shared/schema';

interface QuizResultsProps {
  selectedCountry: Country;
  selectedLevel: number;
  totalQuestions: number;
  correctAnswers: number;
  totalScore: number;
  timeSpent?: number;
  onNextLevel: () => void;
  onRetryLevel: () => void;
  onBackToLevels: () => void;
}

export function QuizResults({
  selectedCountry,
  selectedLevel,
  totalQuestions,
  correctAnswers,
  totalScore,
  timeSpent = 0,
  onNextLevel,
  onRetryLevel,
  onBackToLevels,
}: QuizResultsProps) {
  const { getText } = useLocalization(selectedCountry.code);
  const queryClient = useQueryClient();

  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const timeString = timeSpent > 0 ? `${Math.floor(timeSpent / 60000)}:${Math.floor((timeSpent % 60000) / 1000).toString().padStart(2, '0')}` : '2:35';

  const getLevelName = (level: number) => {
    const levelNames: Record<number, string> = {
      1: 'Casi no soy de aquí',
      2: getText('levelSelection.level2') || 'Soy de aquí',
      3: getText('levelSelection.level3') || 'Estoy duro',
      4: 'Modo leyenda',
    };
    return levelNames[level] || `Nivel ${level}`;
  };

  const getNextLevelName = (level: number) => {
    const nextLevel = level + 1;
    return getLevelName(nextLevel);
  };

  const shareResults = () => {
    const text = `¡Completé el nivel "${getLevelName(selectedLevel)}" de ${selectedCountry.name} en ¿De dónde eres? 🎯\n\n` +
                `📊 ${correctAnswers}/${totalQuestions} respuestas correctas (${accuracy.toFixed(0)}%)\n` +
                `🏆 ${totalScore} puntos\n` +
                `⏱️ Tiempo: ${timeString}\n\n` +
                `¡Prueba tu conocimiento cultural! 🌎`;
    
    if (navigator.share) {
      navigator.share({
        title: '¿De dónde eres? - Resultados',
        text,
      });
    } else {
      navigator.clipboard.writeText(text);
      // You could add a toast here to indicate the text was copied
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="text-8xl mb-6 animate-float">🏆</div>
        <h2 className="text-4xl md:text-5xl font-black text-gray-800 dark:text-white mb-4">
          {getText('results.celebration') || '¡Increíble!'}
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 font-inter">
          Completaste el nivel "{getLevelName(selectedLevel)}"
        </p>

        {/* Results Stats */}
        <Card className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: selectedCountry.primaryColor }}
                >
                  {correctAnswers}/{totalQuestions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                  Respuestas correctas
                </div>
              </div>
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: selectedCountry.primaryColor }}
                >
                  {totalScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                  Puntos ganados
                </div>
              </div>
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: selectedCountry.primaryColor }}
                >
                  {timeString}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                  Tiempo total
                </div>
              </div>
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: selectedCountry.primaryColor }}
                >
                  🔥 {correctAnswers}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                  Racha
                </div>
              </div>
            </div>

            {/* Accuracy Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Precisión
                </span>
                <span 
                  className="text-sm font-bold"
                  style={{ color: selectedCountry.primaryColor }}
                >
                  {accuracy.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${accuracy}%`,
                    backgroundColor: selectedCountry.primaryColor 
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          {selectedLevel < 4 && (
            <Button
              onClick={onNextLevel}
              className="w-full py-4 rounded-xl font-bold text-lg transition-colors text-white"
              style={{ backgroundColor: selectedCountry.primaryColor }}
            >
              Siguiente nivel: "{getNextLevelName(selectedLevel)}" 🔥
            </Button>
          )}
          
          <Button
            onClick={onRetryLevel}
            variant="outline"
            className="w-full py-4 rounded-xl font-bold text-lg transition-colors border-2"
            style={{ 
              borderColor: selectedCountry.primaryColor,
              color: selectedCountry.primaryColor 
            }}
          >
            Repetir nivel 🔄
          </Button>
          
          <Button
            onClick={onBackToLevels}
            variant="outline"
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            Volver a niveles 📚
          </Button>
          
          <Button
            onClick={shareResults}
            variant="outline"
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            Compartir resultado 📱
          </Button>
        </div>

        {/* Daily Challenge Reminder */}
        <Card className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2">🎯 Reto diario disponible</h3>
            <p className="mb-4 font-inter">
              ¡Gana puntos extra con el desafío de hoy!
            </p>
            <Button
              variant="secondary"
              className="bg-white text-purple-600 px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Ver reto
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
