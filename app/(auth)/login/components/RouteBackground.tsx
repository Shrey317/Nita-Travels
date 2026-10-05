export function RouteBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-40">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0A1930_1px,transparent_1px),linear-gradient(to_bottom,#0A1930_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      
      {/* Glowing Route Lines */}
      <svg className="absolute top-[20%] left-[10%] w-[80%] h-[60%] overflow-visible stroke-[#2563EB]/30" fill="none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 0 50 Q 25 10 50 50 T 100 20" strokeWidth="0.5" strokeDasharray="2 2" className="animate-[shimmer_4s_linear_infinite]" />
        <path d="M 10 80 Q 40 40 70 80 T 100 90" strokeWidth="0.3" />
      </svg>
      
      {/* GPS Location Markers */}
      <div className="absolute top-[30%] left-[45%] h-2 w-2 rounded-full bg-[#3B82F6] shadow-[0_0_10px_#3B82F6]" />
      <div className="absolute top-[65%] left-[25%] h-1.5 w-1.5 rounded-full bg-[#60A5FA] shadow-[0_0_8px_#60A5FA]" />
      <div className="absolute top-[45%] left-[75%] h-2 w-2 rounded-full bg-[#3B82F6] shadow-[0_0_12px_#3B82F6]" />
      
      {/* Soft blue glow blobs */}
      <div className="absolute -left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-[#2563EB]/10 blur-[120px]" />
      <div className="absolute -bottom-[20%] right-[10%] h-[600px] w-[600px] rounded-full bg-[#0D9488]/5 blur-[100px]" />
    </div>
  );
}
