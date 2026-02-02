import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { HazardMapSection } from "@/components/sections/HazardMapSection";

export default function MapPage() {
  return (
    <SidebarLayout>
      <main className="min-h-screen">
        <HazardMapSection />
      </main>
    </SidebarLayout>
  );
}
