import React, { useState, useRef } from 'react';

export default function TranscriptUpload({ onCoursesExtracted }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | parsing | done | error
  const [message, setMessage] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const inputRef = useRef();

  async function parseText(text) {
    setStatus('parsing');
    setMessage('');
    try {
      const res = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parse failed');
      const courses = data.courses || [];
      setStatus('done');
      setMessage(`Found ${courses.length} completed courses (method: ${data.method})`);
      onCoursesExtracted(courses);
    } catch (e) {
      setStatus('error');
      setMessage(e.message);
    }
  }

  async function handleFile(file) {
    if (!file) return;
    // Read as text — works for .txt and copy-pasted PDFs saved as text
    const text = await file.text();
    await parseText(text);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handlePaste() {
    if (pasteText.trim()) parseText(pasteText);
  }

  return (
    <div className="space-y-3">
      {!pasteMode ? (
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragging
              ? 'border-blue-500 bg-blue-950/40'
              : 'border-blue-900/50 hover:border-blue-700 hover:bg-space-700/30'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.text"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
          <div className="text-3xl mb-2">📄</div>
          <p className="text-sm text-gray-300 font-medium">Drop your transcript here</p>
          <p className="text-xs text-gray-500 mt-1">
            Save your UTD unofficial transcript as a .txt file (Ctrl+A, copy, paste to Notepad, save)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full h-36 bg-space-700 border border-blue-900 rounded-xl p-3 text-xs text-gray-300 resize-none focus:outline-none focus:border-blue-500 font-mono"
            placeholder="Paste your UTD unofficial transcript text here..."
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          <button
            onClick={handlePaste}
            disabled={!pasteText.trim() || status === 'parsing'}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors"
          >
            {status === 'parsing' ? 'Parsing...' : 'Extract Courses'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => { setPasteMode(m => !m); setStatus('idle'); setMessage(''); }}
          className="text-xs text-blue-400 hover:underline"
        >
          {pasteMode ? '← Back to file upload' : 'Or paste text instead'}
        </button>
        {status === 'parsing' && (
          <span className="text-xs text-blue-400 animate-pulse">Parsing transcript...</span>
        )}
      </div>

      {status === 'done' && (
        <div className="bg-green-950/40 border border-green-800/50 rounded-lg px-3 py-2 text-xs text-green-400">
          {message}
        </div>
      )}
      {status === 'error' && (
        <div className="bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2 text-xs text-red-400">
          {message}
        </div>
      )}
    </div>
  );
}
