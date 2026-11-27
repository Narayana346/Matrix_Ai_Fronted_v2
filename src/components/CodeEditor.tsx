import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { css } from '@codemirror/lang-css';
import { syntaxTree } from '@codemirror/language';
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
import type { EditorView } from '@codemirror/view';
import { FileCode, Loader2 } from "lucide-react";
import {githubDark} from '@uiw/codemirror-theme-github';

// Walks the Lezer syntax tree and flags any error nodes it produced while
// parsing. Catches syntax mistakes (unmatched brackets, invalid tokens, etc.)
// for any language whose CodeMirror extension is Lezer-based (JS/TS/JSX/CSS).
const syntaxErrorLinter = linter((view: EditorView) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state).cursor().iterate((node) => {
    if (node.type.isError) {
      diagnostics.push({
        from: node.from,
        to: Math.max(node.to, node.from + 1),
        severity: 'error',
        message: 'Syntax error',
      });
    }
  });
  return diagnostics;
});

interface CodeEditorProps {
  content: string;
  filePath: string | null;
  isLoading?: boolean;
  editable?: boolean;
  onCodeChange?: (newCode: string) => void;
}

export function CodeEditor({ content, filePath, isLoading, editable, onCodeChange }: CodeEditorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!filePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FileCode className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No file selected</h3>
      </div>
    );
  }

  // Auto-detect language extension
  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return [javascript({ jsx: true, typescript: true }), syntaxErrorLinter];
      case 'json':
        return [json(), linter(jsonParseLinter())];
      case 'css':
      case 'scss':
        return [css(), syntaxErrorLinter];
      case 'html':
      case 'svg':
        return [javascript({ jsx: true }), syntaxErrorLinter];
      default:
        return [];
    }
  };

  return (
    <div className="h-full w-full overflow-hidden border-l">
      <CodeMirror
        value={content}
        height="100%"
        theme={githubDark}
        editable={editable ?? false}
        extensions={[...getLanguage(filePath), lintGutter()]}
        onChange={(value) => onCodeChange?.(value)}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
        }}
        className="text-sm h-full"
      />
    </div>
  );
}