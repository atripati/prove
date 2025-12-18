import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, RotateCcw, CheckCircle, AlertCircle, Loader2, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface LearningSignals {
  edit_count: number;
  run_count: number;
  error_count: number;
  successful_runs: number;
  error_correction_cycles: number;
  time_between_runs_avg_seconds: number | null;
  session_duration_seconds: number;
  final_code_length: number;
}

interface CodeSessionProps {
  onFinish: (data: {
    code: string;
    signals: LearningSignals;
    suggestedTitle: string;
    suggestedDescription: string;
  }) => void;
  onCancel: () => void;
}

export function CodeSession({ onFinish, onCancel }: CodeSessionProps) {
  const [code, setCode] = useState(`# PROOF Code Space (Python)
# Write your code here and click Run to execute

print("Hello, World!")
`);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  
  // Learning signals tracking (without recording keystrokes)
  const [editCount, setEditCount] = useState(0);
  const [runCount, setRunCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [successfulRuns, setSuccessfulRuns] = useState(0);
  const [errorCorrectionCycles, setErrorCorrectionCycles] = useState(0);
  const [runTimestamps, setRunTimestamps] = useState<number[]>([]);
  const [lastRunHadError, setLastRunHadError] = useState(false);
  
  const lastCodeRef = useRef(code);
  const editTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track edits (debounced to count meaningful edits, not keystrokes)
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    
    // Debounce edit counting - only count after user pauses typing
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
    
    editTimeoutRef.current = setTimeout(() => {
      if (newCode !== lastCodeRef.current) {
        setEditCount(prev => prev + 1);
        lastCodeRef.current = newCode;
      }
    }, 1000);
  }, []);

  const runCode = async () => {
    setIsRunning(true);
    setStdout("");
    setStderr("");
    
    const runTime = Date.now();
    setRunTimestamps(prev => [...prev, runTime]);
    setRunCount(prev => prev + 1);

    try {
      const { data, error } = await supabase.functions.invoke("run-python", {
        body: { code }
      });

      if (error) throw error;

      setStdout(data.stdout || "");
      setStderr(data.stderr || "");

      const hadError = !!data.stderr || !data.success;
      
      if (hadError) {
        setErrorCount(prev => prev + 1);
        // Check for error-correction cycle
        if (!lastRunHadError) {
          // First error in a potential cycle
        }
        setLastRunHadError(true);
      } else {
        setSuccessfulRuns(prev => prev + 1);
        // If last run had error and this one succeeded, it's an error-correction cycle
        if (lastRunHadError) {
          setErrorCorrectionCycles(prev => prev + 1);
        }
        setLastRunHadError(false);
      }
    } catch (error) {
      console.error("Code execution error:", error);
      setStderr(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setErrorCount(prev => prev + 1);
      setLastRunHadError(true);
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    setCode(`# PROOF Code Space (Python)
# Write your code here and click Run to execute

print("Hello, World!")
`);
    setStdout("");
    setStderr("");
    setEditCount(prev => prev + 1);
  };

  const calculateSignals = (): LearningSignals => {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    
    // Calculate average time between runs
    let avgTimeBetweenRuns: number | null = null;
    if (runTimestamps.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < runTimestamps.length; i++) {
        intervals.push((runTimestamps[i] - runTimestamps[i - 1]) / 1000);
      }
      avgTimeBetweenRuns = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
    }

    return {
      edit_count: editCount,
      run_count: runCount,
      error_count: errorCount,
      successful_runs: successfulRuns,
      error_correction_cycles: errorCorrectionCycles,
      time_between_runs_avg_seconds: avgTimeBetweenRuns,
      session_duration_seconds: sessionDuration,
      final_code_length: code.length,
    };
  };

  const handleFinish = () => {
    const signals = calculateSignals();
    
    // Generate suggested title and description based on signals
    const suggestedTitle = `Python coding session`;
    const suggestedDescription = `Worked on Python code with ${runCount} execution${runCount !== 1 ? 's' : ''}, ${editCount} edit cycle${editCount !== 1 ? 's' : ''}${errorCorrectionCycles > 0 ? `, and ${errorCorrectionCycles} error-correction cycle${errorCorrectionCycles !== 1 ? 's' : ''}` : ''}.`;

    onFinish({
      code,
      signals,
      suggestedTitle,
      suggestedDescription,
    });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    };
  }, []);

  const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
  const minutes = Math.floor(sessionDuration / 60);
  const seconds = sessionDuration % 60;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-display font-semibold">PROOF Code Space (Python)</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleFinish}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Finish & Log
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Code editor */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Code Editor</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetCode}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button size="sm" onClick={runCode} disabled={isRunning}>
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Textarea
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="h-full w-full resize-none font-mono text-sm rounded-none border-0 border-t focus-visible:ring-0"
                placeholder="Write your Python code here..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Output panel */}
        <div className="w-96 flex flex-col gap-4">
          {/* Output */}
          <Card className="flex-1">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {stderr ? (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                ) : stdout ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : null}
                Output
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[200px] overflow-auto border-t">
                {stdout && (
                  <pre className="p-4 font-mono text-sm whitespace-pre-wrap text-foreground">
                    {stdout}
                  </pre>
                )}
                {stderr && (
                  <pre className="p-4 font-mono text-sm whitespace-pre-wrap text-destructive">
                    {stderr}
                  </pre>
                )}
                {!stdout && !stderr && (
                  <p className="p-4 text-muted-foreground text-sm">
                    Run your code to see output here
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Learning signals (visible but privacy-focused) */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Session Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Edit cycles</span>
                <span className="font-medium">{editCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Runs</span>
                <span className="font-medium">{runCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Successful runs</span>
                <span className="font-medium text-green-600">{successfulRuns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error corrections</span>
                <span className="font-medium text-amber-600">{errorCorrectionCycles}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
                Only learning-relevant signals are tracked. No keystrokes or clipboard history.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
