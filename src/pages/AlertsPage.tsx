import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { AlertsSection } from "@/components/sections/AlertsSection";

export default function AlertsPage() {
  return (
    <SidebarLayout>
      <main className="min-h-screen">
        <AlertsSection />
      </main>
    </SidebarLayout>
  );
}
