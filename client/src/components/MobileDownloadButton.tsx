import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';

export function MobileDownloadButton() {
  const handleDownloadClick = () => {
    // Check if device is mobile
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Show install instructions
      alert('Para instalar la app:\n\n📱 Android: Toca el menú (⋮) y selecciona "Instalar aplicación"\n\n🍎 iOS: Toca el botón compartir (⬆️) y selecciona "Añadir a pantalla de inicio"');
    } else {
      // Desktop - show QR code or deployment link
      alert('Accede desde tu móvil a esta URL para instalar la app:\n\n' + window.location.href);
    }
  };

  return (
    <Button
      onClick={handleDownloadClick}
      className="fixed bottom-24 right-4 z-40 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 md:bottom-4"
      size="lg"
    >
      <Smartphone className="w-5 h-5 mr-2" />
      Instalar App
    </Button>
  );
}