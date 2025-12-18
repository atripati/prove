import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SkillBadgeProps {
  name: string;
  level: "beginner" | "developing" | "proficient" | "advanced";
  icon?: LucideIcon;
  progress?: number;
  className?: string;
}

const levelConfig = {
  beginner: {
    label: "Beginner",
    color: "bg-skill-blue/10 text-skill-blue border-skill-blue/20",
  },
  developing: {
    label: "Developing",
    color: "bg-skill-purple/10 text-skill-purple border-skill-purple/20",
  },
  proficient: {
    label: "Proficient",
    color: "bg-skill-pink/10 text-skill-pink border-skill-pink/20",
  },
  advanced: {
    label: "Advanced",
    color: "bg-skill-orange/10 text-skill-orange border-skill-orange/20",
  },
};

export function SkillBadge({
  name,
  level,
  icon: Icon,
  progress,
  className,
}: SkillBadgeProps) {
  const config = levelConfig[level];

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 hover:scale-105",
      config.color,
      className
    )}>
      {Icon && <Icon className="w-4 h-4" />}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs opacity-70">{config.label}</span>
      </div>
      {progress !== undefined && (
        <div className="ml-2 w-8 h-8 relative">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeOpacity="0.2"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${progress * 88} 88`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
