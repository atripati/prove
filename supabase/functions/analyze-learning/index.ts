import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// DETERMINISTIC UNLOCK RULES (Server-Side Only)
// These rules are enforced BEFORE any AI call
// AI CANNOT unlock cards - only explain evidence
// ============================================

const UNLOCK_THRESHOLDS = {
  MIN_UNIQUE_DAYS: 3,
  MIN_SESSIONS: 3,
  MIN_OBSERVED_SESSIONS: 1,
} as const;

interface EvidenceMetrics {
  uniqueDays: number;
  sessionCount: number;
  hasObservedEvidence: boolean;
  observedSessionCount: number;
  hasErrorCorrectionCycles: boolean;
  activityTypes: string[];
}

interface UnlockRequirements {
  multiple_days: boolean;
  multiple_sessions: boolean;
  observed_evidence: boolean;
  growth_signal: boolean;
  consistency: boolean;
}

function calculateEvidenceMetrics(activities: any[]): EvidenceMetrics {
  const uniqueDates = new Set<string>();
  let hasObservedEvidence = false;
  let observedSessionCount = 0;
  let hasErrorCorrectionCycles = false;
  const activityTypes = new Set<string>();

  for (const activity of activities) {
    const dateStr = activity.date?.split('T')[0];
    if (dateStr) uniqueDates.add(dateStr);
    if (activity.type) activityTypes.add(activity.type);
    
    const isObserved = activity.evidence_source === 'observed_in_proof' || activity.learning_signals != null;
    if (isObserved) {
      hasObservedEvidence = true;
      observedSessionCount++;
    }
    if (activity.learning_signals?.error_correction_cycles > 0) {
      hasErrorCorrectionCycles = true;
    }
  }

  return {
    uniqueDays: uniqueDates.size,
    sessionCount: activities.length,
    hasObservedEvidence,
    observedSessionCount,
    hasErrorCorrectionCycles,
    activityTypes: Array.from(activityTypes),
  };
}

function evaluateUnlockRequirements(metrics: EvidenceMetrics): UnlockRequirements {
  return {
    multiple_days: metrics.uniqueDays >= UNLOCK_THRESHOLDS.MIN_UNIQUE_DAYS,
    multiple_sessions: metrics.sessionCount >= UNLOCK_THRESHOLDS.MIN_SESSIONS,
    observed_evidence: metrics.hasObservedEvidence,
    growth_signal: metrics.hasErrorCorrectionCycles || metrics.observedSessionCount >= 2,
    consistency: metrics.activityTypes.length >= 1 && metrics.sessionCount >= UNLOCK_THRESHOLDS.MIN_SESSIONS,
  };
}

function shouldUnlock(requirements: UnlockRequirements): boolean {
  return requirements.multiple_days &&
         requirements.multiple_sessions &&
         requirements.observed_evidence &&
         requirements.growth_signal &&
         requirements.consistency;
}

function getMissingRequirements(requirements: UnlockRequirements, metrics: EvidenceMetrics): string[] {
  const missing: string[] = [];
  if (!requirements.multiple_days) {
    missing.push(`Evidence spans only ${metrics.uniqueDays} day(s). Need at least ${UNLOCK_THRESHOLDS.MIN_UNIQUE_DAYS} distinct days.`);
  }
  if (!requirements.multiple_sessions) {
    missing.push(`Only ${metrics.sessionCount} session(s) recorded. Need at least ${UNLOCK_THRESHOLDS.MIN_SESSIONS} sessions.`);
  }
  if (!requirements.observed_evidence) {
    missing.push("No observed learning process evidence. Use a Learning Space to generate process signals.");
  }
  if (!requirements.growth_signal) {
    missing.push("No clear growth signal detected. Continue practicing to demonstrate improvement over time.");
  }
  if (!requirements.consistency) {
    missing.push("Insufficient consistent practice detected across sessions.");
  }
  return missing;
}

function calculateConfidenceScore(metrics: EvidenceMetrics): number {
  let score = 0.2;
  score += Math.min(metrics.uniqueDays / 10, 0.15);
  score += Math.min(metrics.sessionCount / 20, 0.1);
  score += Math.min(metrics.observedSessionCount / 5, 0.1);
  if (metrics.hasErrorCorrectionCycles) score += 0.05;
  return Math.min(score, 0.6);
}

