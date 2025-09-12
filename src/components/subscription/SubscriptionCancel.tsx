import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SubscriptionCancel = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/subscription');
  };

  const handleGoToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <CardTitle className="text-red-800">Pagamento Cancelado</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.
          </p>

          <div className="space-y-2">
            <Button onClick={handleGoBack} className="w-full">
              Tentar Novamente
            </Button>
            
            <Button onClick={handleGoToDashboard} variant="outline" className="w-full">
              Voltar ao Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};