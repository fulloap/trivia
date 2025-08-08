import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Country } from '@shared/schema';

interface CountrySelectionProps {
  onCountrySelect: (country: Country) => void;
}

export function CountrySelection({ onCountrySelect }: CountrySelectionProps) {
  const { data: countries = [], isLoading } = useQuery<Country[]>({
    queryKey: ['/api/countries'],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Cargando países...</p>
      </div>
    );
  }

  const getCountryGreeting = (countryCode: string) => {
    const greetings: Record<string, string> = {
      cuba: '¡Qué tal, asere! ¿Tú eres de aquí?',
      honduras: '¡Ey maje! ¿Vos sos de por aquí?',
    };
    return greetings[countryCode] || '¿Eres de aquí?';
  };

  const getCountryPhrase = (countryCode: string) => {
    const phrases: Record<string, string> = {
      cuba: '"¡Dale que tú puedes, acere!"',
      honduras: '"¡Qué macizo, cipote!"',
    };
    return phrases[countryCode] || '"¡Vamos a jugar!"';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center mb-12 animate-float">
        <h1 className="text-4xl md:text-6xl font-black text-gray-800 dark:text-white mb-4">
          ¿De dónde eres? 🌎
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 font-inter">
          Demuestra qué tan local eres con este quiz cultural
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {countries.map((country: Country) => (
          <Card
            key={country.code}
            className="country-card bg-white dark:bg-gray-800 rounded-3xl shadow-xl cursor-pointer transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            onClick={() => onCountrySelect(country)}
          >
            <CardContent className="p-8">
              <div className="text-center">
                <div className="text-6xl mb-4 flag-emoji">
                  {country.code === 'cuba' && <span>🇨🇺</span>}
                  {country.code === 'honduras' && <span>🇭🇳</span>}
                  {!['cuba', 'honduras'].includes(country.code) && <span>🌎</span>}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  {country.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 font-inter">
                  {getCountryGreeting(country.code)}
                </p>
                <div 
                  className={cn(
                    "text-white rounded-xl p-4 mb-4",
                    country.code === 'cuba' ? 'bg-gradient-to-r from-orange-500 to-red-500' : 
                    country.code === 'honduras' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                    'bg-gradient-to-r from-gray-500 to-gray-600'
                  )}
                >
                  <p className="font-semibold">{getCountryPhrase(country.code)}</p>
                </div>
                <Button 
                  className={cn(
                    "w-full text-white py-3 rounded-xl font-semibold transition-colors",
                    country.code === 'cuba' ? 'bg-orange-500 hover:bg-orange-600' :
                    country.code === 'honduras' ? 'bg-blue-500 hover:bg-blue-600' :
                    'bg-gray-500 hover:bg-gray-600'
                  )}
                  style={{ backgroundColor: country.primaryColor }}
                >
                  Empezar Quiz {country.code === 'cuba' ? '🚀' : '🎯'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 font-inter">
          <span className="mr-2">➕</span>
          Próximamente: México, España, Venezuela, Colombia y más...
        </p>
      </div>
    </div>
  );
}
