import { X, ArrowLeft, Star, FileText, Clock, User, ChevronRight, ChevronDown, Lightbulb, FolderOpen, Plus, Mail, Paperclip, Link2, Pin, ExternalLink } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { SubchatInput } from './SubchatInput';
import { RadarTypingIndicator } from './RadarTypingIndicator';

interface TaskData {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  dayOfWeek: string;
  description: string;
  stores: string[];
  priority: string;
  assignee: string;
  project?: { name: string; emoji: string };
  people: Array<{ name: string; initials: string }>;
  lastActivity: string;
  originalEmail: {
    from: string;
    fromInitials: string;
    timestamp: string;
    subject: string;
    preview: string;
  };
  attachedFiles?: Array<{ name: string; type: string; size: string }>;
  relatedTasks?: Array<{ name: string; status: string; dueDate: string }>;
  activity: Array<{ action: string; timestamp: string; user: string }>;
  radarSuggestions: string[];
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  confidence?: number;
}

interface TaskSubchatProps {
  isOpen: boolean;
  onClose: () => void;
  taskData: TaskData;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onRadarMessage: (text: string, confidence?: number) => void;
  onEditMessage: (id: string, newText: string) => void;
  onSnoozeSelect?: (timeframe: string) => void;
}

export function TaskSubchat({ isOpen, onClose, taskData, messages, onSendMessage, onRadarMessage, onEditMessage, onSnoozeSelect }: TaskSubchatProps) {
  const [isPaneCollapsed, setIsPaneCollapsed] = useState(false);
  const [emailThreadExpanded, setEmailThreadExpanded] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [filesExpanded, setFilesExpanded] = useState(false);
  const [relatedExpanded, setRelatedExpanded] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);
  const [emailPinned, setEmailPinned] = useState(false);
  const [filesPinned, setFilesPinned] = useState(false);
  const [relatedPinned, setRelatedPinned] = useState(false);
  const [activityPinned, setActivityPinned] = useState(false);
  const [showUndoBanner, setShowUndoBanner] = useState(false);
  const [undoAction, setUndoAction] = useState('');
  const [dueDatePulse, setDueDatePulse] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [hoveredEmailIndex, setHoveredEmailIndex] = useState<number | null>(null);

  // Mock email thread data
  const emailThread = [
    {
      from: 'Steve Chen',
      fromInitials: 'SC',
      timestamp: 'Oct 1, 3:45 PM',
      subject: 'Q1 2025 Marketing Fund Reconciliation Due',
      body: "Hi Jason,\n\nWe need the marketing fund receipts and spend breakdown by Friday, October 4th. Please include data for Store 326, 451, and 895.\n\nThis is required for our quarterly corporate reporting. Let me know if you have any questions or need the template.\n\nThanks,\nSteve",
    },
    {
      from: 'Jason Miller',
      fromInitials: 'JM',
      timestamp: 'Oct 1, 4:12 PM',
      body: "Hey Steve,\n\nGot it. I'll pull the data for those stores. Can you send over the template so I make sure I'm formatting everything correctly?\n\nAlso, do you need just receipts or should I include the budget variance analysis as well?\n\nThanks,\nJason",
    },
    {
      from: 'Steve Chen',
      fromInitials: 'SC',
      timestamp: 'Oct 1, 4:28 PM',
      body: "Jason,\n\nTemplate attached. Please include both receipts and variance analysis - corporate wants the full picture this quarter.\n\nLet me know if you run into any issues pulling the data.\n\nSteve",
    },
    {
      from: 'Jason Miller',
      fromInitials: 'JM',
      timestamp: 'Oct 2, 9:15 AM',
      body: "Perfect, working on it now. Should have everything ready by Thursday EOD.\n\nJason",
    },
  ];
  
  const emailHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const emailCloseTimeout = useRef<NodeJS.Timeout | null>(null);
  const filesHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const filesCloseTimeout = useRef<NodeJS.Timeout | null>(null);
  const relatedHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const relatedCloseTimeout = useRef<NodeJS.Timeout | null>(null);
  const activityHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const activityCloseTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleCompleteTask = () => {
    setUndoAction('completed');
    setShowUndoBanner(true);
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      onRadarMessage("Great work completing this. I'll store this task context for 40 days just in case you need to come back to it.");
    }, 800);
    setTimeout(() => setShowUndoBanner(false), 30000);
  };

  const handleSnooze = () => {
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      onRadarMessage("When should I remind you about this?\n\n[Later today] [Tomorrow] [Next week] [In 2 weeks] [Custom...]");
    }, 500);
  };

  const handleBackBurner = () => {
    setUndoAction('moved to back burner');
    setShowUndoBanner(true);
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      onRadarMessage("Ok, I'll move this to the back burner for now. If you ever need to resurface this task, look in the Back Burner or just ask me about it.");
    }, 800);
    setTimeout(() => setShowUndoBanner(false), 30000);
  };

  const handleUndo = () => {
    setShowUndoBanner(false);
    onRadarMessage(`Undoing: Task ${undoAction}`);
  };

  const triggerDueDatePulse = () => {
    setDueDatePulse(true);
    setTimeout(() => setDueDatePulse(false), 600);
  };

  const handleSendMessageWithScroll = (text: string) => {
    onSendMessage(text);
    
    // Scroll to bottom when user sends a message
    setTimeout(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  // Hover handlers for email section
  const handleEmailMouseEnter = () => {
    if (emailPinned) return;
    if (emailCloseTimeout.current) {
      clearTimeout(emailCloseTimeout.current);
      emailCloseTimeout.current = null;
    }
    emailHoverTimeout.current = setTimeout(() => {
      setEmailExpanded(true);
    }, 200);
  };

  const handleEmailMouseLeave = () => {
    if (emailPinned) return;
    if (emailHoverTimeout.current) {
      clearTimeout(emailHoverTimeout.current);
      emailHoverTimeout.current = null;
    }
    emailCloseTimeout.current = setTimeout(() => {
      setEmailExpanded(false);
    }, 300);
  };

  const handleEmailClick = () => {
    setEmailPinned(!emailPinned);
  };

  // Hover handlers for files section
  const handleFilesMouseEnter = () => {
    if (filesPinned) return;
    if (filesCloseTimeout.current) {
      clearTimeout(filesCloseTimeout.current);
      filesCloseTimeout.current = null;
    }
    filesHoverTimeout.current = setTimeout(() => {
      setFilesExpanded(true);
    }, 200);
  };

  const handleFilesMouseLeave = () => {
    if (filesPinned) return;
    if (filesHoverTimeout.current) {
      clearTimeout(filesHoverTimeout.current);
      filesHoverTimeout.current = null;
    }
    filesCloseTimeout.current = setTimeout(() => {
      setFilesExpanded(false);
    }, 300);
  };

  const handleFilesClick = () => {
    setFilesPinned(!filesPinned);
  };

  // Hover handlers for related section
  const handleRelatedMouseEnter = () => {
    if (relatedPinned) return;
    if (relatedCloseTimeout.current) {
      clearTimeout(relatedCloseTimeout.current);
      relatedCloseTimeout.current = null;
    }
    relatedHoverTimeout.current = setTimeout(() => {
      setRelatedExpanded(true);
    }, 200);
  };

  const handleRelatedMouseLeave = () => {
    if (relatedPinned) return;
    if (relatedHoverTimeout.current) {
      clearTimeout(relatedHoverTimeout.current);
      relatedHoverTimeout.current = null;
    }
    relatedCloseTimeout.current = setTimeout(() => {
      setRelatedExpanded(false);
    }, 300);
  };

  const handleRelatedClick = () => {
    setRelatedPinned(!relatedPinned);
  };

  // Hover handlers for activity section
  const handleActivityMouseEnter = () => {
    if (activityPinned) return;
    if (activityCloseTimeout.current) {
      clearTimeout(activityCloseTimeout.current);
      activityCloseTimeout.current = null;
    }
    activityHoverTimeout.current = setTimeout(() => {
      setActivityExpanded(true);
    }, 200);
  };

  const handleActivityMouseLeave = () => {
    if (activityPinned) return;
    if (activityHoverTimeout.current) {
      clearTimeout(activityHoverTimeout.current);
      activityHoverTimeout.current = null;
    }
    activityCloseTimeout.current = setTimeout(() => {
      setActivityExpanded(false);
    }, 300);
  };

  const handleActivityClick = () => {
    setActivityPinned(!activityPinned);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-50"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          animation: 'fadeIn 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={onClose}
      />

      {/* Subchat Panel */}
      <div 
        className="fixed top-0 right-0 bottom-0 z-50 flex"
        style={{
          width: '85%',
          padding: '16px 16px 16px 0',
          animation: 'slideInFromRight 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Task Details Pane - Expands to include Email Thread */}
        <div 
          className="flex-shrink-0 rounded-lg mr-2 flex overflow-hidden"
          style={{
            width: isPaneCollapsed ? '48px' : emailThreadExpanded ? '700px' : '320px',
            backgroundColor: 'rgba(30, 30, 30, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px) saturate(105%)',
            WebkitBackdropFilter: 'blur(8px) saturate(105%)',
            transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Task Details Content */}
          <div 
            className="flex flex-col"
            style={{
              width: isPaneCollapsed ? '48px' : '320px',
              flexShrink: 0,
            }}
          >
          {isPaneCollapsed ? (
            <div className="p-2">
              <button
                onClick={() => setIsPaneCollapsed(false)}
                className="w-full h-10 rounded-md flex items-center justify-center transition-all hover:bg-white/5"
                aria-label="Expand details pane"
              >
                <ChevronRight className="w-5 h-5" style={{ color: '#E2E8DD', opacity: 0.7 }} />
              </button>
            </div>
          ) : (
            <>
              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Collapse Button */}
              {/* Task Info Section (Always Visible) */}
              <div>
                {/* Task Title */}
                <textarea
                  defaultValue={taskData.title}
                  className="w-full bg-transparent border-none focus:outline-none resize-none mb-4"
                  style={{ color: '#E2E8DD', fontWeight: 700, fontSize: '24px', lineHeight: '1.3' }}
                  rows={2}
                />
                
                {/* Task Metadata - Vertical Stack */}
                <div className="space-y-2">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm" style={{ backgroundColor: 'rgba(219, 76, 64, 0.15)' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#DB4C40' }} />
                      <span style={{ color: '#DB4C40', fontSize: '14px' }}>{taskData.status}</span>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div 
                    className="flex items-center gap-2 mb-3 transition-transform"
                    style={{ 
                      transform: dueDatePulse ? 'scale(1.05)' : 'scale(1)',
                      animation: dueDatePulse ? 'pulse 600ms ease-in-out' : 'none'
                    }}
                  >
                    <Clock className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.6 }} />
                    <span style={{ color: '#E2E8DD', fontSize: '14px' }}>
                      Due {taskData.dayOfWeek} {taskData.dueDate}
                    </span>
                  </div>

                  {/* Tags Row */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {taskData.stores.map(store => (
                      <span 
                        key={store}
                        className="px-2 py-1 rounded-sm"
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                          color: '#E2E8DD',
                          opacity: 0.7,
                          fontSize: '13px'
                        }}
                      >
                        {store}
                      </span>
                    ))}
                  </div>

                  {/* Priority + Assignee (One Line) */}
                  <div className="flex items-center gap-2 mb-4" style={{ fontSize: '14px' }}>
                    <span style={{ color: '#E98A15', fontWeight: 500 }}>{taskData.priority} priority</span>
                    <span style={{ color: '#E2E8DD', opacity: 0.4 }}>•</span>
                    <User className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.6 }} />
                    <span style={{ color: '#E2E8DD' }}>{taskData.assignee}</span>
                  </div>

                  {/* Project Section */}
                  {taskData.project && (
                    <div className="mb-4">
                      <p className="text-xs mb-1" style={{ color: '#E2E8DD', opacity: 0.5 }}>Project:</p>
                      <button className="w-full flex items-center gap-2 p-2 rounded-md transition-all hover:bg-white/5 justify-between">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" style={{ color: '#E98A15' }} />
                          <span className="text-sm" style={{ color: '#E2E8DD' }}>
                            {taskData.project.name}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.4 }} />
                      </button>
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)', marginTop: '16px' }} />
                </div>
              </div>

              {/* View Email Thread Button */}
              <div>
                <button 
                  onClick={() => setEmailThreadExpanded(!emailThreadExpanded)}
                  className="w-full flex items-center justify-between px-5 py-3 rounded-md transition-all duration-200 hover:bg-white/5"
                  style={{
                    backgroundColor: emailThreadExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.6 }} />
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm" style={{ color: '#E2E8DD', fontWeight: 600 }}>View Email Thread</span>
                      <span className="text-xs" style={{ color: '#E2E8DD', opacity: 0.5 }}>
                        {emailThread.length} messages
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 transition-transform duration-200" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                </button>
              </div>

              {/* Content (Combined: Attached Files + Related Content) */}
              <div 
                className="mt-3"
                onMouseEnter={handleFilesMouseEnter}
                onMouseLeave={handleFilesMouseLeave}
              >
                <button 
                  onClick={handleFilesClick}
                  className="w-full flex items-center justify-between px-5 py-3 rounded-md transition-all duration-200 hover:bg-white/5"
                  style={{
                    backgroundColor: filesPinned ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {filesExpanded ? (
                      <ChevronDown className="w-4 h-4 transition-transform duration-200" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                    ) : (
                      <ChevronRight className="w-4 h-4 transition-transform duration-200" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                    )}
                    <Link2 className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.6 }} />
                    <span className="text-sm" style={{ color: '#E2E8DD', fontWeight: 400 }}>Content</span>
                  </div>
                  {filesPinned && (
                    <Pin className="w-3 h-3" style={{ color: '#E2E8DD', opacity: 0.4 }} />
                  )}
                </button>
                
                {filesExpanded && (
                  <div className="mt-2 space-y-2 px-5 pb-3">
                    {/* Attached Files */}
                    {taskData.attachedFiles && taskData.attachedFiles.length > 0 && (
                      <>
                        <p className="text-xs mb-1" style={{ color: '#E2E8DD', opacity: 0.5 }}>Files</p>
                        {taskData.attachedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-sm hover:bg-white/5 transition-colors cursor-pointer">
                            <FileText className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs truncate" style={{ color: '#E2E8DD' }}>{file.name}</p>
                              <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.4 }}>{file.size}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    
                    {/* Related Tasks */}
                    {taskData.relatedTasks && taskData.relatedTasks.length > 0 && (
                      <>
                        <p className="text-xs mb-1 mt-3" style={{ color: '#E2E8DD', opacity: 0.5 }}>Related</p>
                        {taskData.relatedTasks.map((task, index) => (
                          <div key={index} className="p-2 rounded-sm hover:bg-white/5 transition-colors cursor-pointer">
                            <p className="text-xs" style={{ color: '#E2E8DD' }}>{task.name}</p>
                            <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.5 }}>{task.status} • {task.dueDate}</p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Timeline (Activity Timeline) */}
              <div 
                className="mt-3"
                onMouseEnter={handleActivityMouseEnter}
                onMouseLeave={handleActivityMouseLeave}
              >
                <button 
                  onClick={handleActivityClick}
                  className="w-full flex items-center justify-between px-5 py-3 rounded-md transition-all duration-200 hover:bg-white/5"
                  style={{
                    backgroundColor: activityPinned ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {activityExpanded ? (
                      <ChevronDown className="w-4 h-4 transition-transform duration-200" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                    ) : (
                      <ChevronRight className="w-4 h-4 transition-transform duration-200" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                    )}
                    <Clock className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                    <span style={{ color: '#E2E8DD', opacity: 0.6, fontSize: '13px' }}>Timeline</span>
                  </div>
                  {activityPinned && (
                    <Pin className="w-3 h-3" style={{ color: '#E2E8DD', opacity: 0.4 }} />
                  )}
                </button>
                
                {activityExpanded && (
                  <div className="mt-2 space-y-2 px-5 pb-3">
                    {taskData.activity.map((item, index) => (
                      <div key={index} className="text-xs">
                        <p style={{ color: '#E2E8DD', opacity: 0.7 }}>{item.action}</p>
                        <p style={{ color: '#E2E8DD', opacity: 0.4 }}>{item.timestamp} by {item.user}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              </div>

              {/* Quick Actions - Sticky at bottom */}
              <div 
                className="flex-shrink-0 p-6 pt-4 sticky bottom-0" 
                style={{ 
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: 'rgba(30, 30, 30, 0.7)',
                  backdropFilter: 'blur(16px) saturate(110%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(110%)',
                  borderRadius: '0 0 8px 8px',
                }}
              >
                <button 
                  onClick={handleCompleteTask}
                  className="w-full transition-all hover:opacity-90 flex items-center justify-center"
                  style={{ 
                    backgroundColor: '#5b5b42', 
                    color: '#ffffff',
                    height: '44px',
                    borderRadius: '100px',
                  }}
                >
                  Complete Task
                </button>
                <button 
                  onClick={handleSnooze}
                  className="w-full rounded-md transition-all hover:bg-white/5 flex items-center justify-center mt-3"
                  style={{ 
                    color: '#E2E8DD', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'transparent',
                    height: '44px',
                  }}
                >
                  Snooze
                </button>
                <button 
                  onClick={handleBackBurner}
                  className="w-full mt-4 text-center transition-all hover:underline"
                  style={{ 
                    color: '#E2E8DD', 
                    opacity: 0.5,
                    backgroundColor: 'transparent',
                    border: 'none',
                  }}
                >
                  Move to Back Burner
                </button>
              </div>
            </>
          )}
          </div>

          {/* Email Thread Pane - Inside Task Details Container */}
          {emailThreadExpanded && (
            <>
              {/* Vertical Divider */}
              <div 
                style={{
                  width: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  alignSelf: 'stretch',
                }}
              />

              {/* Email Thread Content */}
              <div 
                className="flex-1 flex flex-col overflow-hidden"
                style={{
                  animation: 'slideInFromRight 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Email Thread Header */}
                <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    onClick={() => setEmailThreadExpanded(false)}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all hover:bg-white/5"
                    aria-label="Close email thread"
                  >
                    <ArrowLeft className="w-5 h-5" style={{ color: '#E2E8DD' }} />
                  </button>
                  <h2 className="text-sm" style={{ color: '#E2E8DD', fontWeight: 600 }}>Email Thread</h2>
                </div>

                {/* Email Thread Messages */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {emailThread.map((email, index) => (
                      <div 
                        key={index}
                        className="rounded-md p-4 relative"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        {/* Open in Gmail button - top right */}
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={() => {
                              // Open Gmail (would need actual email ID in production)
                              window.open('https://mail.google.com', '_blank');
                            }}
                            onMouseEnter={() => setHoveredEmailIndex(index)}
                            onMouseLeave={() => setHoveredEmailIndex(null)}
                            className="w-8 h-8 rounded-md flex items-center justify-center transition-all hover:bg-white/5"
                            aria-label="Open in Gmail"
                          >
                            <ExternalLink className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                          </button>
                          {hoveredEmailIndex === index && (
                            <div 
                              className="absolute top-full right-0 mt-1 px-2 py-1 rounded-sm whitespace-nowrap text-xs pointer-events-none"
                              style={{
                                backgroundColor: 'rgba(30, 30, 30, 0.95)',
                                color: '#E2E8DD',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                              }}
                            >
                              Open in Gmail
                            </div>
                          )}
                        </div>

                        {/* Email Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                            style={{ backgroundColor: '#DB4C40', color: '#E2E8DD' }}
                          >
                            {email.fromInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm" style={{ color: '#E2E8DD', fontWeight: 500 }}>
                              {email.from}
                            </p>
                            <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.5 }}>
                              {email.timestamp}
                            </p>
                          </div>
                        </div>

                        {/* Subject (only for first message) */}
                        {email.subject && (
                          <p className="text-sm mb-2" style={{ color: '#E2E8DD', fontWeight: 600 }}>
                            {email.subject}
                          </p>
                        )}

                        {/* Email Body - Scrollable */}
                        <div 
                          className="overflow-y-auto text-sm whitespace-pre-wrap"
                          style={{ 
                            color: '#E2E8DD', 
                            opacity: 0.8,
                            maxHeight: '200px',
                            lineHeight: '1.6',
                          }}
                        >
                          {email.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Subchat Area */}
        <div 
          className="flex-1 flex flex-col rounded-lg overflow-hidden relative"
          style={{
            backgroundColor: 'rgba(22, 22, 22, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), -2px 0 8px rgba(219, 76, 64, 0.1)',
            backdropFilter: 'blur(12px) saturate(110%)',
            WebkitBackdropFilter: 'blur(12px) saturate(110%)',
          }}
        >
          {/* Subchat Header */}
          <div className="p-4 flex flex-col gap-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-all hover:bg-white/5"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" style={{ color: '#E2E8DD' }} />
                </button>
                <h2 className="text-sm flex-1 text-center" style={{ color: '#E2E8DD', fontWeight: 500 }}>{taskData.title}</h2>
                <div className="w-8" /> {/* Spacer for centering */}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              {taskData.people.map((person, index) => (
                <div 
                  key={index}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: '#DB4C40', color: '#E2E8DD' }}
                  title={person.name}
                >
                  {person.initials}
                </div>
              ))}
              <span className="text-xs" style={{ color: '#E2E8DD', opacity: 0.5 }}>• {taskData.lastActivity}</span>
            </div>
          </div>

          {/* Messages Area - with bottom padding for input overlap */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6" style={{ paddingBottom: '240px' }}>
            <div className="max-w-[800px] mx-auto">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  id={message.id}
                  message={message.text}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                  confidence={message.confidence}
                  onEdit={onEditMessage}
                  onSnoozeSelect={onSnoozeSelect}
                />
              ))}
              {isThinking && (
                <div className="flex items-start gap-3 mb-6">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ backgroundColor: 'rgba(219, 76, 64, 0.2)' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#DB4C40' }} />
                  </div>
                  <RadarTypingIndicator />
                </div>
              )}
            </div>
          </div>

          {/* Undo Banner */}
          {showUndoBanner && (
            <div 
              className="mx-4 mb-4 px-4 py-3 rounded-md flex items-center justify-between"
              style={{ backgroundColor: 'rgba(99, 105, 64, 0.3)', border: '1px solid rgba(99, 105, 64, 0.5)' }}
            >
              <span className="text-sm" style={{ color: '#E2E8DD' }}>Task {undoAction}</span>
              <button 
                onClick={handleUndo}
                className="text-sm hover:opacity-80 transition-opacity"
                style={{ color: '#E98A15' }}
              >
                ↩ Undo
              </button>
            </div>
          )}

          {/* Input Area - positioned to float over messages */}
          <div className="absolute bottom-0 left-0 right-0">
            {/* RADAR Suggestions */}
            {taskData.radarSuggestions && taskData.radarSuggestions.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-2 justify-center" style={{ marginTop: '8px' }}>
                  {taskData.radarSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage(suggestion)}
                      className="px-2 py-1.5 rounded-sm transition-all"
                      style={{
                        backgroundColor: 'rgba(22, 22, 22, 0.7)',
                        backdropFilter: 'blur(20px) saturate(120%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                        color: '#E2E8DD',
                        fontSize: '13px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(22, 22, 22, 0.85)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(22, 22, 22, 0.7)';
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 pb-4">
              <SubchatInput 
                onSendMessage={handleSendMessageWithScroll}
                taskTitle={taskData.title}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}