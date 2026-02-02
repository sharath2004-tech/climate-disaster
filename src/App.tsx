import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import AlertsPage from "./pages/AlertsPage";
import AssistantPage from "./pages/AssistantPage";
import CommunityPage from "./pages/CommunityPage";
import EvacuationPage from "./pages/EvacuationPage";
import Index from "./pages/Index";
import LearnPage from "./pages/LearnPage";
import Login from "./pages/Login";
import MapPage from "./pages/MapPage";
import NotFound from "./pages/NotFound";
import ReportPage from "./pages/ReportPage";
import ResourcesPage from "./pages/ResourcesPage";
import Signup from "./pages/Signup";
import WeatherMapPage from "./pages/WeatherMapPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/evacuation" element={<EvacuationPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/weather-map" element={<WeatherMapPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/alerts" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
