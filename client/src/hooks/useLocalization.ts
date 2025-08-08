import { useState, useEffect } from 'react';

interface CountryLocalization {
  code: string;
  name: string;
  flag: string;
  primaryColor: string;
  texts: {
    greeting: string;
    levelSelection: {
      title: string;
      subtitle: string;
      level2: string;
      level3: string;
    };
    feedback: {
      correct: string;
      incorrect: string;
    };
    results: {
      celebration: string;
      encouragement: string;
    };
  };
}

const countryLocalizations: Record<string, CountryLocalization> = {
  cuba: {
    code: 'cuba',
    name: 'Cuba',
    flag: '🇨🇺',
    primaryColor: '#FF6B35',
    texts: {
      greeting: '¡Qué tal, asere! ¿Tú eres de aquí?',
      levelSelection: {
        title: '¡Elige tu nivel, asere!',
        subtitle: '¿Qué tan cubano eres de verdad?',
        level2: 'Soy de aquí, asere',
        level3: 'Estoy duro, pinga',
      },
      feedback: {
        correct: '¡Brutal, asere!',
        incorrect: '¡Ay, no mi amor!',
      },
      results: {
        celebration: '¡Qué bestia, asere!',
        encouragement: '¡Echa pa\'lante, mi pana!',
      },
    },
  },
  honduras: {
    code: 'honduras',
    name: 'Honduras',
    flag: '🇭🇳',
    primaryColor: '#1E88E5',
    texts: {
      greeting: '¡Ey maje! ¿Vos sos de por aquí?',
      levelSelection: {
        title: '¡Elige tu nivel, maje!',
        subtitle: '¿Qué tan catracho eres de verdad?',
        level2: 'Soy de aquí, maje',
        level3: 'Estoy macizo, cipote',
      },
      feedback: {
        correct: '¡Qué macizo, cipote!',
        incorrect: '¡Uy, no maje!',
      },
      results: {
        celebration: '¡Qué bárbaro, hermano!',
        encouragement: '¡Dale que vos podés!',
      },
    },
  },
};

export function useLocalization(countryCode?: string) {
  const [currentLocalization, setCurrentLocalization] = useState<CountryLocalization | null>(null);

  useEffect(() => {
    if (countryCode && countryLocalizations[countryCode]) {
      setCurrentLocalization(countryLocalizations[countryCode]);
    } else {
      setCurrentLocalization(null);
    }
  }, [countryCode]);

  const setCountry = (code: string) => {
    if (countryLocalizations[code]) {
      setCurrentLocalization(countryLocalizations[code]);
    }
  };

  const getText = (path: string): string => {
    if (!currentLocalization) return '';
    
    const keys = path.split('.');
    let value: any = currentLocalization.texts;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    return value || '';
  };

  return {
    currentLocalization,
    setCountry,
    getText,
    isLoaded: !!currentLocalization,
  };
}
