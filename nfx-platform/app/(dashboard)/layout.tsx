import { AppSidebar } from '@/components/sidebar/AppSidebar'
import { PageTransition } from '@/components/providers/PageTransition'
import { BackgroundDecoration } from '@/components/ui/BackgroundDecoration'
import { DateFormatProvider } from '@/lib/date-format'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DateFormatProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <BackgroundDecoration />
        <AppSidebar />
        <main className="relative z-10 flex-1 overflow-y-auto">
          <PageTransition>
            <div className="mx-auto max-w-[1100px] px-6 py-8 lg:px-10 lg:py-10">
              {children}
            </div>
          </PageTransition>
        </main>
      </div>
    </DateFormatProvider>
  )
}
