import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled in localStorage
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(darkMode);
    
    // Apply dark mode class to html element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('darkMode', newIsDark.toString());
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        onClick={toggleDarkMode}
        size="icon"
        variant="outline"
        className="bg-white dark:bg-gray-800 shadow-lg hover:scale-110 transition-all duration-300 rounded-full p-3"
      >
        {isDark ? (
          <Sun className="h-5 w-5 text-yellow-400" />
        ) : (
          <Moon className="h-5 w-5 text-gray-700" />
        )}
      </Button>
    </div>
  );
}
