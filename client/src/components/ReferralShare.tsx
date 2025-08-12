import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Gift } from 'lucide-react';

interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  bonusHelps: number;
}

export function ReferralShare() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: referralInfo } = useQuery<ReferralInfo>({
    queryKey: ['/api/user/referral-info'],
    retry: false,
  });

  const copyToClipboard = async () => {
    if (!referralInfo?.referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralInfo.referralLink);
      setCopied(true);
      toast({
        title: "¡Enlace copiado!",
        description: "Comparte el enlace con tus amigos para ganar ayudas gratis",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      });
    }
  };

  const shareNative = async () => {
    if (!referralInfo?.referralLink) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '¿De dónde eres? - Quiz Cultural',
          text: '¡Únete a este divertido quiz cultural! Cuando respondas 3 preguntas correctas, me darán una ayuda gratis 🎉',
          url: referralInfo.referralLink,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      copyToClipboard();
    }
  };

  if (!referralInfo) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-green-600" />
          Invita Amigos y Gana Ayudas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Ayudas ganadas: {referralInfo.bonusHelps || 0}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Cada amigo que complete 3 respuestas correctas te da 1 ayuda gratis
              </p>
            </div>
            <div className="text-2xl">
              {referralInfo.bonusHelps > 0 ? '🎉' : '🎁'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tu enlace de invitación:</label>
          <div className="flex gap-2">
            <Input
              value={referralInfo.referralLink || ''}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              onClick={copyToClipboard}
              size="sm"
              variant="outline"
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
              {copied ? '¡Copiado!' : 'Copiar'}
            </Button>
          </div>
        </div>

        <Button 
          onClick={shareNative}
          className="w-full"
          size="lg"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Compartir Enlace
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>💡 Tip: Cuando tus amigos usen tu enlace y respondan 3 preguntas correctas, tú recibirás ayudas gratis que podrás usar en cualquier pregunta.</p>
        </div>
      </CardContent>
    </Card>
  );
}