import { ArrowUp, Plus, RefreshCw } from 'lucide-react';
import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { LiquidGlassCanvas } from './LiquidGlassCanvas';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onCatchMeUp?: () => void;
  isCatchingUp?: boolean;
}

export function ChatInput({ onSendMessage, onCatchMeUp, isCatchingUp = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
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
            placeholder="Describe what needs to be created"
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
              {/* Catch me up button */}
              {onCatchMeUp && (
                <div className="relative">
                  <button
                    onClick={onCatchMeUp}
                    disabled={isCatchingUp}
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150"
                    style={{
                      opacity: isCatchingUp ? 1 : 0.5,
                    }}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    aria-label="Catch me up"
                    onMouseOver={(e) => {
                      if (!isCatchingUp) {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.backgroundColor = 'rgba(233, 138, 21, 0.2)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isCatchingUp) {
                        e.currentTarget.style.opacity = '0.5';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div 
                      className={`rounded-full ${isCatchingUp ? 'animate-pulse' : ''}`}
                      style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'rgb(233, 138, 21)',
                        boxShadow: `
                          0 0 8px rgba(233, 138, 21, 0.8),
                          0 0 16px rgba(233, 138, 21, 0.6),
                          0 0 24px rgba(233, 138, 21, 0.4),
                          0 0 32px rgba(233, 138, 21, 0.2)
                        `,
                      }}
                    />
                  </button>
                  {/* Tooltip */}
                  {showTooltip && !isCatchingUp && (
                    <div 
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded whitespace-nowrap text-xs pointer-events-none"
                      style={{
                        backgroundColor: 'rgba(30, 30, 30, 0.95)',
                        color: '#E2E8DD',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      Catch me up
                    </div>
                  )}
                </div>
              )}
              
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
                aria-label="Add attachment"
              >
                <Plus className="w-5 h-5" style={{ color: '#E2E8DD', opacity: 0.6 }} />
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
