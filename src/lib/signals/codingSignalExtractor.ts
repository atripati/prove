/**
 * Coding Signal Extractor
 * Extracts learning-relevant signals from coding sessions
 * NO raw keystrokes or clipboard data stored
 */

export interface CodingSignals {
    edit_count: number;
    run_count: number;
    error_count: number;
    successful_runs: number;
    error_correction_cycles: number;
    time_between_runs_avg_seconds: number | null;
    session_duration_seconds: number;
    final_code_length: number;
  }
  
  export interface CodingSessionState {
    editCount: number;
    runCount: number;
    errorCount: number;
    successfulRuns: number;
    errorCorrectionCycles: number;
    runTimestamps: number[];
    lastRunHadError: boolean;
    sessionStartTime: number;
  }
  
  export function createInitialCodingState(): CodingSessionState {
    return {
      editCount: 0,
      runCount: 0,
      errorCount: 0,
      successfulRuns: 0,
      errorCorrectionCycles: 0,
      runTimestamps: [],
      lastRunHadError: false,
      sessionStartTime: Date.now(),
    };
  }
  
  export function recordEdit(state: CodingSessionState): CodingSessionState {
    return {
      ...state,
      editCount: state.editCount + 1,
    };
  }
  
  export function recordRun(
    state: CodingSessionState,
    hadError: boolean
  ): CodingSessionState {
    const newState = {
      ...state,
      runCount: state.runCount + 1,
      runTimestamps: [...state.runTimestamps, Date.now()],
    };
  
    if (hadError) {
      newState.errorCount = state.errorCount + 1;
      newState.lastRunHadError = true;
    } else {
      newState.successfulRuns = state.successfulRuns + 1;
      if (state.lastRunHadError) {
        newState.errorCorrectionCycles = state.errorCorrectionCycles + 1;
      }
      newState.lastRunHadError = false;
    }
  
    return newState;
  }
  
  export function extractSignals(
    state: CodingSessionState,
    finalCodeLength: number
  ): CodingSignals {
    const sessionDuration = Math.floor((Date.now() - state.sessionStartTime) / 1000);
  
    let avgTimeBetweenRuns: number | null = null;
    if (state.runTimestamps.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < state.runTimestamps.length; i++) {
        intervals.push((state.runTimestamps[i] - state.runTimestamps[i - 1]) / 1000);
      }
      avgTimeBetweenRuns = Math.round(
        intervals.reduce((a, b) => a + b, 0) / intervals.length
      );
    }
  
    return {
      edit_count: state.editCount,
      run_count: state.runCount,
      error_count: state.errorCount,
      successful_runs: state.successfulRuns,
      error_correction_cycles: state.errorCorrectionCycles,
      time_between_runs_avg_seconds: avgTimeBetweenRuns,
      session_duration_seconds: sessionDuration,
      final_code_length: finalCodeLength,
    };
  }
  
  export function generateSuggestedTitle(state: CodingSessionState): string {
    return `Python coding session`;
  }
  
  export function generateSuggestedDescription(state: CodingSessionState): string {
    const parts = [`Worked on Python code with ${state.runCount} execution${state.runCount !== 1 ? 's' : ''}`];
    
    if (state.editCount > 0) {
      parts.push(`${state.editCount} edit cycle${state.editCount !== 1 ? 's' : ''}`);
    }
    
    if (state.errorCorrectionCycles > 0) {
      parts.push(`${state.errorCorrectionCycles} error-correction cycle${state.errorCorrectionCycles !== 1 ? 's' : ''}`);
    }
  
    return parts.join(', ') + '.';
  }
  