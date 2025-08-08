import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuiz } from '@/hooks/useQuiz';
import type { Country } from '@shared/schema';

interface QuizInterfaceProps {
  selectedCountry: Country;
  selectedLevel: number;
  onBack: () => void;
  onComplete: () => void;
}

export function QuizInterface({ 
  selectedCountry, 
  selectedLevel, 
  onBack, 
  onComplete 
}: QuizInterfaceProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [showHint, setShowHint] = useState(false);

  const {
    currentQuestion,
    totalQuestions,
    currentQuestionIndex,
    score,
    progress,
    isLoading,
    isAnswering,
    startQuiz,
    answerQuestion,
    hasMoreQuestions,
  } = useQuiz(selectedCountry.code, selectedLevel);

  useEffect(() => {
    if (!isLoading) {
      startQuiz(selectedCountry.code, selectedLevel);
    }
  }, [selectedCountry.code, selectedLevel, isLoading]);

  useEffect(() => {
    // Reset state when question changes
    setSelectedAnswer('');
    setQuestionStartTime(Date.now());
    setShowHint(false);
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answer: string) => {
    if (isAnswering) return;
    
    setSelectedAnswer(answer);
    const timeSpent = Date.now() - questionStartTime;
    answerQuestion(answer, timeSpent);
  };

  const handleNextQuestion = () => {
    if (hasMoreQuestions) {
      // The quiz hook will automatically move to next question
    } else {
      onComplete();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Cargando preguntas...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            No hay preguntas disponibles
          </h2>
          <Button onClick={onBack}>Volver</Button>
        </div>
      </div>
    );
  }

  const questionOptions = currentQuestion.options as string[] || [];
  const isMultipleChoice = currentQuestion.type === 'multiple' && questionOptions.length > 0;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Quiz Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-4">
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Pregunta {currentQuestionIndex + 1} de {totalQuestions}
            </div>
            <div 
              className="text-sm font-semibold"
              style={{ color: selectedCountry.primaryColor }}
            >
              🏆 {score} pts
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="mb-8 h-3" />

        {/* Question Card */}
        <Card className="question-card bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-8 text-white shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="text-4xl mb-4">
                {currentQuestion.type === 'completar' ? '🗣️' : 
                 currentQuestion.type === 'multiple' ? '🤔' : '❓'}
              </div>
              <h3 className="text-2xl font-bold mb-4">
                {currentQuestion.question}
              </h3>
              {showHint && currentQuestion.explanation && (
                <div className="bg-white/20 rounded-xl p-4 text-sm">
                  💡 {currentQuestion.explanation}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Answer Options */}
        {isMultipleChoice ? (
          <div className="space-y-4 mb-8">
            {questionOptions.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  "w-full p-4 text-left justify-between h-auto transition-all duration-300",
                  "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
                  "border-2 border-transparent",
                  selectedAnswer === option && "border-blue-500"
                )}
                style={{
                  borderColor: selectedAnswer === option ? selectedCountry.primaryColor : undefined
                }}
                onClick={() => handleAnswerSelect(option)}
                disabled={isAnswering}
              >
                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                  {String.fromCharCode(65 + index)}) {option}
                </span>
                <div 
                  className={cn(
                    "w-4 h-4 rounded-full border-2",
                    selectedAnswer === option ? "bg-blue-500 border-blue-500" : "border-gray-300"
                  )}
                  style={{
                    backgroundColor: selectedAnswer === option ? selectedCountry.primaryColor : undefined,
                    borderColor: selectedAnswer === option ? selectedCountry.primaryColor : undefined
                  }}
                />
              </Button>
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <input
              type="text"
              placeholder="Escribe tu respuesta..."
              className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && selectedAnswer.trim()) {
                  handleAnswerSelect(selectedAnswer);
                }
              }}
              disabled={isAnswering}
            />
            <Button
              onClick={() => handleAnswerSelect(selectedAnswer)}
              disabled={!selectedAnswer.trim() || isAnswering}
              className="w-full mt-4 py-3 text-lg font-semibold"
              style={{ backgroundColor: selectedCountry.primaryColor }}
            >
              {isAnswering ? 'Enviando...' : 'Enviar respuesta'}
            </Button>
          </div>
        )}

        {/* Help Button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowHint(!showHint)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 px-6 py-3 font-semibold"
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            {showHint ? 'Ocultar ayuda' : 'Ayuda (50 pts)'}
          </Button>
        </div>
      </div>
    </div>
  );
}
