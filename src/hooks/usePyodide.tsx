import { useState, useEffect, useCallback, useRef } from 'react';

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<any>;
  loadPackage: (packages: string | string[]) => Promise<void>;
  runPython: (code: string) => any;
  globals: any;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  success: boolean;
  images: string[]; // base64 encoded images from matplotlib
}

const PRELOADED_PACKAGES = ['numpy', 'pandas', 'matplotlib'];

export function usePyodide() {
  const [pyodide, setPyodide] = useState<PyodideInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing Python environment...');
  const [error, setError] = useState<string | null>(null);
  const stdoutRef = useRef<string[]>([]);
  const stderrRef = useRef<string[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadPyodide() {
      try {
        setLoadingStatus('Loading Python runtime...');
        
        // Load Pyodide from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        script.async = true;
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide'));
          document.head.appendChild(script);
        });

        if (!mounted) return;

        setLoadingStatus('Initializing Python interpreter...');
        
        // @ts-ignore - Pyodide is loaded via script
        const pyodideInstance = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
          stdout: (text: string) => {
            stdoutRef.current.push(text);
          },
          stderr: (text: string) => {
            stderrRef.current.push(text);
          },
        });

        if (!mounted) return;

        setLoadingStatus('Loading scientific packages (numpy, pandas, matplotlib)...');
        
        // Preload common packages
        await pyodideInstance.loadPackage(PRELOADED_PACKAGES);

        if (!mounted) return;

        // Set up matplotlib for non-interactive backend
        await pyodideInstance.runPythonAsync(`
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64

def _save_plots_to_base64():
    """Save all matplotlib figures as base64 strings"""
    images = []
    for fig_num in plt.get_fignums():
        fig = plt.figure(fig_num)
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        images.append(base64.b64encode(buf.read()).decode('utf-8'))
        plt.close(fig)
    return images

# Create a simple virtual filesystem for limited file operations
_virtual_fs = {}

def _vfs_write(filename, content):
    """Write to virtual filesystem"""
    _virtual_fs[filename] = content
    return f"Written to {filename}"

def _vfs_read(filename):
    """Read from virtual filesystem"""
    if filename not in _virtual_fs:
        raise FileNotFoundError(f"File not found: {filename}")
    return _virtual_fs[filename]

def _vfs_list():
    """List files in virtual filesystem"""
    return list(_virtual_fs.keys())

# Monkey-patch open for simple file operations
import builtins
_original_open = builtins.open

class VirtualFile:
    def __init__(self, filename, mode='r'):
        self.filename = filename
        self.mode = mode
        self.content = ''
        if 'r' in mode and filename in _virtual_fs:
            self.content = _virtual_fs[filename]
        elif 'r' in mode:
            raise FileNotFoundError(f"File not found: {filename}")
    
    def write(self, data):
        self.content += data
        return len(data)
    
    def read(self):
        return self.content
    
    def readline(self):
        lines = self.content.split('\\n')
        if lines:
            line = lines.pop(0)
            self.content = '\\n'.join(lines)
            return line + '\\n' if lines else line
        return ''
    
    def readlines(self):
        return [line + '\\n' for line in self.content.split('\\n')]
    
    def close(self):
        if 'w' in self.mode or 'a' in self.mode:
            _virtual_fs[self.filename] = self.content
    
    def __enter__(self):
        return self
    
    def __exit__(self, *args):
        self.close()

def _virtual_open(filename, mode='r', *args, **kwargs):
    # Only virtualize user files, not system files
    if filename.startswith('/') or filename.startswith('..'):
        return _original_open(filename, mode, *args, **kwargs)
    return VirtualFile(filename, mode)

builtins.open = _virtual_open

print("Python environment ready with numpy, pandas, matplotlib")
print("Virtual filesystem enabled for simple file I/O")
        `);

        if (!mounted) return;

        setPyodide(pyodideInstance);
        setIsLoading(false);
        setLoadingStatus('Ready');
        
      } catch (err) {
        console.error('Failed to load Pyodide:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load Python environment');
          setIsLoading(false);
        }
      }
    }

    loadPyodide();

    return () => {
      mounted = false;
    };
  }, []);

  const runCode = useCallback(async (code: string): Promise<ExecutionResult> => {
    if (!pyodide) {
      return {
        stdout: '',
        stderr: 'Python environment not loaded',
        success: false,
        images: [],
      };
    }

    // Clear output buffers
    stdoutRef.current = [];
    stderrRef.current = [];

    try {
      // Run the user's code
      await pyodide.runPythonAsync(code);

      // Check for any matplotlib plots and save them
      const imagesResult = await pyodide.runPythonAsync('_save_plots_to_base64()');
      // Handle PyProxy objects from Pyodide
      let imageArray: string[] = [];
      if (imagesResult) {
        if (typeof imagesResult.toJs === 'function') {
          imageArray = imagesResult.toJs();
        } else if (Array.isArray(imagesResult)) {
          imageArray = imagesResult;
        }
      }

      return {
        stdout: stdoutRef.current.join('\n'),
        stderr: stderrRef.current.join('\n'),
        success: stderrRef.current.length === 0,
        images: imageArray,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        stdout: stdoutRef.current.join('\n'),
        stderr: errorMessage,
        success: false,
        images: [],
      };
    }
  }, [pyodide]);

  const loadPackage = useCallback(async (packageName: string): Promise<boolean> => {
    if (!pyodide) return false;
    
    try {
      await pyodide.loadPackage(packageName);
      return true;
    } catch (err) {
      console.error(`Failed to load package ${packageName}:`, err);
      return false;
    }
  }, [pyodide]);

  return {
    runCode,
    loadPackage,
    isLoading,
    loadingStatus,
    error,
    isReady: !isLoading && !error && !!pyodide,
    availablePackages: PRELOADED_PACKAGES,
  };
}
