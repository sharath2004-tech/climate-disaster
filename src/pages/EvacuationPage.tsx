import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { EvacuationSection } from "@/components/sections/EvacuationSection";

export default function EvacuationPage() {
  return (
    <SidebarLayout>
      <main className="min-h-screen">
        <EvacuationSection />
      </main>
    </SidebarLayout>
  );
}
