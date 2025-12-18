import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProofCardProps {
  skill: string;
  category: string;
  evidence: string;
  trend: "improving" | "stable" | "strong";
  confidence: number;
  explanation: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ProofCard({
  skill,
  category,
  evidence,
  trend,
  confidence,
  explanation,
  className,
  style,
}: ProofCardProps) {
  const trendConfig = {
    improving: {
      icon: TrendingUp,
      label: "Improving",
      color: "text-confidence-high",
      bg: "bg-confidence-high/10",
    },
    stable: {
      icon: Minus,
      label: "Stable",
      color: "text-confidence-medium",
      bg: "bg-confidence-medium/10",
    },
    strong: {
      icon: TrendingUp,
      label: "Strong Improvement",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  };

  const trendInfo = trendConfig[trend];
  const TrendIcon = trendInfo.icon;

  const confidenceColor = 
    confidence >= 0.7 ? "bg-confidence-high" :
    confidence >= 0.4 ? "bg-confidence-medium" :
    "bg-confidence-low";

  return (
    <div 
      className={cn(
        "group relative rounded-2xl bg-card border border-border p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/20",
        className
      )}
      style={style}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {category}
          </span>
          <h3 className="text-xl font-display font-semibold mt-1">{skill}</h3>
        </div>
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium", trendInfo.bg, trendInfo.color)}>
          <TrendIcon className="w-4 h-4" />
          {trendInfo.label}
        </div>
      </div>

      {/* Evidence summary */}
      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
        {evidence}
      </p>

      {/* Confidence meter */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium">{Math.round(confidence * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", confidenceColor)}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Explanation */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground italic">
          "{explanation}"
        </p>
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
    </div>
  );
}
