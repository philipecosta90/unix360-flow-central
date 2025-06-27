
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

export const NPSSettings = () => {
  const [npsRating, setNpsRating] = useState(0);
  const [npsComment, setNpsComment] = useState("");

  const handleSubmitNPS = () => {
    if (npsRating === 0) {
      toast.error("Selecione uma nota para enviar");
      return;
    }

    // Aqui você pode implementar a lógica para salvar o NPS do usuário
    toast.success("Obrigado pelo seu feedback!");
    setNpsRating(0);
    setNpsComment("");
  };

  const getNPSCategory = (nota: number) => {
    if (nota >= 9) return { label: "Promotor", color: "text-green-600 bg-green-100", icon: TrendingUp };
    if (nota >= 7) return { label: "Neutro", color: "text-yellow-600 bg-yellow-100", icon: Minus };
    return { label: "Detrator", color: "text-red-600 bg-red-100", icon: TrendingDown };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Avaliação do Sistema (NPS)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>O quanto você recomendaria nosso sistema para um colega?</Label>
          <p className="text-sm text-gray-500 mb-3">
            Avalie de 0 a 10, onde 0 significa "não recomendaria" e 10 significa "recomendaria fortemente"
          </p>
          <div className="flex space-x-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setNpsRating(num)}
                className={`w-8 h-8 rounded-full border text-sm font-medium transition-colors ${
                  npsRating === num
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          {npsRating > 0 && (
            <div className="mt-2">
              {(() => {
                const category = getNPSCategory(npsRating);
                return (
                  <span className={`text-sm px-2 py-1 rounded-full ${category.color}`}>
                    {category.label}
                  </span>
                );
              })()}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="nps-comment">Comentário (opcional)</Label>
          <Textarea
            id="nps-comment"
            value={npsComment}
            onChange={(e) => setNpsComment(e.target.value)}
            placeholder="Conte-nos mais sobre sua experiência com o sistema..."
            className="mt-1"
          />
        </div>
        
        <Button 
          onClick={handleSubmitNPS} 
          disabled={npsRating === 0}
          className="w-full"
        >
          Enviar Avaliação
        </Button>
      </CardContent>
    </Card>
  );
};