function getConfidenceLevel(score: number): string {
  if (score < 0.3) return "emerging";
  if (score < 0.45) return "developing";
  return "early_evidence";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, skills } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // ============================================
    // PROOF CARD GENERATION - DETERMINISTIC UNLOCK
    // ============================================
    if (type === "generate_proof_card") {
      const activities = content.activities || [];
      
      // STEP 1: Calculate evidence metrics (deterministic)
      const metrics = calculateEvidenceMetrics(activities);
      console.log("Evidence metrics:", JSON.stringify(metrics));
      
      // STEP 2: Evaluate requirements (deterministic)
      const requirements = evaluateUnlockRequirements(metrics);
      console.log("Requirements evaluation:", JSON.stringify(requirements));
      
      // STEP 3: Determine unlock status (deterministic - NO AI INVOLVED)
      const canUnlock = shouldUnlock(requirements);
      console.log("Unlock decision (deterministic):", canUnlock);
      
      // STEP 4A: If LOCKED, return immediately (no AI call needed)
      if (!canUnlock) {
        const lockedResponse = {
          status: "locked",
          requirements_met: requirements,
          missing_requirements: getMissingRequirements(requirements, metrics),
          current_progress: {
            days_count: metrics.uniqueDays,
            sessions_count: metrics.sessionCount,
            has_observed_evidence: metrics.hasObservedEvidence,
          },
          what_would_unlock: "Continue practicing this skill over multiple days with observed learning sessions. Use the Code or Writing Learning Spaces to generate process evidence.",
          encouragement: "Your learning is being tracked. Proof Cards require sustained evidence over time—slowness is a feature, not a bug. Keep practicing!",
        };
        
        console.log("Returning LOCKED response (no AI call)");
        return new Response(JSON.stringify(lockedResponse), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // STEP 4B: If requirements MET, call AI ONLY for explanation
      const confidenceScore = calculateConfidenceScore(metrics);
      const confidenceLevel = getConfidenceLevel(confidenceScore);
      
      // Get unique days for time span
      const dates = activities.map((a: any) => a.date?.split('T')[0]).filter(Boolean).sort();
      const timeSpan = dates.length > 1 ? `${dates[0]} to ${dates[dates.length - 1]}` : dates[0] || "Recent";
      
      // Call AI ONLY to generate explanation (NOT to decide unlock)
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: EVIDENCE_EXPLANATION_PROMPT },
            { role: "user", content: `Generate an evidence summary for this UNLOCKED Proof Card.

Skill: ${content.skill_name}
Category: ${content.category}
Evidence Metrics:
- Sessions: ${metrics.sessionCount}
- Unique Days: ${metrics.uniqueDays}
- Observed Sessions: ${metrics.observedSessionCount}
- Has Error Correction: ${metrics.hasErrorCorrectionCycles}

Activities:
${JSON.stringify(activities.slice(0, 10).map((a: any) => ({
  title: a.title,
  type: a.type,
  date: a.date,
  evidence_source: a.evidence_source,
  has_signals: !!a.learning_signals
})), null, 2)}

Respond in JSON:
{
  "evidence_summary": "Professional 2-3 sentence summary for professors/recruiters",
  "observed_growth_trends": ["specific improvement 1", "specific improvement 2"],
  "limitations": "Honest acknowledgment of evidence limitations"
}` },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        // If AI fails, still return unlocked with default explanation
        console.error("AI call failed, using default explanation");
        return new Response(JSON.stringify({
          status: "unlocked",
          requirements_met: requirements,
          evidence_summary: `Observed ${metrics.sessionCount} learning sessions for ${content.skill_name} across ${metrics.uniqueDays} days with process evidence.`,
          growth_trend: metrics.hasErrorCorrectionCycles ? "improving" : "stable",
          confidence_score: confidenceScore,
          confidence_level: confidenceLevel,
          explanation: `Evidence is ${confidenceLevel}. Based on ${metrics.observedSessionCount} observed sessions with process signals.`,
          time_span: timeSpan,
          session_count: metrics.sessionCount,
          observed_growth_trends: ["Learning process observed", "Consistent practice detected"],
          limitations: "Early evidence. Confidence will increase with continued practice over time.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await response.json();
      const aiContent = aiData.choices?.[0]?.message?.content;
      let aiParsed: any = {};
      
      try {
        aiParsed = JSON.parse(aiContent);
      } catch {
        console.error("Failed to parse AI response:", aiContent);
      }

      // Construct final UNLOCKED response with deterministic fields + AI explanation
      const unlockedResponse = {
        status: "unlocked",
        requirements_met: requirements,
        evidence_summary: aiParsed.evidence_summary || `Observed ${metrics.sessionCount} learning sessions for ${content.skill_name} across ${metrics.uniqueDays} days.`,
        growth_trend: metrics.hasErrorCorrectionCycles ? "improving" : "stable",
        confidence_score: confidenceScore,
        confidence_level: confidenceLevel,
        explanation: `Confidence is ${confidenceLevel} based on ${metrics.observedSessionCount} observed sessions across ${metrics.uniqueDays} days. ${aiParsed.limitations || ""}`,
        time_span: timeSpan,
        session_count: metrics.sessionCount,
        observed_growth_trends: aiParsed.observed_growth_trends || ["Learning process observed"],
        limitations: aiParsed.limitations || "Early evidence. Confidence will increase with continued practice.",
      };
      
      console.log("Returning UNLOCKED response");
      return new Response(JSON.stringify(unlockedResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================
    // ACTIVITY ANALYSIS (unchanged)
    // ============================================
    if (type === "analyze_activity") {
      const learningSignalsContext = content.learning_signals 
        ? `\nLearning Signals Observed:\n- Edit cycles: ${content.learning_signals.edit_count || 'N/A'}\n- Run count: ${content.learning_signals.run_count || 'N/A'}\n- Error count: ${content.learning_signals.error_count || 'N/A'}\n- Successful runs: ${content.learning_signals.successful_runs || 'N/A'}\n- Error-correction cycles: ${content.learning_signals.error_correction_cycles || 'N/A'}\n` : '';

      const userPrompt = `Analyze this student learning activity:\n\nEvidence Source: ${content.evidence_source || 'submitted'}\nContent Type: ${content.type || "general"}\nTitle: ${content.title}\nDescription: ${content.description || "No description provided"}\nContent: ${content.content || "No content provided"}\n${learningSignalsContext}\nPreviously tracked skills: ${skills?.join(", ") || "None"}\n\nProvide analysis in JSON format:\n{\n  "observed_signals": ["signal1", "signal2"],\n  "learning_inferences": [{"skill": "name", "confidence": "low|emerging|moderate", "explanation": "why"}],\n  "skills_detected": ["skill1", "skill2"],\n  "reflective_feedback": "supportive feedback",\n  "growth_indicators": ["indicator1"],\n  "what_would_increase_confidence": "description"\n}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: PROOF_AI_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch {
        parsedResponse = { raw: aiResponse };
      }

      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================
    // ACTIVITY SUMMARY (unchanged)
    // ============================================
    if (type === "summarize_activity") {
      const learningSignalsContext = content.learning_signals 
        ? `Observed: ${content.learning_signals.edit_count || 0} edits, ${content.learning_signals.run_count || 0} runs, ${content.learning_signals.error_count || 0} errors`
        : '';

      const userPrompt = `Generate a neutral, factual summary for this activity:\n\nActivity Type: ${content.type}\nTitle: ${content.title}\nEvidence Source: ${content.evidence_source || 'submitted'}\n${learningSignalsContext}\n\nRespond in JSON:\n{\n  "title": "short neutral title",\n  "description": "one sentence describing observable actions",\n  "tags": ["action-based tags"]\n}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: RECENT_ACTIVITY_SUMMARY_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch {
        parsedResponse = { raw: aiResponse };
      }

      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown analysis type: ${type}`);
  } catch (error) {
    console.error("Error in analyze-learning:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
