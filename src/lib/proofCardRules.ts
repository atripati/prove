/**
 * PROOF Card Unlock Rules
 * 
 * These rules are DETERMINISTIC and enforced server-side.
 * The same evidence will ALWAYS produce the same unlock decision.
 * AI is used ONLY for explanation, NEVER for unlock decisions.
 */

export interface UnlockRequirements {
    multiple_days: boolean;
    multiple_sessions: boolean;
    observed_evidence: boolean;
    growth_signal: boolean;
    consistency: boolean;
  }
  
  export interface EvidenceMetrics {
    uniqueDays: number;
    sessionCount: number;
    hasObservedEvidence: boolean;
    observedSessionCount: number;
    totalDuration: number;
    hasErrorCorrectionCycles: boolean;
    activityTypes: string[];
  }
  
  // THRESHOLD CONSTANTS - Human-readable and auditable
  export const UNLOCK_THRESHOLDS = {
    MIN_UNIQUE_DAYS: 3,
    MIN_SESSIONS: 3,
    MIN_OBSERVED_SESSIONS: 1,
    MIN_DURATION_MINUTES: 30,
  } as const;
  
  /**
   * Calculate evidence metrics from activities
   * Pure function - no side effects, deterministic
   */
  export function calculateEvidenceMetrics(activities: any[]): EvidenceMetrics {
    const uniqueDates = new Set<string>();
    let hasObservedEvidence = false;
    let observedSessionCount = 0;
    let totalDuration = 0;
    let hasErrorCorrectionCycles = false;
    const activityTypes = new Set<string>();
  
    for (const activity of activities) {
      // Track unique days
      const dateStr = activity.created_at?.split('T')[0] || activity.date?.split('T')[0];
      if (dateStr) {
        uniqueDates.add(dateStr);
      }
  
      // Track activity types
      if (activity.type) {
        activityTypes.add(activity.type);
      }
  
      // Check for observed evidence
      const isObserved = activity.evidence_source === 'observed_in_proof' || 
                         activity.learning_signals != null;
      if (isObserved) {
        hasObservedEvidence = true;
        observedSessionCount++;
      }
  
      // Track duration
      if (activity.duration_minutes) {
        totalDuration += activity.duration_minutes;
      }
  
      // Check for error correction cycles
      if (activity.learning_signals?.error_correction_cycles > 0) {
        hasErrorCorrectionCycles = true;
      }
    }
  
    return {
      uniqueDays: uniqueDates.size,
      sessionCount: activities.length,
      hasObservedEvidence,
      observedSessionCount,
      totalDuration,
      hasErrorCorrectionCycles,
      activityTypes: Array.from(activityTypes),
    };
  }
  
  /**
   * Deterministically evaluate unlock requirements
   * Returns exactly which requirements are met/unmet
   */
  export function evaluateUnlockRequirements(metrics: EvidenceMetrics): UnlockRequirements {
    return {
      multiple_days: metrics.uniqueDays >= UNLOCK_THRESHOLDS.MIN_UNIQUE_DAYS,
      multiple_sessions: metrics.sessionCount >= UNLOCK_THRESHOLDS.MIN_SESSIONS,
      observed_evidence: metrics.hasObservedEvidence,
      growth_signal: metrics.hasErrorCorrectionCycles || metrics.observedSessionCount >= 2,
      consistency: metrics.activityTypes.length >= 1 && metrics.sessionCount >= UNLOCK_THRESHOLDS.MIN_SESSIONS,
    };
  }
  
  /**
   * Determine if card should be unlocked
   * DETERMINISTIC: same inputs always produce same output
   */
  export function shouldUnlock(requirements: UnlockRequirements): boolean {
    return requirements.multiple_days &&
           requirements.multiple_sessions &&
           requirements.observed_evidence &&
           requirements.growth_signal &&
           requirements.consistency;
  }
  
  /**
   * Generate human-readable missing requirements
   */
  export function getMissingRequirements(
    requirements: UnlockRequirements, 
    metrics: EvidenceMetrics
  ): string[] {
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
  
  /**
   * Calculate bounded confidence score based on evidence
   * Returns 0.2-0.6 range (never high confidence early)
   */
  export function calculateConfidenceScore(metrics: EvidenceMetrics): number {
    let score = 0.2; // Base score
  
    // Add for days (max +0.15)
    score += Math.min(metrics.uniqueDays / 10, 0.15);
  
    // Add for sessions (max +0.1)
    score += Math.min(metrics.sessionCount / 20, 0.1);
  
    // Add for observed evidence (max +0.1)
    score += Math.min(metrics.observedSessionCount / 5, 0.1);
  
    // Add for error correction cycles (+0.05)
    if (metrics.hasErrorCorrectionCycles) {
      score += 0.05;
    }
  
    // Cap at 0.6 for early cards
    return Math.min(score, 0.6);
  }
  
  /**
   * Get confidence level label
   */
  export function getConfidenceLevel(score: number): string {
    if (score < 0.3) return "emerging";
    if (score < 0.45) return "developing";
    return "early_evidence";
  }
  