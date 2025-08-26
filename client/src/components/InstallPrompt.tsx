import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS install prompt if on iOS and not already installed
    if (isIOSDevice && !(window.navigator as any).standalone) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if user already dismissed or if already installed
  if (!showPrompt || localStorage.getItem('installPromptDismissed') || (window.navigator as any).standalone) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 border-2 border-primary/20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg md:left-auto md:right-4 md:max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">¡Instala la App!</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {isIOS 
                ? "Instala ¿De dónde eres? en tu iPhone para una mejor experiencia"
                : "Añade ¿De dónde eres? a tu pantalla de inicio para acceso rápido"
              }
            </p>
            
            {isIOS ? (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>1. Toca el botón compartir <span className="inline-block">⬆️</span></p>
                <p>2. Selecciona "Añadir a pantalla de inicio"</p>
              </div>
            ) : (
              <Button 
                onClick={handleInstallClick} 
                size="sm" 
                className="w-full"
                disabled={!deferredPrompt}
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar App
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="p-1 h-auto text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}