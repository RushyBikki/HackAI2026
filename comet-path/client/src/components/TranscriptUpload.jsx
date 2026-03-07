import React, { useState, useRef } from 'react';

export default function TranscriptUpload({ onCoursesExtracted }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | parsing | done | error
  const [message, setMessage] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const inputRef = useRef();

  // Upload a File object (PDF or TXT) via multipart form
  async function uploadFile(file) {
    if (!file) return;
    setStatus('parsing');
    setMessage('');
    try {
      const form = new FormData();
      form.append('transcript', file);

      const res = await fetch('/api/transcript/file', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

      const courses = data.courses || [];
      setStatus('done');
      setMessage(`Found ${courses.length} completed courses`);
      onCoursesExtracted(courses);
    } catch (e) {
      setStatus('error');
      setMessage(e.message);
    }
  }

  // Submit pasted text via JSON body
  async function submitPaste() {
    if (!pasteText.trim()) return;
    setStatus('parsing');
    setMessage('');
    try {
      const res = await fetch('/api/transcript/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

      const courses = data.courses || [];
      setStatus('done');
      setMessage(`Found ${courses.length} completed courses`);
      onCoursesExtracted(courses);
    } catch (e) {
      setStatus('error');
      setMessage(e.message);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-3">
      {!pasteMode ? (
        <div
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
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
            accept=".pdf,.txt,.text"
            className="hidden"
            onChange={e => uploadFile(e.target.files[0])}
          />
          <div className="text-2xl mb-1.5">📄</div>
          <p className="text-sm text-gray-300 font-medium">Drop transcript here or click to browse</p>
          <p className="text-xs text-gray-500 mt-1">
            Supports <span className="text-blue-400">PDF</span> (UTD unofficial transcript) and <span className="text-blue-400">.txt</span>
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full h-32 bg-space-700 border border-blue-900 rounded-xl p-3 text-xs text-gray-300 resize-none focus:outline-none focus:border-blue-500 font-mono"
            placeholder="Paste your UTD unofficial transcript text here..."
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          <button
            onClick={submitPaste}
            disabled={!pasteText.trim() || status === 'parsing'}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors font-medium"
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
          {pasteMode ? '← File upload instead' : 'Or paste text instead'}
        </button>
        {status === 'parsing' && (
          <span className="text-xs text-blue-400 animate-pulse">Parsing...</span>
        )}
      </div>

      {status === 'done' && (
        <div className="bg-green-950/40 border border-green-800/50 rounded-lg px-3 py-2 text-xs text-green-400">
          {message} — courses checked below
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
