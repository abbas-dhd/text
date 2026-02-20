import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import './App.css'

function App() {
  const [colors, setColors] = useState({ bg: '#0f172a', text: '#f8fafc' })
  const editorRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)

  // Sync colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', colors.bg);
    root.style.setProperty('--text-color', colors.text);
  }, [colors]);

  const adjustFontSize = () => {
    const editor = editorRef.current;
    const measure = measureRef.current;
    if (!editor || !measure) return;

    // Split text into lines to measure each one
    const text = editor.innerText || " ";
    const lines = text.split('\n');
    
    // We use a reference font size for measurement
    const referenceSize = 100;
    measure.style.fontSize = `${referenceSize}px`;
    
    let maxLineWidth = 0;
    lines.forEach(line => {
      measure.innerText = line || " "; // Space for empty lines
      maxLineWidth = Math.max(maxLineWidth, measure.scrollWidth);
    });

    // Available width/height for content based on window size
    const availableWidth = window.innerWidth * 0.9; // 5vw padding on each side
    const availableHeight = window.innerHeight * 0.8; // More vertical breathing room
    
    // Size needed to fit the longest line perfectly to the width
    const fitWidthSizePx = (referenceSize * availableWidth) / Math.max(1, maxLineWidth);
    
    // Size needed to fit all lines perfectly to the height
    // We add a small offset to lines.length to ensure single lines don't get too tall
    const lineHeight = 1.1;
    const fitHeightSizePx = (availableHeight / (lines.length + 0.5)) / lineHeight;

    // Use the minimum of both, plus a hard cap for aesthetics
    const maxFontSize = window.innerWidth * 0.25; // Cap at 25vw for short words
    const finalSizePx = Math.min(fitWidthSizePx, fitHeightSizePx, maxFontSize);

    document.documentElement.style.setProperty('--font-size-px', `${finalSizePx}px`);
  };

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(adjustFontSize);
    });
    observer.observe(editor);
    
    adjustFontSize();
    
    return () => observer.disconnect();
  }, []);

  const handleInput = () => {
    adjustFontSize();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Allow the default behavior for plaintext-only if used, 
      // but ensure we don't get nested divs.
      // Most modern browsers with contentEditable="plaintext-only" will do this right.
    }
  };

  return (
    <div className="editor-container">
      <div className="controls">
        <div className="control-item">
          <label>Background</label>
          <input 
            type="color" 
            value={colors.bg} 
            onChange={(e) => setColors(prev => ({ ...prev, bg: e.target.value }))} 
          />
        </div>
        <div className="control-item">
          <label>Accent</label>
          <input 
            type="color" 
            value={colors.text} 
            onChange={(e) => setColors(prev => ({ ...prev, text: e.target.value }))} 
          />
        </div>
      </div>

      <div 
        ref={editorRef}
        className="text-editor" 
        contentEditable="plaintext-only"
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      >
        TEXT
      </div>

      <div className="measure-wrapper">
        <div ref={measureRef} className="measure-content" aria-hidden="true"></div>
      </div>
    </div>
  )
}

export default App
