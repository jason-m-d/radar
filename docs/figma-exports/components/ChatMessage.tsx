import { ArrowRight, CheckCircle, Copy, Pencil, Check, Radio, User, Clock, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
  id: string;
  message: string;
  isUser: boolean;
  timestamp?: string;
  confidence?: number;
  onEdit: (id: string, newText: string) => void;
  onTaskClick?: (taskId: string) => void;
  onSnoozeSelect?: (timeframe: string) => void;
}

function parseMessageWithTask(message: string) {
  const taskPattern = /\[([^\]]+)\]/;
  const match = message.match(taskPattern);
  
  if (match) {
    const beforeTask = message.substring(0, match.index);
    const taskContent = match[1];
    const afterTask = message.substring(match.index! + match[0].length);
    
    return { beforeTask, taskContent, afterTask, hasTask: true };
  }
  
  return { beforeTask: message, taskContent: '', afterTask: '', hasTask: false };
}

function isSnoozeMessage(message: string): boolean {
  return message.includes('When should I remind you about this?');
}

function renderTextWithBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} style={{ fontWeight: 600 }}>{part}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function MessageActionButtons({ onCopy, isCopied }: { onCopy: () => void; isCopied: boolean }) {
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const handleButtonClick = (buttonName: string, callback: () => void) => {
    setActiveButton(buttonName);
    callback();
    setTimeout(() => setActiveButton(null), 200);
  };

  const buttonStyle = (isActive: boolean) => ({
    opacity: isActive ? 1 : 0.3,
    transform: isActive ? 'scale(0.95)' : 'scale(1)',
    transition: 'all 150ms ease-out',
  });

  return (
    <div className="flex items-center gap-1.5 mt-2">
      {/* Copy button */}
      <button
        onClick={() => handleButtonClick('copy', onCopy)}
        className="flex items-center justify-center transition-all hover:brightness-150"
        style={{
          ...buttonStyle(activeButton === 'copy'),
          width: '24px',
          height: '24px',
          color: isCopied ? '#7ba885' : '#E2E8DD',
        }}
        aria-label="Copy message"
      >
        {isCopied ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Retry button */}
      <button
        onClick={() => handleButtonClick('retry', () => console.log('Retry'))}
        className="flex items-center justify-center transition-all hover:brightness-150"
        style={{
          ...buttonStyle(activeButton === 'retry'),
          width: '24px',
          height: '24px',
          color: '#E2E8DD',
        }}
        aria-label="Retry message"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* Thumbs up button */}
      <button
        onClick={() => handleButtonClick('thumbsUp', () => console.log('Thumbs up'))}
        className="flex items-center justify-center transition-all hover:brightness-150"
        style={{
          ...buttonStyle(activeButton === 'thumbsUp'),
          width: '24px',
          height: '24px',
          color: activeButton === 'thumbsUp' ? '#7ba885' : '#E2E8DD',
        }}
        aria-label="Good response"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>

      {/* Thumbs down button */}
      <button
        onClick={() => handleButtonClick('thumbsDown', () => console.log('Thumbs down'))}
        className="flex items-center justify-center transition-all hover:brightness-150"
        style={{
          ...buttonStyle(activeButton === 'thumbsDown'),
          width: '24px',
          height: '24px',
          color: activeButton === 'thumbsDown' ? '#D89090' : '#E2E8DD',
        }}
        aria-label="Bad response"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ChatMessage({ id, message, isUser, timestamp, confidence, onEdit, onTaskClick, onSnoozeSelect }: ChatMessageProps) {
  const parsed = parseMessageWithTask(message);
  const isSnooze = !isUser && isSnoozeMessage(message);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(message);
  };

  const handleSaveEdit = () => {
    onEdit(id, editText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(message);
    setIsEditing(false);
  };
  
  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'items-end' : 'items-start'} flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Message content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Timestamp (for RADAR messages) */}
          {!isUser && (
            <div className="flex items-center gap-2 px-1">
              {timestamp && (
                <span className="text-xs opacity-50" style={{ color: '#E2E8DD' }}>
                  {timestamp}
                </span>
              )}
            </div>
          )}

          {/* Message bubble/content */}
          {isUser ? (
            <div
              className="relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isEditing ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full min-h-[60px] px-4 py-3 rounded-lg resize-none focus:outline-none"
                    style={{ backgroundColor: '#E2E8DD', color: '#0F0E0E' }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 rounded text-xs transition-opacity hover:opacity-80"
                      style={{ backgroundColor: '#636940', color: '#E2E8DD' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 rounded text-xs transition-opacity hover:opacity-80"
                      style={{ backgroundColor: '#2A2928', color: '#E2E8DD' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    className="px-4 py-3 rounded-lg flex items-start gap-3"
                    style={{ backgroundColor: '#E2E8DD', color: '#0F0E0E' }}
                  >
                    <p className="whitespace-pre-wrap flex-1">{message}</p>
                    {/* User avatar inside bubble on right - aligned to first line */}
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#DB4C40', marginTop: '-4px' }}
                    >
                      <User className="w-5 h-5" style={{ color: '#E2E8DD' }} />
                    </div>
                  </div>
                  {isHovered && (
                    <div className="absolute -bottom-6 right-0 flex gap-1 pt-0.5">
                      <button
                        onClick={handleCopy}
                        className="p-1 transition-opacity hover:opacity-60"
                        aria-label="Copy message"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                        ) : (
                          <Copy className="w-3.5 h-3.5" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                        )}
                      </button>
                      <button
                        onClick={handleEdit}
                        className="p-1 transition-opacity hover:opacity-60"
                        aria-label="Edit message"
                      >
                        <Pencil className="w-3.5 h-3.5" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isSnooze ? (
            // Snooze interaction message
            <div className="flex-1">
              {/* Main message bubble */}
              <div
                className="px-5 py-5 rounded-xl"
                style={{ backgroundColor: '#5b4842', color: '#fef3ea' }}
              >
                <p className="whitespace-pre-wrap" style={{ color: '#fef3ea', lineHeight: '1.5' }}>
                  When should I remind you about this?
                </p>
              </div>

              {/* Connecting line */}
              <div 
                className="ml-5"
                style={{
                  width: '5px',
                  height: '14px',
                  backgroundColor: '#fef3ea',
                  borderRadius: '0 0 0px 0px',
                }}
              />

              {/* Button Row */}
              <div className="flex items-center gap-3">
                {/* Clock icon tile */}
                <button
                  className="px-3 py-2.5 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: 'linear-gradient(130deg, #5b4842 0%, #425b48 100%)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                  onClick={() => onSnoozeSelect?.('custom')}
                >
                  <Clock className="w-5 h-5" style={{ color: '#fef3ea' }} />
                </button>

                {/* Later Today tile */}
                <button
                  className="px-3 py-2.5 rounded-lg transition-all"
                  style={{
                    background: 'linear-gradient(130deg, #5b4842 0%, #425b48 100%)',
                    color: '#fef3ea',
                    fontSize: '14px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                  onClick={() => onSnoozeSelect?.('later-today')}
                >
                  Later Today
                </button>

                {/* Tomorrow tile */}
                <button
                  className="px-3 py-2.5 rounded-lg transition-all"
                  style={{
                    background: 'linear-gradient(130deg, #5b4842 0%, #425b48 100%)',
                    color: '#fef3ea',
                    fontSize: '14px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                  onClick={() => onSnoozeSelect?.('tomorrow')}
                >
                  Tomorrow
                </button>

                {/* Next Week tile */}
                <button
                  className="px-3 py-2.5 rounded-lg transition-all"
                  style={{
                    background: 'linear-gradient(130deg, #5b4842 0%, #425b48 100%)',
                    color: '#fef3ea',
                    fontSize: '14px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                  onClick={() => onSnoozeSelect?.('next-week')}
                >
                  Next Week
                </button>
              </div>

              {/* Helper text */}
              <p 
                className="mt-3 ml-5"
                style={{ color: '#E2E8DD', opacity: 0.5 }}
              >
                Or just tell me in the chat...
              </p>

              {/* Message Action Buttons */}
              <MessageActionButtons onCopy={handleCopy} isCopied={isCopied} />
            </div>
          ) : parsed.hasTask ? (
            // Action message with separated task card
            <div className="flex-1">
              {/* Main message bubble */}
              <div
                className="px-5 py-5 rounded-xl"
                style={{ backgroundColor: '#5b4842', color: '#fef3ea' }}
              >
                <p className="whitespace-pre-wrap" style={{ color: '#fef3ea', lineHeight: '1.5' }}>
                  {renderTextWithBold(parsed.beforeTask)}
                </p>
                {parsed.afterTask && (
                  <p className="whitespace-pre-wrap mt-2" style={{ color: '#fef3ea', lineHeight: '1.5' }}>
                    {renderTextWithBold(parsed.afterTask)}
                  </p>
                )}
              </div>

              {/* Task card */}
              <div 
                className="px-4 py-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all group mt-3"
                style={{ 
                  backgroundColor:'rgba(233, 138, 21, 0.2)'
                }}
                onClick={() => onTaskClick?.(id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(254, 243, 234, 0.2)' }}
                >
                  <div 
                    className="rounded-full"
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: 'rgba(233, 138, 21, 0.2)' 
                    }} 
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: '#fef3ea', fontSize: 16,fontWeight: 500 }}>
                    {parsed.taskContent.split('\n')[0]}
                  </p>
                  {parsed.taskContent.split('\n')[1] && (
                    <p className="text-xs mt-1" style={{ color: '#fef3ea', opacity: 0.8 }}>
                      {parsed.taskContent.split('\n')[1]}
                    </p>
                  )}
                </div>
                <ArrowRight 
                  className="w-6 h-6 flex-shrink-0 transition-transform group-hover:translate-x-1" 
                  style={{ color: '#fef3ea' }} 
                />
              </div>

              {/* Message Action Buttons */}
              <MessageActionButtons onCopy={handleCopy} isCopied={isCopied} />
            </div>
          ) : (
            // Regular RADAR message without task
            <div className="px-1 flex-1">
              <p className="whitespace-pre-wrap" style={{ color: '#E2E8DD', lineHeight: '1.5' }}>
                {renderTextWithBold(message)}
              </p>
              
              {/* Message Action Buttons */}
              <MessageActionButtons onCopy={handleCopy} isCopied={isCopied} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}