import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DarkModeToggle } from '@/components/DarkModeToggle';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <DarkModeToggle />
      
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-12 animate-float">
          <h1 className="text-5xl md:text-7xl font-black text-gray-800 dark:text-white mb-6">
            ¿De dónde eres? 🌎
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-inter mb-8">
            Demuestra qué tan local eres con este quiz cultural
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-inter max-w-2xl mx-auto">
            Juega con el argot, las expresiones y los memes de tu país. 
            Desde Cuba hasta Honduras, ¡pon a prueba tu conocimiento cultural!
          </p>
        </div>

        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="flex justify-center space-x-4 text-4xl mb-4">
                <span>🇨🇺</span>
                <span>🇭🇳</span>
                <span>🇲🇽</span>
                <span>🇪🇸</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                ¡Empezar a jugar!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-inter">
                Inicia sesión para guardar tu progreso y competir con otros jugadores
              </p>
            </div>
            
            <Button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Iniciar sesión 🚀
            </Button>
            
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-inter">
              O juega como invitado (sin guardar progreso)
            </p>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full mt-2 py-2 rounded-xl font-semibold transition-colors"
            >
              Continuar como invitado
            </Button>
          </CardContent>
        </Card>

        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl w-full">
          <Card className="text-center shadow-lg">
            <CardContent className="p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-2">4 niveles</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-inter">
                Desde principiante hasta modo leyenda
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center shadow-lg">
            <CardContent className="p-6">
              <div className="text-3xl mb-3">🏆</div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-2">Puntuación</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-inter">
                Gana puntos y compite globalmente
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center shadow-lg">
            <CardContent className="p-6">
              <div className="text-3xl mb-3">🔄</div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-2">Actualizado</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-inter">
                Nuevos países y preguntas regularmente
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
