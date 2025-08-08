import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Gamepad2 } from 'lucide-react';
import { usernameSchema } from '@shared/schema';

export function UserRegistration() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest('POST', '/api/auth/register', { username });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      const errorMessage = error.message?.includes('409:') 
        ? 'Este nombre de usuario ya está en uso' 
        : error.message || 'Error al crear el usuario';
      setError(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const validatedUsername = usernameSchema.parse(username);
      registerMutation.mutate(validatedUsername);
    } catch (error: any) {
      if (error.errors) {
        setError(error.errors[0].message);
      } else {
        setError('Nombre de usuario inválido');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">¡Bienvenido al Quiz!</CardTitle>
            <CardDescription className="mt-2">
              Elige un nombre único para comenzar a jugar y competir en los rankings
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombre de usuario
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Tu nombre único..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-center"
                disabled={registerMutation.isPending}
              />
              <p className="text-xs text-muted-foreground text-center">
                Solo letras, números y guiones bajos (3-50 caracteres)
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={registerMutation.isPending || !username.trim()}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando usuario...
                </>
              ) : (
                <>
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  ¡Comenzar a Jugar!
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">¿Qué puedes hacer?</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Jugar quizzes culturales de diferentes países</li>
              <li>• Competir en rankings por país y globales</li>
              <li>• Acumular puntos y mejorar tu posición</li>
              <li>• ¡Tu nombre será único y nadie más lo podrá usar!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}