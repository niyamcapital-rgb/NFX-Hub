import { AppSidebar } from '@/components/sidebar/AppSidebar'
import { PageTransition } from '@/components/providers/PageTransition'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <PageTransition>
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </PageTransition>
      </main>
    </div>
  )
}
