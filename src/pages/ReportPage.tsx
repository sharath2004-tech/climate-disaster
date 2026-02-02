import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { CitizenReportingSection } from "@/components/sections/CitizenReportingSection";

export default function ReportPage() {
  return (
    <SidebarLayout>
      <main className="min-h-screen">
        <CitizenReportingSection />
      </main>
    </SidebarLayout>
  );
}
