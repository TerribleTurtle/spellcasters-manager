import { Unit } from "@/domain/schemas";
import { getSchoolTheme } from "./schoolColors";
import { AppMode } from "@/types";
import { 
  ArrowLeft, 
  History, 
  Zap, 
  Shield, 
  Sword, 
  Crosshair, 
  Wind, 
  Clock, 
  Footprints, 
  Ghost,
  Swords,
  Timer
} from "lucide-react";

interface PreviewDetailPageProps {
  data: Unit;
  mode: AppMode;
}

// Stat Grid Item
function StatItem({ label, value, icon: Icon, colorClass }: { label: string; value: string | number | undefined; icon: React.ComponentType<{ className?: string }>; colorClass?: string }) {
  const displayValue = value !== undefined && value !== null ? value : "-";
  return (
    <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center gap-1 border border-white/5 shadow-sm">
        <Icon className={`w-5 h-5 ${colorClass || "text-slate-400"}`} />
        <span className="text-xl font-bold text-white tracking-tight">{displayValue}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}

export function PreviewDetailPage({ data, mode }: PreviewDetailPageProps) {
  const theme = getSchoolTheme(data.magic_school);
  
  const name = data.name || "Unknown Unit";
  const school = data.magic_school || "Neutral";
  const description = data.description || "No description provided.";
  const rank = data.rank || "?";
  const category = data.category || "Unit";
  
  // Format changelog if present
  const changelog = (data.changelog || []) as Array<{ version: string; date?: string; description?: string; title?: string }>;





  // Movement Icon logic
  const MoveIcon = data.movement_type === 'Flying' ? Ghost : data.movement_type === 'Hover' ? Wind : Footprints;

  return (
    <div className="w-full bg-[#1e2030] min-h-full pb-8 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Header / Image Section Mock */}
      <div className={`relative h-64 w-full bg-linear-to-b ${theme.gradient} to-[#1e2030] flex items-center justify-center overflow-hidden`}>
          
          {/* Back Button Mock */}
          <div className="absolute top-4 left-4 z-10 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-black/60 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white" />
          </div>

          {/* Rank Badge */}
          <div className="absolute top-40 left-4 z-10">
             <div className="bg-slate-700/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/10 shadow-lg">
                Rank {rank}
             </div>
          </div>
          
           {/* School Badge */}
           <div className="absolute top-46 left-4 z-10">
             <div className={`text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg border border-white/10 ${theme.bg}`}>
                {school}
             </div>
          </div>

           {/* Category Badge */}
           <div className="absolute top-46 right-4 z-10">
             <div className="bg-[#8b5cf6] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg border border-white/10">
                {category}
             </div>
          </div>

          {/* Placeholder Image */}
          <div className="relative z-0 mt-8 transform hover:scale-105 transition-transform duration-500">
             <div className="w-48 h-48 bg-black/20 rounded-full blur-3xl absolute inset-0" />
             
             {/* Actual Image / Fallback */}
             <div className="w-48 h-48 relative flex items-center justify-center">
                 {data.icon ? (
                     <img 
                        src={`/api/assets/${mode}/${data.icon}`} 
                        alt={name}
                        className="w-full h-full object-contain drop-shadow-2xl relative z-10"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.querySelector('.fallback-emoji')?.classList.remove('hidden');
                        }}
                     />
                 ) : null}
                 
                 <div className={`text-9xl grayscale opacity-50 select-none absolute inset-0 flex items-center justify-center pointer-events-none z-0 fallback-emoji ${data.icon ? 'hidden' : ''}`}>
                    👾
                 </div>
             </div>
          </div>
      </div>

      <div className="px-6 -mt-6 relative z-10 space-y-6">
        
        {/* Title & Desc */}
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-md">{name}</h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                {description}
            </p>
        </div>

        {/* 3x3 Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
             {/* Row 1 */}
            <StatItem label="Health" value={data.health} icon={Shield} colorClass="text-emerald-400" />
            <StatItem label="DPS" value={data.dps} icon={Swords} colorClass="text-orange-400" />
            <StatItem label="Damage" value={data.damage} icon={Sword} colorClass="text-rose-400" />
            
             {/* Row 2 */}
            <StatItem label="Atk Speed" value={data.attack_interval ? `${data.attack_interval}s` : undefined} icon={Zap} colorClass="text-yellow-400" />
            <StatItem label="Range" value={data.range} icon={Crosshair} colorClass="text-cyan-400" />
            <StatItem label="Speed" value={data.movement_speed} icon={Clock} colorClass="text-blue-400" />
            
             {/* Row 3 */}
            <StatItem label="Move Type" value={data.movement_type} icon={MoveIcon} colorClass="text-slate-300" />
            <StatItem label="Charges" value={data.charges} icon={Zap} colorClass="text-purple-400" />
            <StatItem label="Recharge" value={data.recharge_time ? `${data.recharge_time}s` : undefined} icon={Timer} colorClass="text-indigo-400" />
        </div>

        {/* Mechanics */}
        {data.mechanics && (
             <div className="space-y-3">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Mechanics</h3>
                 <div className="space-y-2">
                    {/* Render arbitrary mechanics */}
                    {Object.entries(data.mechanics).map(([key, value]) => {
                         // Attempt to format known mechanic shapes or just dump
                         if (key === 'damage_modifiers' && Array.isArray(value)) {
                             return (value as Array<{ multiplier: number; target_types?: string[] }>).map((mod, idx) => (
                                <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
                                    <div className="p-1.5 bg-red-500/20 rounded-full">
                                        <Sword className="w-3.5 h-3.5 text-red-400" />
                                    </div>
                                    <span className="text-sm font-medium text-red-200">
                                        {(mod.multiplier * 100) - 100}% Damage vs <span className="text-white font-bold">{mod.target_types?.join(", ")}</span>
                                    </span>
                                </div>
                             ));
                         }
                         
                         return (
                            <div key={key} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">{key.replace(/_/g, " ")}</h4>
                                <pre className="text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono">
                                    {JSON.stringify(value, null, 2)}
                                </pre>
                            </div>
                        );
                    })}
                 </div>
             </div>
        )}

        {/* Patch History Section */}
        <div className="pt-6 border-t border-slate-800">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <History className="w-3.5 h-3.5" />
                  Patch History
            </h2>
            
            {changelog.length === 0 ? (
                 <p className="text-xs text-slate-600 italic">No history available.</p>
            ) : (
                <div className="space-y-4 relative border-l border-slate-800 ml-1.5 pl-6 pb-2">
                    {/* Reverse reverse! Newest first */}
                    {[...changelog].reverse().map((entry, i) => (
                          <div key={i} className="relative">
                              <div className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-[#1e2030] ring-1 ring-slate-800" />
                              <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-200">{entry.version}</span>
                                      <span className="text-[10px] text-slate-500">
                                          {entry.date ? new Date(entry.date).toLocaleDateString() : ""}
                                      </span>
                                  </div>
                                  <p className="text-xs text-slate-400 leading-tight">
                                      {entry.description || entry.title || "Update"}
                                  </p>
                              </div>
                          </div>
                      ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
