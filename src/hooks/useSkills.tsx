import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: "beginner" | "developing" | "proficient" | "advanced";
  progress: number;
  practice_hours: number;
  last_practiced_at: string | null;
  created_at: string;
}

export function useSkills() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSkills = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", user.id)
        .order("progress", { ascending: false });

      if (error) throw error;
      setSkills(data as Skill[] || []);
    } catch (error) {
      console.error("Error fetching skills:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [user]);

  const addSkill = async (skill: Pick<Skill, "name" | "category">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("skills")
        .insert({
          user_id: user.id,
          name: skill.name,
          category: skill.category,
          level: "beginner",
          progress: 0,
          practice_hours: 0
        })
        .select()
        .single();

      if (error) throw error;
      
      setSkills(prev => [...prev, data as Skill]);
      toast({
        title: "Skill added",
        description: `${skill.name} is now being tracked.`,
      });
      
      return data;
    } catch (error) {
      console.error("Error adding skill:", error);
      toast({
        title: "Error",
        description: "Failed to add skill. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateSkill = async (id: string, updates: Partial<Skill>) => {
    try {
      const { data, error } = await supabase
        .from("skills")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setSkills(prev => prev.map(s => s.id === id ? data as Skill : s));
      return data;
    } catch (error) {
      console.error("Error updating skill:", error);
      toast({
        title: "Error",
        description: "Failed to update skill.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteSkill = async (id: string) => {
    try {
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setSkills(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Skill removed",
        description: "The skill has been removed from tracking.",
      });
    } catch (error) {
      console.error("Error deleting skill:", error);
      toast({
        title: "Error",
        description: "Failed to delete skill.",
        variant: "destructive"
      });
    }
  };

  return { skills, loading, addSkill, updateSkill, deleteSkill, refetch: fetchSkills };
}
