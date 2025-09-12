
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionGuard } from "@/components/guards/SubscriptionGuard";

import { InactiveUserMessage } from "@/components/auth/InactiveUserMessage";
import { AccessDeniedMessage } from "@/components/auth/AccessDeniedMessage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SubscriptionPage from "./pages/Subscription";
import SubscriptionSuccessPage from "./pages/SubscriptionSuccess";
import SubscriptionCancelPage from "./pages/SubscriptionCancel";

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
          
          <InactiveUserMessage />
          <AccessDeniedMessage />
          <BrowserRouter>
            <Routes>
              {/* Protected routes with subscription guard */}
              <Route path="/" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              <Route path="/dashboard" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              <Route path="/crm" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              <Route path="/financeiro" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              <Route path="/tarefas" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              <Route path="/clientes" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              <Route path="/contratos" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              <Route path="/cs" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              <Route path="/sucesso-cliente" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              <Route path="/configuracoes" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              <Route path="/admin" element={<SubscriptionGuard><Index /></SubscriptionGuard>} />
              
              {/* Subscription routes - always accessible */}
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
              <Route path="/subscription/cancel" element={<SubscriptionCancelPage />} />
              
              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
