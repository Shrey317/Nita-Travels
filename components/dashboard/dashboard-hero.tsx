import Image from "next/image";
import { businessToday } from "@/lib/date-ranges";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Gauge, Calendar } from "lucide-react";
import { RouteBackground } from "@/app/(auth)/login/components/RouteBackground"; // Reuse background

export function DashboardHero() {
  const today = businessToday().toLocaleDateString("en-ZA", { 
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" 
  });
  
  const timeStr = businessToday().toLocaleTimeString("en-ZA", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC"
  });

  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-[20px] bg-gradient-to-br from-surface-sidebar to-background border border-border-subtle p-6 sm:p-8 md:flex-row md:items-center">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 opacity-30 mix-blend-screen pointer-events-none">
        <RouteBackground />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted mb-4">
          <div className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface/50 px-3 py-1 backdrop-blur-md">
            <Calendar className="h-3.5 w-3.5" />
            {today}
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
          Good morning, admin 👋
        </h1>
        <p className="text-sm sm:text-base text-ink-secondary max-w-md">
          Here's what's happening with your fleet today. Monitor operations, expenses, and upcoming services.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild className="h-11 rounded-[12px] bg-primary hover:bg-primary-hover text-white shadow-soft font-semibold px-5">
            <Link href="/mileage/new">
              <Gauge className="mr-2 h-4 w-4" aria-hidden="true" /> Log Mileage
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-[12px] border-border-subtle bg-surface-elevated hover:bg-surface hover:text-white text-ink-secondary shadow-sm font-semibold px-5">
            <Link href="/transactions/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Log Transaction
            </Link>
          </Button>
        </div>
      </div>

      {/* Decorative Vehicle Image - hidden on very small screens */}
      <div className="relative z-10 hidden md:block w-1/3 h-[180px] mt-6 md:mt-0 pointer-events-none">
        <div className="absolute inset-0 right-[-10%] bottom-[-20%] scale-110">
          <Image 
             src="/images/suzuki-spresso.jpg" 
             alt="Fleet Vehicle"
             fill
             className="object-contain object-bottom drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]"
             priority
             sizes="(max-width: 1024px) 30vw, 20vw"
           />
        </div>
      </div>
    </div>
  );
}
