import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { ResourceLocatorSection } from "@/components/sections/ResourceLocatorSection";

export default function ResourcesPage() {
  return (
    <SidebarLayout>
      <main className="min-h-screen">
        <ResourceLocatorSection />
      </main>
    </SidebarLayout>
  );
}
