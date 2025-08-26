import { useState } from 'react';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CountrySelection } from '@/components/CountrySelection';
import { LevelSelection } from '@/components/LevelSelection';
import { QuizInterface } from '@/components/QuizInterface';
import { AnswerFeedback } from '@/components/AnswerFeedback';
import { QuizResults } from '@/components/QuizResults';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Rankings } from '@/components/Rankings';
import { ReferralShare } from '@/components/ReferralShare';
import { UserProfile } from '@/components/UserProfile';
import { UserRegistration } from '@/components/UserRegistration';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Landing } from '@/components/Landing';
import { useQuiz } from '@/hooks/useQuiz';
import { useLocalization } from '@/hooks/useLocalization';
import { Button } from '@/components/ui/button';
import { Trophy, User, LogOut } from 'lucide-react';
import type { Country } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type GameState = 'landing' | 'country-selection' | 'level-selection' | 'quiz' | 'feedback' | 'results' | 'rankings' | 'referral' | 'profile';

export default function Home() {
  const { user, isLoading } = useAuth();
  // Initialize gameState based on authentication status
  const [gameState, setGameState] = useState<GameState>('landing');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [currentAnswerResult, setCurrentAnswerResult] = useState<any>(null);
  const queryClient = useQueryClient();
  
  const { setCountry } = useLocalization(selectedCountry?.code);
  const { answerResult, resetQuiz } = useQuiz(selectedCountry?.code, selectedLevel);

  // Update gameState when user authentication changes
  React.useEffect(() => {
    if (!isLoading && user && gameState === 'landing') {
      setGameState('country-selection');
    }
  }, [user, isLoading, gameState]);

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('/api/auth/logout', 'POST'),
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });

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

  const handleShowRankings = () => {
    setGameState('rankings');
  };

  const handleBackToGame = () => {
    if (selectedCountry) {
      setGameState('level-selection');
    } else {
      setGameState('country-selection');
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show Landing page for non-authenticated users by default
  if (!user) {
    if (gameState === 'country-selection') {
      return <UserRegistration 
        onSuccess={() => window.location.reload()} 
        onBackToLanding={() => setGameState('landing')}
      />;
    }
    // Default: show landing page
    return <Landing onGetStarted={() => setGameState('country-selection')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pb-20">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">¿De dónde eres?</h1>
            {user && (
              <div className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                <User className="w-4 h-4" />
                {user.username}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={gameState === 'rankings' ? 'default' : 'outline'}
              size="sm"
              onClick={handleShowRankings}
              className="flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Rankings
            </Button>
            <DarkModeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cambiar Usuario
            </Button>
          </div>
        </div>
      </div>
      
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
      
      {gameState === 'rankings' && (
        <div className="pt-6">
          <div className="max-w-4xl mx-auto px-4 mb-4">
            <Button
              variant="outline"
              onClick={handleBackToGame}
              className="mb-4"
            >
              ← Volver al Juego
            </Button>
          </div>
          <Rankings selectedCountryCode={selectedCountry?.code} />
        </div>
      )}

      {gameState === 'referral' && (
        <div className="container mx-auto p-4 max-w-2xl">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setGameState('country-selection')}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </Button>
          </div>
          <ReferralShare />
        </div>
      )}

      {gameState === 'profile' && (
        <div className="container mx-auto p-4 max-w-2xl">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setGameState('country-selection')}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </Button>
          </div>
          <UserProfile />
        </div>
      )}
      
      <BottomNavigation 
        activeTab={
          gameState === 'rankings' ? 'ranking' : 
          gameState === 'referral' ? 'referral' : 
          gameState === 'profile' ? 'profile' : 
          'play'
        } 
        onTabChange={(tab) => {
          if (tab === 'ranking') setGameState('rankings');
          else if (tab === 'referral') setGameState('referral');
          else if (tab === 'profile') setGameState('profile');
          else if (tab === 'play' || tab === 'home') setGameState('country-selection');
        }}
      />
      
      <InstallPrompt />
    </div>
  );
}
