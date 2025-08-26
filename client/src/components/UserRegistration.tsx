import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UserRegistrationProps {
  onSuccess: () => void;
  onBackToLanding?: () => void;
}

export function UserRegistration({ onSuccess, onBackToLanding }: UserRegistrationProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authMutation = useMutation({
    mutationFn: async (data: { username: string; email?: string; password: string; isLogin: boolean }) => {
      if (data.isLogin) {
        return await apiRequest('/api/auth/login', 'POST', {
          username: data.username,
          password: data.password
        });
      } else {
        return await apiRequest('/api/auth/register', 'POST', {
          username: data.username,
          email: data.email,
          password: data.password
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: isLogin ? "¡Bienvenido!" : "¡Cuenta creada!",
        description: isLogin ? "Has iniciado sesión correctamente" : "Tu cuenta ha sido creada exitosamente",
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Auth error:', error);
      let errorMessage = "Ha ocurrido un error";
      
      if (error?.message) {
        // Extract the actual error message from the response
        const message = error.message.toString();
        if (message.includes("409:")) {
          errorMessage = message.split("409:")[1]?.trim() || "Recurso ya existe";
        } else if (message.includes("400:")) {
          errorMessage = message.split("400:")[1]?.trim() || "Datos inválidos";
        } else if (message.includes("401:")) {
          errorMessage = message.split("401:")[1]?.trim() || "Credenciales inválidas";
        } else {
          errorMessage = message;
        }
      }
      
      // Ensure we show a user-friendly message
      if (errorMessage === "Ha ocurrido un error" || !errorMessage) {
        errorMessage = isLogin ? "Error al iniciar sesión" : "Error al crear la cuenta";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit triggered:', { isLogin, formData: { ...formData, password: '***' } });
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      console.log('Password mismatch error');
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }

    if (!isLogin && formData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (!isLogin && !formData.email) {
      toast({
        title: "Error",
        description: "El correo electrónico es requerido",
        variant: "destructive"
      });
      return;
    }

    if (!formData.username.trim()) {
      toast({
        title: "Error",
        description: "El nombre de usuario es requerido",
        variant: "destructive"
      });
      return;
    }

    console.log('About to submit mutation with:', { 
      username: formData.username, 
      email: formData.email, 
      hasPassword: !!formData.password,
      isLogin 
    });

    authMutation.mutate({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      isLogin
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin ? 'Ingresa a tu cuenta' : 'Únete a ¿De dónde eres?'}
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onBackToLanding?.()}
            className="w-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            ← Volver al inicio
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="ejemplo: miusuario123, user_name"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo letras, números, guiones y puntos (3-50 caracteres)
              </p>
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Tu contraseña"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirma tu contraseña"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={authMutation.isPending}
            >
              {authMutation.isPending ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </Button>

            {authMutation.isError && (
              <div className="text-sm text-red-600 dark:text-red-400 text-center mt-2">
                Revisa los datos e intenta nuevamente
              </div>
            )}
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isLogin ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Iniciar sesión'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}