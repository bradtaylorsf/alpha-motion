import Editor, { Monaco } from '@monaco-editor/react';
import { useCallback, useRef } from 'react';

interface CodePaneProps {
  code: string;
  onChange: (code: string) => void;
  onSave?: () => void;
}

export function CodePane({ code, onChange, onSave }: CodePaneProps) {
  const monacoConfigured = useRef(false);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    // Only configure once
    if (monacoConfigured.current) return;
    monacoConfigured.current = true;

    // Disable TypeScript semantic validation (type errors) but keep syntax errors
    // This prevents false errors from missing Remotion/React type definitions
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });

    // Set compiler options to be lenient
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: false,
    });
  }, []);

  const handleEditorMount = useCallback((editor: unknown) => {
    // Add Cmd/Ctrl+S save shortcut
    if (onSave && editor && typeof editor === 'object' && 'addCommand' in editor) {
      const monacoEditor = editor as { addCommand: (keybinding: number, handler: () => void) => void };
      // KeyMod.CtrlCmd | KeyCode.KeyS = 2048 | 49 = 2097
      monacoEditor.addCommand(2097, onSave);
    }
  }, [onSave]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#3c3c3c]">
        <span className="text-sm text-[#808080]">component.tsx</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#808080]">TypeScript React</span>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 16 },
            folding: true,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}
