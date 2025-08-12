import { Home, Trophy, Play, Gift, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function BottomNavigation({ activeTab = 'play', onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'ranking', label: 'Ranking', icon: Trophy },
    { id: 'play', label: 'Jugar', icon: Play },
    { id: 'referral', label: 'Invitar', icon: Gift },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 md:hidden">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange?.(tab.id)}
              className={cn(
                "flex flex-col items-center p-2 transition-colors",
                isActive 
                  ? "text-blue-500 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-inter">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
