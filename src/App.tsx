import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import './App.css'

const controlsTimeout = 2000

function App() {
  const [colors, setColors] = useState({ bg: '#0f172a', text: '#f8fafc' })
  const [showControls, setShowControls] = useState(true)
  const editorRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)

  // Sync colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', colors.bg);
    root.style.setProperty('--text-color', colors.text);
  }, [colors]);

  // Handle control visibility
  const resetTimer = () => {
    setShowControls(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setShowControls(false)
    }, controlsTimeout)
  }

  useEffect(() => {
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('touchstart', resetTimer)
    
    // Start initial idle timer without calling setState synchronously
    timerRef.current = setTimeout(() => {
      setShowControls(false)
    }, controlsTimeout)

    return () => {
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const adjustFontSize = () => {
    const editor = editorRef.current;
    const measure = measureRef.current;
    if (!editor || !measure) return;

    // Split text into lines to measure each one
    // browsers often add a trailing \n in innerText for contentEditable
    let text = editor.innerText || " ";
    if (text.endsWith('\n')) {
      text = text.slice(0, -1);
    }
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
    // We use a smaller additive (0.3) to reduce the jump when adding new lines
    const lineHeight = 1.1;
    const fitHeightSizePx = (availableHeight / (lines.length + 0.3)) / lineHeight;

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="editor-container">
      <div className={`controls ${showControls ? 'visible' : ''}`} onMouseEnter={resetTimer}>
        <div className="controls-group">
          <div className="control-item">
            <label>Fullscreen</label>
            <button className="fullscreen-btn" onClick={toggleFullscreen} title="Toggle Fullscreen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          </div>
          <div className="control-item">
            <label>Background</label>
            <input 
              type="color" 
              value={colors.bg} 
              onChange={(e) => {
                setColors(prev => ({ ...prev, bg: e.target.value }))
                resetTimer()
              }} 
            />
          </div>
          <div className="control-item">
            <label>Accent</label>
            <input 
              type="color" 
              value={colors.text} 
              onChange={(e) => {
                setColors(prev => ({ ...prev, text: e.target.value }))
                resetTimer()
              }} 
            />
          </div>
        </div>
        <div className="controls-info">Hidden when idle</div>
      </div>

      <div 
        ref={editorRef}
        className="text-editor" 
        contentEditable="plaintext-only"
        suppressContentEditableWarning={true}
        onInput={handleInput}
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
