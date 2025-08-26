import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Trophy, Users, Gift, Smartphone, Play, Star, MapPin } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

export function Landing({ onGetStarted }: LandingProps) {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: Globe,
      title: "Cultura Auténtica",
      description: "Preguntas reales sobre slang, expresiones y costumbres de Cuba y Honduras",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Trophy,
      title: "Rankings Globales",
      description: "Compite con jugadores de todo el mundo y sube en las clasificaciones",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Gift,
      title: "Sistema de Referidos",
      description: "Invita amigos y gana ayudas extra para usar en tus partidas",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Users,
      title: "Comunidad Activa",
      description: "Miles de jugadores probando sus conocimientos culturales diariamente",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const countries = [
    { 
      name: "Cuba", 
      flag: "🇨🇺", 
      flagUrl: "https://www.banderas-mundo.es/data/flags/w580/cu.png",
      questions: "1,032" 
    },
    { 
      name: "Honduras", 
      flag: "🇭🇳", 
      flagUrl: "https://www.banderas-mundo.es/data/flags/w580/hn.png",
      questions: "1,032" 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/5 dark:to-purple-400/5" />
        
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
              ¡Nueva experiencia cultural!
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ¿De dónde eres?
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Demuestra cuánto conoces sobre la cultura, el slang y las tradiciones de tu país y otros
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card className="text-center border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">2,064</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Preguntas</div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">4</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Niveles</div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">2</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Países</div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">∞</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Diversión</div>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <Play className="w-6 h-6 mr-2" />
            ¡Empezar a Jugar!
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-white">
            ¿Por qué jugar?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Descubre todo lo que hace especial a nuestra trivia cultural
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-0 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Countries Section */}
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800 dark:text-white">
            Países Disponibles
          </h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {countries.map((country, index) => (
              <Card key={index} className="border-0 bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-16 mb-4 mx-auto relative overflow-hidden rounded-lg shadow-md">
                    <img 
                      src={country.flagUrl} 
                      alt={`Bandera de ${country.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to emoji if image fails
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="text-6xl flag-emoji hidden" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {country.flag}
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
                    {country.name}
                  </h4>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {country.questions} preguntas
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div className="text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800 dark:text-white">
            ¿Cómo funciona?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">1</div>
              <h4 className="text-xl font-bold mb-2">Elige tu país</h4>
              <p className="text-gray-600 dark:text-gray-300">Selecciona Cuba o Honduras para empezar</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">2</div>
              <h4 className="text-xl font-bold mb-2">Escoge el nivel</h4>
              <p className="text-gray-600 dark:text-gray-300">Desde principiante hasta modo leyenda</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold">3</div>
              <h4 className="text-xl font-bold mb-2">¡A jugar!</h4>
              <p className="text-gray-600 dark:text-gray-300">Responde preguntas y sube en el ranking</p>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Install Hint */}
      <div className="max-w-2xl mx-auto px-6 pb-16">
        <Card className="border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">¡Instala la App!</h3>
            <p className="text-blue-100 mb-4">
              Juega offline y recibe notificaciones de nuevas preguntas
            </p>
            <p className="text-sm text-blue-200">
              Disponible como PWA para todos los dispositivos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}