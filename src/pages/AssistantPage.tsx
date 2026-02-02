import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { AIAssistantSection } from "@/components/sections/AIAssistantSection";

export default function AssistantPage() {
  return (
    <SidebarLayout>
      <main className="min-h-screen">
        <AIAssistantSection />
      </main>
    </SidebarLayout>
  );
}
