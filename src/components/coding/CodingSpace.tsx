import { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Play, RotateCcw, CheckCircle, AlertCircle, Loader2, X, Clock, 
  Image as ImageIcon, Package, Terminal, Code2, FileCode
} from "lucide-react";
import { usePyodide } from "@/hooks/usePyodide";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CodingSignals,
  CodingSessionState,
  createInitialCodingState,
  recordEdit,
  recordRun,
  extractSignals,
  generateSuggestedTitle,
  generateSuggestedDescription,
} from "@/lib/signals/codingSignalExtractor";

const DEFAULT_CODE = `# PROOF Code Space (Python)
# numpy, pandas, and matplotlib are available!

import numpy as np
import matplotlib.pyplot as plt

# Example: Create a simple plot
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(8, 4))
plt.plot(x, y, 'b-', linewidth=2)
plt.title('Sine Wave')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)
plt.show()

print("Plot generated successfully!")
`;

interface CodingSpaceProps {
  onFinish: (data: {
    code: string;
    signals: CodingSignals;
    suggestedTitle: string;
    suggestedDescription: string;
  }) => void;
  onCancel: () => void;
}

export function CodingSpace({ onFinish, onCancel }: CodingSpaceProps) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState("output");
  
  // Learning signals state
  const [sessionState, setSessionState] = useState<CodingSessionState>(
    createInitialCodingState()
  );
  
  const lastCodeRef = useRef(code);
  const editTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use Pyodide for Python execution
  const { 
    runCode: runPython, 
    isLoading: pyodideLoading, 
    loadingStatus, 
    error: pyodideError, 
    isReady, 
    availablePackages 
  } = usePyodide();

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - sessionState.sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionState.sessionStartTime]);

  // Track edits (debounced)
  const handleCodeChange = useCallback((newCode: string | undefined) => {
    if (!newCode) return;
    setCode(newCode);
    
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
    
    editTimeoutRef.current = setTimeout(() => {
      if (newCode !== lastCodeRef.current) {
        setSessionState(prev => recordEdit(prev));
        lastCodeRef.current = newCode;
      }
    }, 1000);
  }, []);

  const executeCode = async () => {
    if (!isReady) return;
    
    setIsRunning(true);
    setStdout("");
    setStderr("");
    setImages([]);
    setActiveTab("output");

    try {
      const result = await runPython(code);
      
      setStdout(result.stdout);
      setStderr(result.stderr);
      setImages(result.images || []);

      const hadError = !result.success || result.stderr.length > 0;
      setSessionState(prev => recordRun(prev, hadError));
      
      if (result.images && result.images.length > 0) {
        setActiveTab("plots");
      }
    } catch (error) {
      console.error("Code execution error:", error);
      setStderr(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSessionState(prev => recordRun(prev, true));
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    setCode(DEFAULT_CODE);
    setStdout("");
    setStderr("");
    setImages([]);
    setSessionState(prev => recordEdit(prev));
  };

  const handleFinish = () => {
    const signals = extractSignals(sessionState, code.length);
    
    onFinish({
      code,
      signals,
      suggestedTitle: generateSuggestedTitle(sessionState),
      suggestedDescription: generateSuggestedDescription(sessionState),
    });
  };

  useEffect(() => {
    return () => {
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    };
  }, []);

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  // Loading screen
  if (pyodideLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center gap-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <h2 className="text-xl font-display font-semibold">Loading Python Environment</h2>
          <p className="text-muted-foreground max-w-md">{loadingStatus}</p>
          <Progress 
            value={loadingStatus.includes('numpy') ? 75 : loadingStatus.includes('interpreter') ? 50 : 25} 
            className="w-64 mx-auto" 
          />
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    );
  }

  // Error screen
  if (pyodideError) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center gap-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="text-xl font-display font-semibold">Failed to Load Python</h2>
          <p className="text-muted-foreground max-w-md">{pyodideError}</p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* VS Code-like header */}
      <div className="h-12 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <h1 className="font-display font-semibold">PROOF Code Space</h1>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileCode className="w-4 h-4" />
            <span>main.py</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
            <Package className="w-3 h-3" />
            <span>{availablePackages.join(', ')}</span>
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

      {/* Main content - VS Code layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor panel */}
        <div className="flex-1 flex flex-col border-r">
          {/* Editor toolbar */}
          <div className="h-10 bg-muted/30 border-b flex items-center justify-between px-3">
            <span className="text-xs text-muted-foreground">Python (Pyodide)</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={resetCode}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
              <Button 
                size="sm" 
                onClick={executeCode} 
                disabled={isRunning || !isReady}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Run
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                renderLineHighlight: "all",
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                bracketPairColorization: { enabled: true },
                padding: { top: 16 },
              }}
            />
          </div>
        </div>

        {/* Output panel */}
        <div className="w-[450px] flex flex-col bg-card">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="h-10 rounded-none border-b justify-start bg-muted/30 px-2">
              <TabsTrigger value="output" className="gap-2 text-xs">
                <Terminal className="w-3 h-3" />
                Output
              </TabsTrigger>
              <TabsTrigger value="plots" className="gap-2 text-xs">
                <ImageIcon className="w-3 h-3" />
                Plots ({images.length})
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2 text-xs">
                Session
              </TabsTrigger>
            </TabsList>

            <TabsContent value="output" className="flex-1 m-0 overflow-auto">
              <div className="p-4 font-mono text-sm">
                {stdout && (
                  <pre className="whitespace-pre-wrap text-foreground mb-2">
                    {stdout}
                  </pre>
                )}
                {stderr && (
                  <pre className="whitespace-pre-wrap text-destructive">
                    {stderr}
                  </pre>
                )}
                {!stdout && !stderr && (
                  <p className="text-muted-foreground">
                    Run your code to see output here
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="plots" className="flex-1 m-0 overflow-auto">
              <div className="p-4 space-y-4">
                {images.length > 0 ? (
                  images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={`data:image/png;base64,${img}`} 
                      alt={`Plot ${idx + 1}`}
                      className="w-full rounded border"
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No plots generated yet. Use matplotlib to create visualizations.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="progress" className="flex-1 m-0 overflow-auto">
              <div className="p-4 space-y-4">
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium">Session Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Edit cycles</span>
                      <span className="font-medium">{sessionState.editCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Runs</span>
                      <span className="font-medium">{sessionState.runCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Successful runs</span>
                      <span className="font-medium text-green-600">{sessionState.successfulRuns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Errors</span>
                      <span className="font-medium text-destructive">{sessionState.errorCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Error corrections</span>
                      <span className="font-medium text-amber-600">{sessionState.errorCorrectionCycles}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium">Privacy Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Only learning-relevant signals are tracked. No keystrokes, clipboard history, or code content is stored until you finish.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
