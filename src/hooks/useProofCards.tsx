import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export interface ProofCardData {
  id: string;
  skill_id: string | null;
  skill_name: string;
  category: string;
  evidence_summary: string;
  growth_trend: "stable" | "improving" | "strong_improvement";
  confidence_score: number;
  explanation: string;
  is_shared: boolean;
  share_token: string | null;
  created_at: string;
}

export function useProofCards() {
  const { user } = useAuth();
  const [proofCards, setProofCards] = useState<ProofCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProofCards = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("proof_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProofCards(data as ProofCardData[] || []);
    } catch (error) {
      console.error("Error fetching proof cards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofCards();
  }, [user]);

  const createProofCard = async (card: Omit<ProofCardData, "id" | "created_at" | "is_shared" | "share_token">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("proof_cards")
        .insert({
          user_id: user.id,
          ...card
        })
        .select()
        .single();

      if (error) throw error;
      
      setProofCards(prev => [data as ProofCardData, ...prev]);
      toast({
        title: "Proof Card created",
        description: `Your ${card.skill_name} proof card is ready.`,
      });
      
      return data;
    } catch (error) {
      console.error("Error creating proof card:", error);
      toast({
        title: "Error",
        description: "Failed to create proof card. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const toggleShare = async (id: string, isShared: boolean) => {
    try {
      const shareToken = isShared ? crypto.randomUUID() : null;
      
      const { data, error } = await supabase
        .from("proof_cards")
        .update({ is_shared: isShared, share_token: shareToken })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setProofCards(prev => prev.map(c => c.id === id ? data as ProofCardData : c));
      toast({
        title: isShared ? "Card shared" : "Card unshared",
        description: isShared 
          ? "Your proof card is now publicly viewable."
          : "Your proof card is now private.",
      });
      
      return data;
    } catch (error) {
      console.error("Error toggling share:", error);
      toast({
        title: "Error",
        description: "Failed to update sharing settings.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteProofCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from("proof_cards")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setProofCards(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Card deleted",
        description: "The proof card has been removed.",
      });
    } catch (error) {
      console.error("Error deleting proof card:", error);
      toast({
        title: "Error",
        description: "Failed to delete proof card.",
        variant: "destructive"
      });
    }
  };

  return { proofCards, loading, createProofCard, toggleShare, deleteProofCard, refetch: fetchProofCards };
}
