import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocalization } from '@/hooks/useLocalization';
import type { Country } from '@shared/schema';

interface AnswerFeedbackProps {
  selectedCountry: Country;
  isCorrect: boolean;
  points: number;
  explanation: string;
  correctAnswer: string;
  onNext: () => void;
}

export function AnswerFeedback({
  selectedCountry,
  isCorrect,
  points,
  explanation,
  correctAnswer,
  onNext,
}: AnswerFeedbackProps) {
  const { getText } = useLocalization(selectedCountry.code);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {isCorrect ? (
          <div>
            <div className="text-8xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-4xl font-black text-green-600 dark:text-green-400 mb-4">
              {getText('feedback.correct') || '¡Excelente!'}
            </h2>
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 rounded-2xl mb-6">
              <CardContent className="p-6">
                <p className="text-lg text-green-800 dark:text-green-300 font-semibold mb-2">
                  {explanation}
                </p>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  +{points} puntos
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            <div className="text-8xl mb-6">😅</div>
            <h2 className="text-4xl font-black text-red-600 dark:text-red-400 mb-4">
              {getText('feedback.incorrect') || '¡Casi!'}
            </h2>
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 rounded-2xl mb-6">
              <CardContent className="p-6">
                <p className="text-lg text-red-800 dark:text-red-300 font-semibold mb-2">
                  La respuesta correcta era: <strong>"{correctAnswer}"</strong>
                </p>
                <p className="text-red-600 dark:text-red-400">
                  {explanation}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Button
          onClick={onNext}
          className="w-full py-4 rounded-xl font-bold text-lg transition-colors text-white"
          style={{ backgroundColor: selectedCountry.primaryColor }}
        >
          Siguiente pregunta 🚀
        </Button>
      </div>
    </div>
  );
}
