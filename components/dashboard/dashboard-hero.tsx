import Image from "next/image";
import Link from "next/link";
import { Plus, Gauge, Calendar } from "lucide-react";
import { auth } from "@/auth";
import { businessToday } from "@/lib/date-ranges";
import { Button } from "@/components/ui/button";
import suzukiSpresso from "@/public/images/suzuki-spresso.jpg";
import styles from "./dashboard-hero.module.css";

export async function DashboardHero() {
  const session = await auth();
  const now = new Date();
  const date = businessToday(now);
  const today = date.toLocaleDateString("en-ZA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
  const hour = Number(new Intl.DateTimeFormat("en-ZA", {
    hour: "numeric", hourCycle: "h23", timeZone: "Africa/Johannesburg",
  }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = session?.user?.name?.trim();
  // The single-admin account has a branded name. Shorten it for display only.
  const displayName = !name || /^(admin|nita travels admin)$/i.test(name)
    ? "Admin"
    : name.charAt(0).toLocaleUpperCase("en-ZA") + name.slice(1);

  return (
    <section aria-labelledby="dashboard-greeting" className={`${styles.banner} rounded-[24px] border border-border-subtle shadow-soft`}>
      <div className={styles.content}>
        <div className="mb-4 flex w-fit max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium leading-5 text-[#A8B5C8]">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <time dateTime={date.toISOString().slice(0, 10)}>{today}</time>
        </div>

        <h1 id="dashboard-greeting" className={`${styles.greeting} mb-3 font-semibold tracking-tight text-white`}>
          {greeting}, {displayName}
        </h1>
        <p className="max-w-[480px] text-base leading-relaxed text-[#A8B5C8]">
          Track your fleet, manage expenses, and stay ahead of maintenance.
        </p>

        <div className={`${styles.actions} mt-6 flex gap-3`}>
          <Button asChild className="h-12 rounded-button bg-primary px-5 font-semibold text-white hover:bg-primary hover:brightness-95 focus-visible:ring-brand-blueAccent focus-visible:ring-offset-[#0B1220]">
            <Link href="/mileage/new">
              <Gauge aria-hidden="true" /> Log Mileage
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-button border-white/15 bg-[#142238] px-5 font-semibold text-white hover:border-white/25 hover:bg-[#1C304C] hover:text-white focus-visible:ring-brand-blueAccent focus-visible:ring-offset-[#0B1220]">
            <Link href="/transactions/new">
              <Plus aria-hidden="true" /> Log Transaction
            </Link>
          </Button>
        </div>
      </div>

      <div aria-hidden="true" className={styles.vehicle}>
        {/* Reframe the original scene around the car, without stretching it.
            Nested masks blend both axes without masking the vehicle itself. */}
        <div className={styles.vehicleFade}>
          <div className={styles.vehicleScene}>
            <Image
              src={suzukiSpresso}
              alt=""
              fill
              className="object-contain"
              sizes="(min-width: 1600px) 1176px, (min-width: 1024px) 95vw, 100vw"
              quality={90}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
