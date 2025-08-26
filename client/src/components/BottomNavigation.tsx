import { Home, Trophy, Play, Gift, User, Download } from 'lucide-react';
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

  // Handle PWA install
  const handleInstallClick = () => {
    if ('serviceWorker' in navigator) {
      // For mobile browsers, show install instructions
      alert('Accede desde tu móvil a esta URL para instalar la app:\n\n' + window.location.href);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-2">
      <div className="flex justify-between items-center">
        <div className="flex justify-around items-center flex-1">
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
        
        {/* Install App Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleInstallClick}
          className="ml-2 flex flex-col items-center p-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
        >
          <Download className="h-4 w-4 mb-1" />
          <span className="text-xs font-inter">App</span>
        </Button>
      </div>
    </div>
  );
}
