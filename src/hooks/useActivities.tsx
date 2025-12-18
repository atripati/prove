import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";
import type { Json } from "@/integrations/supabase/types";

export interface LearningSignals {
  edit_count?: number;
  run_count?: number;
  error_count?: number;
  successful_runs?: number;
  error_correction_cycles?: number;
  time_between_runs_avg_seconds?: number | null;
  revision_count?: number;
  word_count_changes?: number[];
  auto_save_count?: number;
  time_between_revisions_avg_seconds?: number | null;
  session_duration_seconds?: number;
  final_code_length?: number;
  final_word_count?: number;
}

export interface Activity {
  id: string;
  type: "code" | "document" | "commit" | "review" | "upload" | "manual";
  title: string;
  description: string | null;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  skills_practiced: string[];
  duration_minutes: number | null;
  insights: string | null;
  evidence_source: "submitted" | "observed_in_proof";
  learning_signals: LearningSignals | null;
  created_at: string;
}

export function useActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActivities((data || []) as Activity[]);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [user]);

  const addActivity = async (activity: Omit<Activity, "id" | "created_at">) => {
    if (!user) return null;

    try {
      const insertData = {
        user_id: user.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        content: activity.content,
        file_url: activity.file_url,
        file_type: activity.file_type,
        skills_practiced: activity.skills_practiced,
        duration_minutes: activity.duration_minutes,
        insights: activity.insights,
        evidence_source: activity.evidence_source,
        learning_signals: activity.learning_signals as Json | null,
      };
      
      const { data, error } = await supabase
        .from("activities")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      setActivities(prev => [data as Activity, ...prev]);
      toast({
        title: "Activity logged",
        description: "Your learning activity has been recorded.",
      });
      
      return data;
    } catch (error) {
      console.error("Error adding activity:", error);
      toast({
        title: "Error",
        description: "Failed to log activity. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setActivities(prev => prev.filter(a => a.id !== id));
      toast({
        title: "Activity deleted",
        description: "The activity has been removed.",
      });
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast({
        title: "Error",
        description: "Failed to delete activity.",
        variant: "destructive"
      });
    }
  };

  return { activities, loading, addActivity, deleteActivity, refetch: fetchActivities };
}
