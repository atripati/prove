import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle, X, Clock, FileText, Save, RotateCcw, Undo2, Redo2,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, Pilcrow
} from "lucide-react";
import {
  WritingSignals,
  WritingSessionState,
  createInitialWritingState,
  recordRevision,
  recordAutoSave,
  extractSignals,
  countWords,
  generateSuggestedTitle,
  generateSuggestedDescription,
} from "@/lib/signals/writingSignalExtractor";

interface WritingSpaceProps {
  onFinish: (data: {
    content: string;
    signals: WritingSignals;
    suggestedTitle: string;
    suggestedDescription: string;
  }) => void;
  onCancel: () => void;
}

export function WritingSpace({ onFinish, onCancel }: WritingSpaceProps) {
  const [sessionState, setSessionState] = useState<WritingSessionState>(
    createInitialWritingState()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const revisionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your paper, lab report, or explanation here...\n\nThis is a focused writing space designed to help you develop your thoughts without distractions. Your work is automatically saved as you write.",
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const html = editor.getHTML();
      setWordCount(countWords(text));
      
      // Debounce revision tracking
      if (revisionTimeoutRef.current) {
        clearTimeout(revisionTimeoutRef.current);
      }
      
      revisionTimeoutRef.current = setTimeout(() => {
        setSessionState(prev => recordRevision(prev, text, html));
      }, 2000);

      // Auto-save after inactivity
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        const content = editor.getText();
        if (content !== lastSavedContentRef.current && content.trim()) {
          setIsSaving(true);
          setTimeout(() => {
            lastSavedContentRef.current = content;
            setSessionState(prev => recordAutoSave(prev));
            setIsSaving(false);
          }, 300);
        }
      }, 3000);
    },
  });

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - sessionState.sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionState.sessionStartTime]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      if (revisionTimeoutRef.current) clearTimeout(revisionTimeoutRef.current);
    };
  }, []);

  const resetContent = () => {
    editor?.commands.clearContent();
    setWordCount(0);
    toast({
      title: "Content cleared",
      description: "Your writing has been reset.",
    });
  };

  const handleFinish = () => {
    const content = editor?.getText() || "";
    const signals = extractSignals(sessionState, content);
    
    onFinish({
      content,
      signals,
      suggestedTitle: generateSuggestedTitle(sessionState),
      suggestedDescription: generateSuggestedDescription(sessionState, content),
    });
  };

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  if (!editor) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="h-12 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="font-display font-semibold">PROOF Writing Space</h1>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Pilcrow className="w-4 h-4" />
              <span>{wordCount} words</span>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 text-primary">
                <Save className="w-4 h-4 animate-pulse" />
                <span>Saving...</span>
              </div>
            )}
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

      {/* Toolbar */}
      <div className="h-12 border-b bg-muted/30 flex items-center px-4 gap-1 overflow-x-auto">
        {/* Undo/Redo */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="w-4 h-4" />
        </Toggle>
        
        <Separator orientation="vertical" className="mx-2 h-6" />
        
        {/* Text formatting */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="w-4 h-4" />
        </Toggle>
        
        <Separator orientation="vertical" className="mx-2 h-6" />
        
        {/* Headings */}
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="w-4 h-4" />
        </Toggle>
        
        <Separator orientation="vertical" className="mx-2 h-6" />
        
        {/* Lists */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="w-4 h-4" />
        </Toggle>
        
        <Separator orientation="vertical" className="mx-2 h-6" />
        
        {/* Alignment */}
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "left" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "center" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "right" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="w-4 h-4" />
        </Toggle>
        
        <div className="flex-1" />
        
        <Button variant="ghost" size="sm" onClick={resetContent}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor area */}
        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-4xl mx-auto">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Progress sidebar */}
        <div className="w-80 border-l bg-card overflow-auto p-4 space-y-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Session Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Words written</span>
                <span className="font-medium">{wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revisions</span>
                <span className="font-medium">{sessionState.revisionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Structural changes</span>
                <span className="font-medium">{sessionState.structuralChanges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paragraph rewrites</span>
                <span className="font-medium">{sessionState.paragraphRewrites}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-saves</span>
                <span className="font-medium">{sessionState.autoSaveCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Writing Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>• <strong>Structure first:</strong> Outline your main points before diving into details.</p>
              <p>• <strong>Write freely:</strong> Get your ideas down first, edit later.</p>
              <p>• <strong>Take breaks:</strong> Step away periodically to maintain perspective.</p>
              <p>• <strong>Revise actively:</strong> Each revision strengthens your argument.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Privacy Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Only learning-relevant signals are tracked. No keystrokes, clipboard history, or content is stored until you finish.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
