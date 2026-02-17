import { Unit } from "@/domain/schemas";
import { getSchoolTheme } from "./schoolColors";
import { Shield, Sword, Move, Zap } from "lucide-react";

interface PreviewCardProps {
  data: Unit;
}

export function PreviewCard({ data }: PreviewCardProps) {
  const theme = getSchoolTheme(data.magic_school);
  
  // Safe defaults
  const rank = data.rank || "?";
  const name = data.name || "Unknown Unit";
  const category = data.category || "Unit";
  const school = data.magic_school || "Neutral";

  // Stat helpers
  const statVal = (val?: number) => val !== undefined && val !== null ? val : "-";

  return (
    <div className="relative w-full max-w-[280px] mx-auto overflow-hidden rounded-2xl border border-slate-700 bg-[#1e2030] shadow-xl hover:shadow-2xl transition-all duration-300 group">
      {/* Background Gradient */}
      <div className={`absolute inset-0 h-32 bg-linear-to-b ${theme.gradient} to-[#1e2030] opacity-80 pointer-events-none transition-opacity group-hover:opacity-100`} />

      <div className="relative p-4 space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-full border border-white/10 shadow-sm ${theme.bg}`}>
                {school}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-600">
                Rank {rank}
            </span>
        </div>

        {/* Central Image Placeholder */}
        <div className="flex justify-center py-2">
            <div className="w-24 h-24 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/5 ring-1 ring-white/10 shadow-inner overflow-hidden relative">
                 {data.icon ? (
                     <img 
                        src={`/api/assets/${data.icon}`} 
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('fallback-active');
                        }}
                     />
                 ) : null}
                 
                 {/* Fallback Alien (absolute so it's behind image, or visible if image hidden) */}
                 <span className="text-4xl grayscale opacity-50 select-none absolute inset-0 flex items-center justify-center pointer-events-none -z-10 fallback-emoji">
                    👾
                 </span>
            </div>
        </div>

        {/* Name & Category */}
        <div className="text-center space-y-1">
            <h3 className="text-xl font-black text-white leading-tight tracking-tight drop-shadow-sm uppercase">
                {name}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8b5cf6] block">
                {category}
            </span>
        </div>

        {/* Mini Stat Grid */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/5">
            {/* HP */}
            <div className="flex flex-col items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold font-mono text-slate-300">{statVal(data.health)}</span>
            </div>
             {/* DMG */}
             <div className="flex flex-col items-center gap-1">
                <Sword className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs font-bold font-mono text-slate-300">{statVal(data.damage)}</span>
            </div>
             {/* RNG */}
             <div className="flex flex-col items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-bold font-mono text-slate-300">{statVal(data.attack_interval)}s</span>
            </div>
             {/* SPD */}
             <div className="flex flex-col items-center gap-1">
                <Move className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-slate-300">{statVal(data.movement_speed)}</span>
            </div>
        </div>
      </div>
    </div>
  );
}
