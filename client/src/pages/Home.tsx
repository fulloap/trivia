import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CountrySelection } from '@/components/CountrySelection';
import { LevelSelection } from '@/components/LevelSelection';
import { QuizInterface } from '@/components/QuizInterface';
import { AnswerFeedback } from '@/components/AnswerFeedback';
import { QuizResults } from '@/components/QuizResults';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useQuiz } from '@/hooks/useQuiz';
import { useLocalization } from '@/hooks/useLocalization';
import type { Country } from '@shared/schema';

type GameState = 'country-selection' | 'level-selection' | 'quiz' | 'feedback' | 'results';

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [gameState, setGameState] = useState<GameState>('country-selection');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [currentAnswerResult, setCurrentAnswerResult] = useState<any>(null);
  
  const { setCountry } = useLocalization(selectedCountry?.code);
  const { answerResult, resetQuiz } = useQuiz(selectedCountry?.code, selectedLevel);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setCountry(country.code);
    setGameState('level-selection');
  };

  const handleLevelSelect = (level: number) => {
    setSelectedLevel(level);
    setGameState('quiz');
  };

  const handleBackToCountries = () => {
    setSelectedCountry(null);
    resetQuiz();
    setGameState('country-selection');
  };

  const handleBackToLevels = () => {
    resetQuiz();
    setGameState('level-selection');
  };

  const handleQuizComplete = () => {
    setGameState('results');
  };

  const handleAnswerGiven = (result: any) => {
    setCurrentAnswerResult(result);
    setGameState('feedback');
  };

  const handleNextQuestion = () => {
    setGameState('quiz');
  };

  const handleNextLevel = () => {
    if (selectedLevel < 4) {
      setSelectedLevel(selectedLevel + 1);
      resetQuiz();
      setGameState('quiz');
    }
  };

  const handleRetryLevel = () => {
    resetQuiz();
    setGameState('quiz');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show login option for better experience if not authenticated
  if (!isAuthenticated && gameState === 'country-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <DarkModeToggle />
        
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center mb-8">
            <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold">🎯 Jugando como invitado</p>
              <p className="text-sm">Tu progreso no se guardará. <a href="/api/login" className="underline hover:text-yellow-900 dark:hover:text-yellow-100">Inicia sesión</a> para guardar tu puntuación.</p>
            </div>
          </div>
          <CountrySelection onCountrySelect={handleCountrySelect} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <DarkModeToggle />
      
      {gameState === 'country-selection' && (
        <CountrySelection onCountrySelect={handleCountrySelect} />
      )}
      
      {gameState === 'level-selection' && selectedCountry && (
        <LevelSelection
          selectedCountry={selectedCountry}
          onLevelSelect={handleLevelSelect}
          onBack={handleBackToCountries}
        />
      )}
      
      {gameState === 'quiz' && selectedCountry && (
        <QuizInterface
          selectedCountry={selectedCountry}
          selectedLevel={selectedLevel}
          onBack={handleBackToLevels}
          onComplete={handleQuizComplete}
        />
      )}
      
      {gameState === 'feedback' && selectedCountry && (answerResult || currentAnswerResult) && (
        <AnswerFeedback
          selectedCountry={selectedCountry}
          isCorrect={(answerResult || currentAnswerResult).isCorrect}
          points={(answerResult || currentAnswerResult).points}
          explanation={(answerResult || currentAnswerResult).explanation}
          correctAnswer={(answerResult || currentAnswerResult).correctAnswer}
          onNext={handleNextQuestion}
        />
      )}
      
      {gameState === 'results' && selectedCountry && (
        <QuizResults
          selectedCountry={selectedCountry}
          selectedLevel={selectedLevel}
          totalQuestions={10} // This should come from quiz state
          correctAnswers={8} // This should come from quiz state
          totalScore={850} // This should come from quiz state
          onNextLevel={handleNextLevel}
          onRetryLevel={handleRetryLevel}
          onBackToLevels={handleBackToLevels}
        />
      )}
      
      <BottomNavigation activeTab="play" />
    </div>
  );
}
