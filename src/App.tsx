
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthDebug } from "@/components/debug/AuthDebug";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const badge = document.querySelector("a.lovable-badge");
    if (badge) badge.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <style>
            {`
              a.lovable-badge {
                display: none !important;
              }
            `}
          </style>
          <Toaster />
          <Sonner />
          <AuthDebug />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/crm" element={<Index />} />
              <Route path="/financeiro" element={<Index />} />
              <Route path="/tarefas" element={<Index />} />
              <Route path="/clientes" element={<Index />} />
              <Route path="/contratos" element={<Index />} />
              <Route path="/cs" element={<Index />} />
              <Route path="/sucesso-cliente" element={<Index />} />
              <Route path="/configuracoes" element={<Index />} />
              <Route path="/admin" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
