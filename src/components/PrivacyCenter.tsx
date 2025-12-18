import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, Eye, EyeOff, CheckCircle, XCircle, 
  Keyboard, Clipboard, Camera, MapPin, Clock, 
  FileCode, Edit3, Play, RotateCcw, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackingItem {
  icon: React.ElementType;
  label: string;
  description: string;
  tracked: boolean;
  reason?: string;
}

const TRACKING_DATA: { tracked: TrackingItem[]; notTracked: TrackingItem[] } = {
  tracked: [
    {
      icon: Edit3,
      label: "Edit Cycles",
      description: "Number of times code was meaningfully changed (debounced, not per keystroke)",
      tracked: true,
      reason: "Indicates iterative learning behavior",
    },
    {
      icon: Play,
      label: "Code Executions",
      description: "How many times you ran your code",
      tracked: true,
      reason: "Shows experimentation and testing",
    },
    {
      icon: RotateCcw,
      label: "Error-Correction Cycles",
      description: "Times you fixed an error after seeing it",
      tracked: true,
      reason: "Key indicator of learning and problem-solving",
    },
    {
      icon: Clock,
      label: "Session Duration",
      description: "How long your learning session lasted",
      tracked: true,
      reason: "Provides context for other signals",
    },
    {
      icon: FileCode,
      label: "Final Code/Content Length",
      description: "Character count of your final submission",
      tracked: true,
      reason: "Provides context, not used for evaluation",
    },
  ],
  notTracked: [
    {
      icon: Keyboard,
      label: "Keystrokes",
      description: "Individual key presses or typing patterns",
      tracked: false,
      reason: "Too invasive, not relevant to learning",
    },
    {
      icon: Clipboard,
      label: "Clipboard History",
      description: "Copy/paste contents or history",
      tracked: false,
      reason: "Privacy violation, could contain sensitive data",
    },
    {
      icon: Camera,
      label: "Screen Recording",
      description: "Screenshots or video of your screen",
      tracked: false,
      reason: "Surveillance, not learning observation",
    },
    {
      icon: MapPin,
      label: "Location Data",
      description: "Where you are physically located",
      tracked: false,
      reason: "Irrelevant to learning, privacy violation",
    },
    {
      icon: Eye,
      label: "Eye Tracking",
      description: "Where you look on screen",
      tracked: false,
      reason: "Proctoring tool, not learning tool",
    },
    {
      icon: AlertTriangle,
      label: "Cheating Detection",
      description: "Tab switches, browser focus, etc.",
      tracked: false,
      reason: "PROOF is not a proctoring system",
    },
  ],
};

export function PrivacyCenter() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display">Privacy & Tracking</CardTitle>
            <CardDescription>What PROOF observes — and what it never will</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* What we track */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="w-4 h-4" />
            What PROOF observes (learning signals only)
          </div>
          <div className="grid gap-2">
            {TRACKING_DATA.tracked.map((item) => (
              <TrackingItemCard key={item.label} item={item} />
            ))}
          </div>
        </div>

        {/* What we don't track */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <EyeOff className="w-4 h-4" />
            What PROOF will never track
          </div>
          <div className="grid gap-2">
            {TRACKING_DATA.notTracked.map((item) => (
              <TrackingItemCard key={item.label} item={item} />
            ))}
          </div>
        </div>

        {/* Commitment */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Our Commitment
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• You own your data — export or delete anytime</li>
            <li>• We observe learning process, not content correctness</li>
            <li>• AI analysis is probabilistic and explainable</li>
            <li>• Nothing is shared without your explicit permission</li>
            <li>• PROOF supports learning — it does not punish mistakes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function TrackingItemCard({ item }: { item: TrackingItem }) {
  const Icon = item.icon;
  
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        item.tracked 
          ? "bg-primary/5 border-primary/20" 
          : "bg-muted/50 border-transparent"
      )}
    >
      <div className={cn(
        "p-1.5 rounded",
        item.tracked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{item.label}</span>
          {item.tracked ? (
            <CheckCircle className="w-3.5 h-3.5 text-primary" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
        {item.reason && (
          <p className="text-xs text-muted-foreground/70 mt-1 italic">
            {item.tracked ? "Why: " : "Reason: "}{item.reason}
          </p>
        )}
      </div>
    </div>
  );
}
