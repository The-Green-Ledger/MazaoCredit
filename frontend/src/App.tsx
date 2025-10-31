import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import MarketplacePage from "./pages/MarketplacePage";
import CarbonPage from "./pages/CarbonPage";
import News from "./pages/News";
import FinancialPage from "./pages/FinancialPage";
import FarmRegistration from "./pages/FarmRegistration";
import FarmRecords from "./pages/FarmRecords";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/news" element={<News />} />
          <Route path="/carbon" element={<ProtectedRoute><CarbonPage /></ProtectedRoute>} />
          <Route path="/financial" element={<ProtectedRoute><FinancialPage /></ProtectedRoute>} />
          <Route path="/farm-registration" element={<ProtectedRoute><FarmRegistration /></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute><FarmRecords /></ProtectedRoute>} />
          {/* Partner Dashboard removed */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
