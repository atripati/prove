/**
 * Writing Signal Extractor
 * Extracts learning-relevant signals from writing sessions
 * NO raw keystrokes or clipboard data stored
 */

export interface WritingSignals {
    revision_count: number;
    paragraph_rewrites: number;
    structural_changes: number;
    word_count_changes: number[];
    time_between_revisions_avg_seconds: number | null;
    session_duration_seconds: number;
    final_word_count: number;
    auto_save_count: number;
  }
  
  export interface WritingSessionState {
    revisionCount: number;
    paragraphRewrites: number;
    structuralChanges: number;
    wordCountChanges: number[];
    revisionTimestamps: number[];
    autoSaveCount: number;
    sessionStartTime: number;
    lastContent: string;
    lastParagraphCount: number;
    lastHeadingCount: number;
  }
  
  export function createInitialWritingState(): WritingSessionState {
    return {
      revisionCount: 0,
      paragraphRewrites: 0,
      structuralChanges: 0,
      wordCountChanges: [],
      revisionTimestamps: [],
      autoSaveCount: 0,
      sessionStartTime: Date.now(),
      lastContent: '',
      lastParagraphCount: 0,
      lastHeadingCount: 0,
    };
  }
  
  export function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  
  export function countParagraphs(html: string): number {
    const matches = html.match(/<p>/gi);
    return matches ? matches.length : 0;
  }
  
  export function countHeadings(html: string): number {
    const matches = html.match(/<h[1-6]/gi);
    return matches ? matches.length : 0;
  }
  
  export function recordRevision(
    state: WritingSessionState,
    newContent: string,
    newHtml: string
  ): WritingSessionState {
    const oldWordCount = countWords(state.lastContent);
    const newWordCount = countWords(newContent);
    const wordDiff = Math.abs(newWordCount - oldWordCount);
    
    // Only count as revision if meaningful change
    if (wordDiff < 5 && Math.abs(newContent.length - state.lastContent.length) < 20) {
      return state;
    }
  
    const newParagraphCount = countParagraphs(newHtml);
    const newHeadingCount = countHeadings(newHtml);
  
    const newState = {
      ...state,
      revisionCount: state.revisionCount + 1,
      revisionTimestamps: [...state.revisionTimestamps, Date.now()],
      wordCountChanges: [...state.wordCountChanges, newWordCount],
      lastContent: newContent,
      lastParagraphCount: newParagraphCount,
      lastHeadingCount: newHeadingCount,
    };
  
    // Detect structural changes (headings or significant paragraph changes)
    if (Math.abs(newParagraphCount - state.lastParagraphCount) >= 2 ||
        newHeadingCount !== state.lastHeadingCount) {
      newState.structuralChanges = state.structuralChanges + 1;
    }
  
    // Detect paragraph rewrites (significant word changes in similar paragraph count)
    if (Math.abs(newParagraphCount - state.lastParagraphCount) < 2 && wordDiff >= 20) {
      newState.paragraphRewrites = state.paragraphRewrites + 1;
    }
  
    return newState;
  }
  
  export function recordAutoSave(state: WritingSessionState): WritingSessionState {
    return {
      ...state,
      autoSaveCount: state.autoSaveCount + 1,
    };
  }
  
  export function extractSignals(
    state: WritingSessionState,
    finalContent: string
  ): WritingSignals {
    const sessionDuration = Math.floor((Date.now() - state.sessionStartTime) / 1000);
  
    let avgTimeBetweenRevisions: number | null = null;
    if (state.revisionTimestamps.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < state.revisionTimestamps.length; i++) {
        intervals.push(
          (state.revisionTimestamps[i] - state.revisionTimestamps[i - 1]) / 1000
        );
      }
      avgTimeBetweenRevisions = Math.round(
        intervals.reduce((a, b) => a + b, 0) / intervals.length
      );
    }
  
    return {
      revision_count: state.revisionCount,
      paragraph_rewrites: state.paragraphRewrites,
      structural_changes: state.structuralChanges,
      word_count_changes: state.wordCountChanges,
      time_between_revisions_avg_seconds: avgTimeBetweenRevisions,
      session_duration_seconds: sessionDuration,
      final_word_count: countWords(finalContent),
      auto_save_count: state.autoSaveCount,
    };
  }
  
  export function generateSuggestedTitle(state: WritingSessionState): string {
    return `Writing session`;
  }
  
  export function generateSuggestedDescription(
    state: WritingSessionState,
    finalContent: string
  ): string {
    const wordCount = countWords(finalContent);
    const durationMinutes = Math.floor(
      (Date.now() - state.sessionStartTime) / 60000
    );
  
    const parts = [
      `Written ${wordCount} word${wordCount !== 1 ? 's' : ''}`,
      `${state.revisionCount} revision${state.revisionCount !== 1 ? 's' : ''}`,
    ];
  
    if (state.structuralChanges > 0) {
      parts.push(`${state.structuralChanges} structural change${state.structuralChanges !== 1 ? 's' : ''}`);
    }
  
    return parts.join(' with ') + ` over ${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}.`;
  }
  