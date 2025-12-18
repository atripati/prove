import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, FileCode, FileText, GitBranch } from "lucide-react";

interface Activity {
  id: string;
  type: "code" | "document" | "commit" | "review";
  title: string;
  description: string;
  timestamp: string;
  skillsDetected: string[];
}

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
}

const activityIcons: Record<string, typeof FileCode> = {
  code: FileCode,
  "Code Work": FileCode,
  document: FileText,
  "Document/Writing": FileText,
  commit: GitBranch,
  "Git Commit": GitBranch,
  review: CheckCircle2,
  "Self-Review": CheckCircle2,
  Other: FileText,
};

const activityColors: Record<string, string> = {
  code: "bg-skill-blue/10 text-skill-blue",
  "Code Work": "bg-skill-blue/10 text-skill-blue",
  document: "bg-skill-purple/10 text-skill-purple",
  "Document/Writing": "bg-skill-purple/10 text-skill-purple",
  commit: "bg-skill-orange/10 text-skill-orange",
  "Git Commit": "bg-skill-orange/10 text-skill-orange",
  review: "bg-confidence-high/10 text-confidence-high",
  "Self-Review": "bg-confidence-high/10 text-confidence-high",
  Other: "bg-muted text-muted-foreground",
};

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <div className={cn("rounded-2xl bg-card border border-border p-6", className)}>
      <h3 className="text-lg font-display font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activityIcons[activity.type] || FileText;
          const colorClass = activityColors[activity.type] || "bg-muted text-muted-foreground";
          
          return (
            <div 
              key={activity.id}
              className="flex gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={cn("p-2 rounded-lg h-fit", colorClass)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm truncate">{activity.title}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.timestamp}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {activity.description}
                </p>
                {activity.skillsDetected.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {activity.skillsDetected.map((skill) => (
                      <span 
                        key={skill}
                        className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
