import { AppSidebar } from '@/components/sidebar/AppSidebar'
import { PageTransition } from '@/components/providers/PageTransition'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <PageTransition>
          <div className="p-8 lg:p-10">
            {children}
          </div>
        </PageTransition>
      </main>
    </div>
  )
}
