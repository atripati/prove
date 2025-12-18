import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, Minus, Share2, Copy, Check, ExternalLink, 
  Eye, EyeOff, Info, Calendar, FileText, Shield
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface ProofCardEnhancedProps {
  id: string;
  skill: string;
  category: string;
  evidence: string;
  trend: "improving" | "stable" | "strong";
  confidence: number;
  explanation: string;
  isShared?: boolean;
  shareToken?: string | null;
  createdAt?: string;
  onToggleShare?: (id: string, isShared: boolean) => Promise<unknown>;
  className?: string;
}

export function ProofCardEnhanced({
  id,
  skill,
  category,
  evidence,
  trend,
  confidence,
  explanation,
  isShared = false,
  shareToken,
  createdAt,
  onToggleShare,
  className,
}: ProofCardEnhancedProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

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
    confidence >= 0.5 ? "bg-confidence-high" :
    confidence >= 0.3 ? "bg-confidence-medium" :
    "bg-confidence-low";

  const getConfidenceLabel = () => {
    if (confidence >= 0.5) return "Developing";
    if (confidence >= 0.3) return "Emerging";
    return "Early Evidence";
  };

  const handleToggleShare = async () => {
    if (!onToggleShare) return;
    setIsToggling(true);
    try {
      await onToggleShare(id, !isShared);
    } finally {
      setIsToggling(false);
    }
  };

  const copyShareLink = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/verify?token=${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link copied",
      description: "Verification link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "group relative rounded-2xl bg-card border border-border p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/20",
          className
        )}
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

        {/* Confidence meter with label */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Confidence</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Confidence reflects the strength of observed evidence, not ability level. "Emerging" confidence means we've seen early indicators but need more data.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="font-medium flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-muted">{getConfidenceLabel()}</span>
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", confidenceColor)}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Explanation */}
        <div className="pt-4 border-t border-border mb-4">
          <p className="text-xs text-muted-foreground italic">
            "{explanation}"
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(true)}
            className="text-xs"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            View Details
          </Button>
          
          <div className="flex items-center gap-2">
            {isShared && shareToken && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyShareLink}
                className="text-xs"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 mr-1.5 text-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                )}
                Copy Link
              </Button>
            )}
            
            {onToggleShare && (
              <Button
                variant={isShared ? "outline" : "default"}
                size="sm"
                onClick={handleToggleShare}
                disabled={isToggling}
                className="text-xs"
              >
                {isShared ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                    Unshare
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 mr-1.5" />
                    Share
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Shared indicator */}
        {isShared && (
          <div className="absolute top-3 right-3">
            <Tooltip>
              <TooltipTrigger>
                <div className="p-1.5 rounded-full bg-primary/10">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>This card is publicly verifiable</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Proof Card Details
              </DialogTitle>
              <DialogDescription>
                Understanding this evidence summary
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* Card Info */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{skill}</span>
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{category}</span>
                </div>
                <p className="text-sm text-muted-foreground">{evidence}</p>
              </div>

              {/* What This Means */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">What This Means</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    This Proof Card was generated based on <strong>observed learning behavior</strong>, 
                    not a single test or assignment. It reflects patterns detected across multiple 
                    learning sessions.
                  </p>
                  <p>
                    <strong>Confidence level "{getConfidenceLabel()}"</strong> means PROOF has seen 
                    {confidence >= 0.5 
                      ? " consistent evidence of growth in this area, though more data would strengthen the claim."
                      : confidence >= 0.3
                      ? " early indicators of this skill, but more sessions are needed for stronger confidence."
                      : " initial signs of engagement with this skill. Continue learning to build stronger evidence."
                    }
                  </p>
                </div>
              </div>

              {/* Evidence Sources */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Evidence Sources</h4>
                <div className="text-sm text-muted-foreground">
                  <p>
                    PROOF distinguishes between:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Observed in PROOF</strong> — Learning sessions completed in PROOF's coding or writing spaces</li>
                    <li><strong>Submitted</strong> — Work you manually logged or uploaded</li>
                  </ul>
                  <p className="mt-2">
                    Higher confidence requires observed process evidence (error corrections, revisions, iteration).
                  </p>
                </div>
              </div>

              {/* Not a Grade */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Important:</strong> Proof Cards describe observed learning patterns, 
                  not grades or competency levels. They complement traditional assessment, not replace it.
                </p>
              </div>

              {/* Created Date */}
              {createdAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="w-3.5 h-3.5" />
                  Generated on {new Date(createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}

              {/* Verification Link */}
              {isShared && shareToken && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(`/verify?token=${shareToken}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Verification Page
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Glow effect on hover */}
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
      </div>
    </TooltipProvider>
  );
}
