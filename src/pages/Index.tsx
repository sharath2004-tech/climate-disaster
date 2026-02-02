import { Footer } from "@/components/layout/Footer";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { AIAssistantSection } from "@/components/sections/AIAssistantSection";
import { AlertsSection } from "@/components/sections/AlertsSection";
import { CitizenReportingSection } from "@/components/sections/CitizenReportingSection";
import { EmergencyAlertsBanner } from "@/components/sections/EmergencyAlertsBanner";
import { EvacuationSection } from "@/components/sections/EvacuationSection";
import { HazardMapSection } from "@/components/sections/HazardMapSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { LiveSituationDashboardReal } from "@/components/sections/LiveSituationDashboardReal";
import { ResourceLocatorSection } from "@/components/sections/ResourceLocatorSection";

const Index = () => {
  return (
    <SidebarLayout>
      <main>
        <EmergencyAlertsBanner />
        <HeroSection />
        <LiveSituationDashboardReal />
        <HazardMapSection />
        <AlertsSection />
        <AIAssistantSection />
        <EvacuationSection />
        <ResourceLocatorSection />
        <CitizenReportingSection />
      </main>
      <Footer />
    </SidebarLayout>
  );
};

export default Index;
