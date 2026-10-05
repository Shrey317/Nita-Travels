import { BrandLogo } from "./BrandLogo";
import { FeatureItem } from "./FeatureItem";
import { RouteBackground } from "./RouteBackground";
import { ChartNoAxesColumnIncreasing, ShieldCheck, MapPin } from "lucide-react";
import Image from "next/image";

export function LoginHero() {
  return (
    <div className="relative hidden w-full lg:flex lg:w-[62%] flex-col justify-between bg-[#050B18] overflow-hidden p-12 xl:p-16">
      <RouteBackground />
      
      {/* Top Branding */}
      <div className="relative z-10 animate-slide-up">
        <BrandLogo />
      </div>
      
      {/* Middle Content */}
      <div className="relative z-10 mt-20 max-w-2xl animate-fade-in [animation-delay:200ms]">
        <h2 className="text-[48px] xl:text-[60px] font-extrabold leading-[1.1] tracking-tight text-[#F8FAFC]">
          Smarter Fleet<br />
          Operations{" "}
          <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#2563EB] bg-clip-text text-transparent">
            for a Brighter Tomorrow
          </span>
        </h2>
        
        <p className="mt-6 max-w-xl text-lg text-[#AAB7CC] leading-relaxed">
          Track. Manage. Optimize. Keep your fleet moving with real-time insights and complete control.
        </p>
        
        <div className="mt-12 flex flex-wrap gap-8">
          <div className="animate-fade-in [animation-delay:400ms]">
            <FeatureItem icon={<ChartNoAxesColumnIncreasing className="h-4 w-4 text-[#60A5FA]" />} label="Real-Time Tracking" />
          </div>
          <div className="animate-fade-in [animation-delay:500ms]">
            <FeatureItem icon={<ShieldCheck className="h-4 w-4 text-[#60A5FA]" />} label="Safer & More Efficient" />
          </div>
          <div className="animate-fade-in [animation-delay:600ms]">
            <FeatureItem icon={<MapPin className="h-4 w-4 text-[#60A5FA]" />} label="Complete Visibility" />
          </div>
        </div>
      </div>
      
      {/* Bottom Vehicle Artwork */}
      <div className="relative z-10 mt-auto h-[35vh] min-h-[300px] w-full animate-fade-in [animation-delay:800ms] pointer-events-none">
        <div className="absolute bottom-[-10%] right-[-5%] w-[90%] h-[110%] opacity-90">
           <Image 
             src="/images/suzuki-spresso.jpg" 
             alt="Suzuki S-Presso Fleet Vehicle"
             fill
             className="object-contain object-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]"
             priority
             sizes="(max-width: 1024px) 100vw, 60vw"
           />
        </div>
        {/* Subtle ground reflection/shadow */}
        <div className="absolute bottom-[20px] right-[20%] w-[60%] h-[20px] rounded-[100%] bg-[#3B82F6]/5 blur-xl" />
      </div>
    </div>
  );
}
