import { ArrowUp, Paperclip, CheckSquare } from 'lucide-react';
import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { LiquidGlassCanvas } from './LiquidGlassCanvas';

interface SubchatInputProps {
  onSendMessage: (message: string) => void;
  taskTitle: string;
}

export function SubchatInput({ onSendMessage, taskTitle }: SubchatInputProps) {
  const [message, setMessage] = useState('');
  const [showSubtaskCreate, setShowSubtaskCreate] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateSubtask = () => {
    if (subtaskTitle.trim()) {
      // Here you would actually create the subtask
      console.log('Creating subtask:', subtaskTitle);
      setSubtaskTitle('');
      setShowSubtaskCreate(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    // Reset height when message is cleared
    if (message === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message]);

  return (
    <div className="w-full">
      {/* Context Badge */}
      <div className="mb-2 flex items-center gap-2 px-2">

      </div>

      {/* Subtask Quick Create */}
      {showSubtaskCreate && (
        <div className="mb-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Subtask title..."
              className="flex-1 bg-transparent border-none focus:outline-none text-sm"
              style={{ color: '#E2E8DD' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateSubtask();
                } else if (e.key === 'Escape') {
                  setShowSubtaskCreate(false);
                  setSubtaskTitle('');
                }
              }}
              autoFocus
            />
            <button
              onClick={handleCreateSubtask}
              className="px-3 py-1 rounded text-xs transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#636940', color: '#E2E8DD' }}
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowSubtaskCreate(false);
                setSubtaskTitle('');
              }}
              className="px-3 py-1 rounded text-xs transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#E2E8DD' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Input */}
      <div 
        ref={containerRef}
        className="relative rounded-xl"
        style={{ 
          backgroundColor: 'rgba(22, 22, 22, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* WebGL liquid glass effect */}
        <LiquidGlassCanvas containerRef={containerRef} />
        <div 
          className="flex flex-col p-4 gap-3"
          style={{
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Text input - full width */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message about ${taskTitle}...`}
            style={{ 
              backgroundColor: 'transparent',
              color: '#E2E8DD',
              lineHeight: '1.5',
              maxHeight: '360px', // Approximately 15 rows at 1.5 line-height
              overflow: 'auto',
            }}
            className="w-full resize-none focus:outline-none placeholder:opacity-40"
            rows={3}
          />

          {/* Bottom row with icons and send button */}
          <div className="flex items-center justify-between">
            {/* Left side buttons */}
            <div className="flex gap-1">
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
                aria-label="Attach file"
                onClick={() => setShowSubtaskCreate(false)}
              >
                <Paperclip className="w-5 h-5" style={{ color: '#E2E8DD', opacity: 0.6 }} />
              </button>
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
                aria-label="Create subtask"
                onClick={() => setShowSubtaskCreate(!showSubtaskCreate)}
                style={{
                  backgroundColor: showSubtaskCreate ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                }}
              >
                <CheckSquare className="w-5 h-5" style={{ color: '#E2E8DD', opacity: 0.6 }} />
              </button>
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              style={{
                backgroundColor: message.trim() ? '#DB4C40' : 'rgba(255, 255, 255, 0.1)',
              }}
              className="w-10 h-10 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 flex-shrink-0"
              aria-label="Send message"
            >
              <ArrowUp className="w-5 h-5" style={{ color: message.trim() ? '#E2E8DD' : '#666' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
