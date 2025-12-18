import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, skills } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "analyze_activity") {
      systemPrompt = `You are PROOF, an AI learning intelligence companion that analyzes student work to detect skills and growth patterns.

Your role is to:
1. Identify specific skills being practiced in the submitted work
2. Provide supportive, non-judgmental feedback focused on growth
3. Detect learning patterns and areas of improvement
4. Generate confidence scores (0-1) for skill detection

Always be:
- Encouraging and supportive
- Specific about what you observe
- Focused on growth, not correctness
- Honest but constructive

Respond in JSON format with this structure:
{
  "skills_detected": ["skill1", "skill2"],
  "insights": "A supportive analysis of what you observed...",
  "growth_indicators": ["indicator1", "indicator2"],
  "suggestions": "Optional supportive suggestions for continued growth"
}`;

      userPrompt = `Analyze this student work and identify skills being practiced:

Content Type: ${content.type || "general"}
Title: ${content.title}
Description: ${content.description || "No description provided"}
Content: ${content.content || "No content provided"}

Previously tracked skills: ${skills?.join(", ") || "None"}

Provide your analysis:`;
    } else if (type === "generate_proof_card") {
      systemPrompt = `You are PROOF, an AI that generates credible evidence cards of student learning.

Generate a PROOF CARD that:
1. Summarizes evidence of the skill being practiced
2. Identifies growth trends (stable, improving, strong_improvement)
3. Provides a confidence score (0-1) based on evidence strength
4. Explains the reasoning in a way professors and recruiters can understand

Be:
- Precise and evidence-based
- Professional but encouraging
- Honest about confidence levels

Respond in JSON format:
{
  "evidence_summary": "A clear summary of the evidence...",
  "growth_trend": "stable" | "improving" | "strong_improvement",
  "confidence_score": 0.0-1.0,
  "explanation": "Detailed reasoning for professors/recruiters..."
}`;

      userPrompt = `Generate a PROOF CARD for this skill:

Skill: ${content.skill_name}
Category: ${content.category}
Activities: ${JSON.stringify(content.activities || [])}
Time Period: ${content.time_period || "Recent"}

Generate the proof card:`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

    console.log("AI analysis completed:", type);
    
    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-learning:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
