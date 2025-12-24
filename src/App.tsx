
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { InactiveUserMessage } from "@/components/auth/InactiveUserMessage";
import { AccessDeniedMessage } from "@/components/auth/AccessDeniedMessage";
import { SubscriptionExpiredDialog } from "@/components/subscription/SubscriptionExpiredDialog";
import { UpdateNotification } from "@/components/common/UpdateNotification";
import { ResetPasswordPage } from "@/components/auth/ResetPasswordPage";
import { AnamnesePublicPage } from "@/components/anamnese/AnamnesePublicPage";
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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
            <SubscriptionExpiredDialog />
            <UpdateNotification />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/anamnese/preencher/:token" element={<AnamnesePublicPage />} />
                
                {/* All routes - now directly accessible */}
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/crm" element={<Index />} />
                <Route path="/financeiro" element={<Index />} />
                <Route path="/tarefas" element={<Index />} />
                <Route path="/clientes" element={<Index />} />
                <Route path="/anamnese" element={<Index />} />
                <Route path="/contratos" element={<Index />} />
                <Route path="/cs" element={<Index />} />
                <Route path="/sucesso-cliente" element={<Index />} />
                <Route path="/whatsapp" element={<Index />} />
                <Route path="/configuracoes" element={<Index />} />
                <Route path="/admin" element={<Index />} />
                
                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
