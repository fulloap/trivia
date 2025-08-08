import { useState, useEffect } from 'react';

interface CountryLocalization {
  code: string;
  name: string;
  flag: string;
  primaryColor: string;
  texts: {
    greeting: string;
    welcomeMessage: string;
    levelSelection: {
      title: string;
      subtitle: string;
      level1: string;
      level2: string;
      level3: string;
      level4: string;
      level1Description: string;
      level2Description: string;
      level3Description: string;
      level4Description: string;
    };
    quiz: {
      startButton: string;
      nextButton: string;
      submitAnswer: string;
      backToLevels: string;
      complete: string;
      timeUp: string;
    };
    feedback: {
      correct: string[];
      incorrect: string[];
      almostCorrect: string;
    };
    results: {
      celebration: string[];
      encouragement: string[];
      perfect: string;
      good: string;
      needsPractice: string;
    };
    navigation: {
      home: string;
      profile: string;
      logout: string;
      login: string;
    };
    cultural: {
      expressions: string[];
      transitions: string[];
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
      greeting: '¡Asere, qué bolá! ¿Tú eres de aquí?',
      welcomeMessage: '¡Óye, mi pana! Vamos a ver qué tan cubano tú eres de verdad. ¡Dale que esto está brutal!',
      levelSelection: {
        title: '¡Elige tu nivel, mi hermano!',
        subtitle: '¿Qué tan en talla estás con lo cubano?',
        level1: 'Yuma Principiante',
        level2: 'Cubano de Barrio',
        level3: 'Asere de Ley',
        level4: 'Modo Leyenda Cubana',
        level1Description: 'Para los que recién llegan a la isla, mi amor',
        level2Description: 'Ya tú sabes algunas cosas, pero falta más',
        level3Description: 'Tú estás en talla, asere, pero vamos a ver',
        level4Description: '¡Esto sí está candela! Solo para los más duros',
      },
      quiz: {
        startButton: '¡Dale que vamos!',
        nextButton: '¡Siguiente, mi pana!',
        submitAnswer: '¡A ver qué tal!',
        backToLevels: 'Regresa a los niveles',
        complete: '¡Se acabó, asere!',
        timeUp: '¡Se te acabó el tiempo, hermano!',
      },
      feedback: {
        correct: [
          '¡Brutal, asere!',
          '¡Qué bestia!',
          '¡Está candela eso!',
          '¡Tú sí estás en talla!',
          '¡Dale que tú sí sabes!',
          '¡Eso está como el arroz!'
        ],
        incorrect: [
          '¡Ay, no mi amor!',
          '¡Qué va, asere!',
          '¡Te zumbaste, mi pana!',
          '¡Eso no es así, hermano!',
          '¡Esa no era, mi amor!',
          '¡Te saliste del guacal!'
        ],
        almostCorrect: '¡Casi casi, pero no llegaste!',
      },
      results: {
        celebration: [
          '¡Qué bestia eres, asere!',
          '¡Tú sí que estás brutal!',
          '¡Eres más cubano que el ron!',
          '¡Dale que tú dominas esto!',
          '¡Estás más duro que un pan de tres días!'
        ],
        encouragement: [
          '¡Echa pa\'lante, mi pana!',
          '¡No te desesperes, que tú puedes!',
          '¡Sigue resolviendo, asere!',
          '¡Dale que la próxima es la buena!',
          '¡Tú vas a llegar, mi amor!'
        ],
        perfect: '¡Eres un fenómeno, asere! ¡100% cubano!',
        good: '¡Está bien, mi pana! Pero se puede mejor.',
        needsPractice: 'Tienes que estudiar más, mi amor. ¡Dale!',
      },
      navigation: {
        home: 'Inicio',
        profile: 'Mi Perfil',
        logout: 'Salir',
        login: 'Entrar',
      },
      cultural: {
        expressions: [
          '¡Asere, qué bolá!',
          '¡Dale que vamos!',
          '¡Está brutal eso!',
          '¡Qué bestia!',
          '¡Eso está candela!',
          '¡Tú estás en talla!',
          '¡Echa pa\'lante!',
          '¡No te zumbes!'
        ],
        transitions: [
          '¡A ver, mi pana...',
          '¡Óye, asere...',
          '¡Dale, hermano...',
          '¡Vamos a ver...',
          '¡Mira a ver...',
          '¡Bueno, mi amor...'
        ],
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
      welcomeMessage: '¡Pura vida, cipote! Vamos a ver qué tan catracho eres de verdad.',
      levelSelection: {
        title: '¡Elige tu nivel, maje!',
        subtitle: '¿Qué tan catracho eres de verdad?',
        level1: 'Cipote Nuevo',
        level2: 'Maje de Barrio',
        level3: 'Catracho de Ley',
        level4: 'Modo Leyenda',
        level1Description: 'Para los que recién llegan, cipote',
        level2Description: 'Ya sabés algunas cosas, maje',
        level3Description: 'Estás pilas, pero vamos a ver',
        level4Description: '¡Esto está macizo! Solo para los mejores',
      },
      quiz: {
        startButton: '¡Dale, maje!',
        nextButton: '¡Siguiente!',
        submitAnswer: '¡A ver!',
        backToLevels: 'Volver a niveles',
        complete: '¡Ya terminaste!',
        timeUp: '¡Se acabó el tiempo, cipote!',
      },
      feedback: {
        correct: [
          '¡Qué macizo, cipote!',
          '¡Está chivo eso!',
          '¡Qué bárbaro!',
          '¡Estás pilas!'
        ],
        incorrect: [
          '¡Uy, no maje!',
          '¡Te equivocaste, cipote!',
          '¡Esa no era!'
        ],
        almostCorrect: '¡Casi, pero no!',
      },
      results: {
        celebration: [
          '¡Qué bárbaro, hermano!',
          '¡Estás macizo, cipote!',
          '¡Sos todo un catracho!'
        ],
        encouragement: [
          '¡Dale que vos podés!',
          '¡Seguí intentando, maje!',
          '¡No te rajés!'
        ],
        perfect: '¡Sos un fenómeno, maje!',
        good: '¡Está bien, cipote!',
        needsPractice: 'Tenés que estudiar más, maje.',
      },
      navigation: {
        home: 'Inicio',
        profile: 'Mi Perfil',
        logout: 'Salir',
        login: 'Entrar',
      },
      cultural: {
        expressions: [
          '¡Ey maje!',
          '¡Qué macizo!',
          '¡Está chivo!',
          '¡Pura vida!'
        ],
        transitions: [
          '¡A ver, maje...',
          '¡Bueno, cipote...',
          '¡Dale, hermano...'
        ],
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

  const getText = (path: string, randomize: boolean = false): string => {
    if (!currentLocalization) return '';
    
    const keys = path.split('.');
    let value: any = currentLocalization.texts;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    if (randomize && Array.isArray(value)) {
      return value[Math.floor(Math.random() * value.length)];
    }
    
    return value || '';
  };

  const getRandomExpression = (): string => {
    if (!currentLocalization) return '';
    const expressions = currentLocalization.texts.cultural.expressions;
    return expressions[Math.floor(Math.random() * expressions.length)];
  };

  const getRandomTransition = (): string => {
    if (!currentLocalization) return '';
    const transitions = currentLocalization.texts.cultural.transitions;
    return transitions[Math.floor(Math.random() * transitions.length)];
  };

  return {
    currentLocalization,
    setCountry,
    getText,
    getRandomExpression,
    getRandomTransition,
    isLoaded: !!currentLocalization,
  };
}
