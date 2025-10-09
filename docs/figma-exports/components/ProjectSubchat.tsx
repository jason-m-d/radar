import { X, ArrowLeft, FolderOpen, Clock, User, ChevronRight, ChevronDown, Lightbulb, Link2, CheckCircle2, Circle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { SubchatInput } from './SubchatInput';
import { RadarTypingIndicator } from './RadarTypingIndicator';

interface ProjectData {
  id: string;
  name: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Complete';
  description: string;
  progress: number; // 0-100
  tasksComplete: number;
  tasksTotal: number;
  startDate: string;
  dueDate?: string;
  owner: { name: string; initials: string };
  members?: Array<{ name: string; initials: string }>;
  tasks: {
    actionNeeded: Array<{ id: string; title: string; dueDate: string }>;
    waiting: Array<{ id: string; title: string; dueDate: string }>;
    inProgress: Array<{ id: string; title: string; dueDate: string }>;
    complete: Array<{ id: string; title: string; dueDate: string }>;
  };
  milestones?: Array<{ title: string; date: string; completed: boolean }>;
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

interface ProjectSubchatProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: ProjectData;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onRadarMessage: (text: string, confidence?: number) => void;
  onEditMessage: (id: string, newText: string) => void;
  onTaskClick?: (taskId: string) => void;
}

export function ProjectSubchat({ isOpen, onClose, projectData, messages, onSendMessage, onRadarMessage, onEditMessage, onTaskClick }: ProjectSubchatProps) {
  const [isPaneCollapsed, setIsPaneCollapsed] = useState(false);
  const [actionNeededExpanded, setActionNeededExpanded] = useState(false);
  const [waitingExpanded, setWaitingExpanded] = useState(false);
  const [inProgressExpanded, setInProgressExpanded] = useState(false);
  const [completeExpanded, setCompleteExpanded] = useState(false);
  const [milestonesExpanded, setMilestonesExpanded] = useState(false);
  const [relatedExpanded, setRelatedExpanded] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);
  const [playersExpanded, setPlayersExpanded] = useState(false);
  
  const [actionNeededPinned, setActionNeededPinned] = useState(false);
  const [waitingPinned, setWaitingPinned] = useState(false);
  const [inProgressPinned, setInProgressPinned] = useState(false);
  const [completePinned, setCompletePinned] = useState(false);
  
  const [taskFilter, setTaskFilter] = useState<'all' | 'action' | 'waiting'>('all');
  const [isThinking, setIsThinking] = useState(false);

  // Filter tasks based on selected filter with category tracking
  const filteredTasks = (() => {
    if (taskFilter === 'action') {
      return projectData.tasks.actionNeeded.map(task => ({ ...task, category: 'action' as const }));
    } else if (taskFilter === 'waiting') {
      return projectData.tasks.waiting.map(task => ({ ...task, category: 'waiting' as const }));
    } else {
      // Show all non-complete tasks with their categories
      return [
        ...projectData.tasks.actionNeeded.map(task => ({ ...task, category: 'action' as const })),
        ...projectData.tasks.waiting.map(task => ({ ...task, category: 'waiting' as const })),
        ...projectData.tasks.inProgress.map(task => ({ ...task, category: 'inProgress' as const })),
      ];
    }
  })();

  const actionNeededHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const actionNeededCloseTimeout = useRef<NodeJS.Timeout | null>(null);
  const waitingHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const waitingCloseTimeout = useRef<NodeJS.Timeout | null>(null);
  const inProgressHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const inProgressCloseTimeout = useRef<NodeJS.Timeout | null>(null);
  const completeHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const completeCloseTimeout = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Hover handlers for task groups
  const createHoverHandlers = (
    isPinned: boolean,
    setExpanded: (val: boolean) => void,
    hoverTimeout: React.MutableRefObject<NodeJS.Timeout | null>,
    closeTimeout: React.MutableRefObject<NodeJS.Timeout | null>
  ) => ({
    onMouseEnter: () => {
      if (isPinned) return;
      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current);
        closeTimeout.current = null;
      }
      hoverTimeout.current = setTimeout(() => {
        setExpanded(true);
      }, 200);
    },
    onMouseLeave: () => {
      if (isPinned) return;
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
      closeTimeout.current = setTimeout(() => {
        setExpanded(false);
      }, 300);
    },
  });

  const handleMarkComplete = () => {
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      onRadarMessage(`Great work completing this project! I'll archive the project details and store them for future reference. All ${projectData.tasksTotal} tasks have been marked as complete.`);
    }, 800);
  };

  const handleArchive = () => {
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      onRadarMessage("Project archived. I'll keep it accessible in your archive for the next 90 days if you need to reference it.");
    }, 600);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planning': return { bg: 'rgba(233, 138, 21, 0.15)', text: '#E98A15' };
      case 'In Progress': return { bg: 'rgba(66, 91, 72, 0.2)', text: '#7ba885' };
      case 'On Hold': return { bg: 'rgba(180, 60, 60, 0.15)', text: '#D89090' };
      case 'Complete': return { bg: 'rgba(99, 105, 64, 0.2)', text: '#a3aa7a' };
      default: return { bg: 'rgba(255, 255, 255, 0.1)', text: '#E2E8DD' };
    }
  };

  const statusColor = getStatusColor(projectData.status);

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
        {/* Project Details Pane */}
        <div 
          className="flex-shrink-0 rounded-lg mr-2 transition-all duration-200 flex flex-col"
          style={{
            width: isPaneCollapsed ? '48px' : '320px',
            backgroundColor: 'rgba(30, 30, 30, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px) saturate(105%)',
            WebkitBackdropFilter: 'blur(8px) saturate(105%)',
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
              {/* Project Info Section */}
              <div>
                {/* Project Title */}
                <h2 className="mb-2" style={{ color: '#E2E8DD', fontWeight: 700, fontSize: '24px', lineHeight: '1.3' }}>
                  {projectData.name}
                </h2>
                
                {/* Status Badge */}
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm" style={{ backgroundColor: statusColor.bg }}>
                    <span style={{ color: statusColor.text, fontSize: '14px' }}>{projectData.status}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm mb-4" style={{ color: '#E2E8DD', opacity: 0.8, lineHeight: '1.6' }}>
                  {projectData.description}
                </p>

                {/* Progress Indicator */}
                <div className="mb-5">
                  {/* Horizontal progress bar */}
                  <div className="relative mb-2">
                    <div 
                      className="w-full rounded-full overflow-hidden"
                      style={{ 
                        height: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div 
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${projectData.progress}%`,
                          background: `linear-gradient(90deg, #5b4842 0%, #425b48 100%)`,
                          boxShadow: projectData.progress > 0 ? '0 0 10px rgba(66, 91, 72, 0.3)' : 'none',
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#E2E8DD', fontWeight: 700, fontSize: '24px' }}>
                      {projectData.progress}%
                    </span>
                    <span className="text-xs" style={{ color: '#E2E8DD', opacity: 0.6 }}>
                      {projectData.tasksComplete} of {projectData.tasksTotal} tasks complete
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-2 mb-3" style={{ fontSize: '14px' }}>
                  <Clock className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.6 }} />
                  <span style={{ color: '#E2E8DD' }}>
                    Started {projectData.startDate}
                    {projectData.dueDate && ` • Due ${projectData.dueDate}`}
                  </span>
                </div>

                {/* Team Section */}
                <div className="mb-4">
                  <button
                    onClick={() => setPlayersExpanded(!playersExpanded)}
                    className="w-full flex items-center justify-between p-2 rounded-md transition-all hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      {playersExpanded ? (
                        <ChevronDown className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                      ) : (
                        <ChevronRight className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                      )}
                      <span className="text-sm" style={{ color: '#E2E8DD', fontWeight: 500 }}>
                        Players ({1 + (projectData.members?.length || 0)})
                      </span>
                    </div>
                  </button>
                  {playersExpanded && (
                    <div className="mt-2 space-y-2 px-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ backgroundColor: '#DB4C40', color: '#E2E8DD' }}
                        >
                          {projectData.owner.initials}
                        </div>
                        <span className="text-sm" style={{ color: '#E2E8DD' }}>
                          {projectData.owner.name} <span style={{ opacity: 0.6 }}>(Owner)</span>
                        </span>
                      </div>
                      {projectData.members && projectData.members.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            style={{ backgroundColor: '#636940', color: '#E2E8DD' }}
                          >
                            {member.initials}
                          </div>
                          <span className="text-sm" style={{ color: '#E2E8DD', opacity: 0.8 }}>
                            {member.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)', marginBottom: '16px' }} />
              </div>

              {/* Task Breakdown */}
              <div>
                {/* Header with title and filter buttons */}
                <div className="mb-3">
                  <p className="text-sm mb-2" style={{ color: '#E2E8DD', fontWeight: 600 }}>
                    Tasks ({projectData.tasksTotal})
                  </p>
                  
                  {/* Filter buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTaskFilter('all')}
                      className="px-2 py-1 rounded-sm text-xs transition-all duration-200"
                      style={{
                        backgroundColor: taskFilter === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        color: '#E2E8DD',
                        opacity: taskFilter === 'all' ? 1 : 0.5,
                      }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setTaskFilter('action')}
                      className="px-2 py-1 rounded-sm text-xs transition-all duration-200"
                      style={{
                        backgroundColor: taskFilter === 'action' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        color: '#E2E8DD',
                        opacity: taskFilter === 'action' ? 1 : 0.5,
                      }}
                    >
                      Action Needed
                    </button>
                    <button
                      onClick={() => setTaskFilter('waiting')}
                      className="px-2 py-1 rounded-sm text-xs transition-all duration-200"
                      style={{
                        backgroundColor: taskFilter === 'waiting' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        color: '#E2E8DD',
                        opacity: taskFilter === 'waiting' ? 1 : 0.5,
                      }}
                    >
                      Waiting
                    </button>
                  </div>
                </div>

                {/* Scrollable tasks list */}
                <div className="overflow-y-auto space-y-1 mb-4" style={{ maxHeight: '300px' }}>
                  {filteredTasks.map((task) => {
                    // Determine circle color based on task category
                    const circleColor = task.category === 'action' 
                      ? '#DB4C40' // Red for action needed
                      : task.category === 'waiting'
                      ? '#6b9bd1' // Blue for waiting
                      : '#E98A15'; // Orange for in progress
                    
                    return (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick?.(task.id)}
                        className="w-full rounded-md transition-all duration-200 cursor-pointer p-2 hover:bg-white/5 text-left"
                      >
                        <div className="flex items-start gap-2">
                          <Circle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: circleColor }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs break-words" style={{ color: '#E2E8DD' }}>
                              {task.title}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: '#E2E8DD', opacity: 0.4 }}>
                              {task.dueDate}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  
                  {filteredTasks.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: '#E2E8DD', opacity: 0.4 }}>
                      No tasks
                    </p>
                  )}
                </div>
              </div>

              {/* Milestones */}
              {projectData.milestones && projectData.milestones.length > 0 && (
                <div>
                  <button
                    onClick={() => setMilestonesExpanded(!milestonesExpanded)}
                    className="w-full flex items-center justify-between p-2 rounded-md transition-all hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      {milestonesExpanded ? (
                        <ChevronDown className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                      ) : (
                        <ChevronRight className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                      )}
                      <span className="text-sm" style={{ color: '#E2E8DD', fontWeight: 500 }}>
                        Milestones ({projectData.milestones.length})
                      </span>
                    </div>
                  </button>
                  {milestonesExpanded && (
                    <div className="mt-2 space-y-2 px-2">
                      {projectData.milestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {milestone.completed ? (
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#636940' }} />
                          ) : (
                            <Circle className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.4 }} />
                          )}
                          <div className="flex-1">
                            <p 
                              className="text-xs" 
                              style={{ 
                                color: '#E2E8DD', 
                                opacity: milestone.completed ? 0.5 : 1,
                                textDecoration: milestone.completed ? 'line-through' : 'none',
                              }}
                            >
                              {milestone.title}
                            </p>
                            <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.4 }}>
                              {milestone.date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

              {/* Content and Timeline - grouped with tighter spacing */}
              <div className="space-y-2">
                {/* Related Content */}
                <div>
                  <button
                    onClick={() => setRelatedExpanded(!relatedExpanded)}
                    className="w-full flex items-center justify-between p-2 rounded-md transition-all hover:bg-white/5 font-normal"
                  >
                    <div className="flex items-center gap-2">
                      {relatedExpanded ? (
                        <ChevronDown className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                      ) : (
                        <ChevronRight className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                      )}
                      <Link2 className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.6 }} />
                      <span className="text-sm" style={{ color: '#E2E8DD', fontWeight: 400 }}>Content</span>
                    </div>
                  </button>
                </div>

                {/* Activity Timeline */}
                <div>
                  <button
                    onClick={() => setActivityExpanded(!activityExpanded)}
                    className="w-full flex items-center justify-between p-2 rounded-md transition-all hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      {activityExpanded ? (
                        <ChevronDown className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                      ) : (
                        <ChevronRight className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                      )}
                      <Clock className="w-4 h-4" style={{ color: '#E2E8DD', opacity: 0.5 }} />
                      <span style={{ color: '#E2E8DD', opacity: 0.6, fontSize: '13px' }}>Timeline</span>
                    </div>
                  </button>
                  {activityExpanded && (
                    <div className="mt-2 space-y-2 px-2">
                      {projectData.activity.map((item, index) => (
                        <div key={index} className="text-xs">
                          <p style={{ color: '#E2E8DD', opacity: 0.7 }}>{item.action}</p>
                          <p style={{ color: '#E2E8DD', opacity: 0.4 }}>{item.timestamp} by {item.user}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              </div>

              {/* Action Buttons - Sticky at bottom */}
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
                {projectData.status === 'Complete' ? (
                  <button
                    onClick={handleMarkComplete}
                    className="w-full rounded-md transition-all hover:bg-white/5 flex items-center justify-center"
                    style={{
                      color: '#E2E8DD',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backgroundColor: 'transparent',
                      height: '44px',
                    }}
                  >
                    Reopen Project
                  </button>
                ) : (
                  <button
                    onClick={handleMarkComplete}
                    className="w-full rounded-md transition-all hover:opacity-90 flex items-center justify-center"
                    style={{
                      backgroundColor: '#5b5b42',
                      color: '#ffffff',
                      height: '44px',
                    }}
                  >
                    Mark Complete
                  </button>
                )}
                <button
                  onClick={handleArchive}
                  className="w-full mt-4 text-center transition-all hover:underline"
                  style={{
                    color: '#E2E8DD',
                    opacity: 0.5,
                    backgroundColor: 'transparent',
                    border: 'none',
                  }}
                >
                  Archive Project
                </button>
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
                <h2 className="text-sm flex-1 text-center" style={{ color: '#E2E8DD', fontWeight: 500 }}>
                  {projectData.name}
                </h2>

              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <FolderOpen className="w-4 h-4" style={{ color: '#E98A15' }} />
              <span className="text-xs" style={{ color: '#E2E8DD', opacity: 0.5 }}>
                {projectData.tasksComplete}/{projectData.tasksTotal} tasks • {projectData.status}
              </span>
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

          {/* Input Area - positioned to float over messages */}
          <div className="absolute bottom-0 left-0 right-0">
            {/* RADAR Suggestions */}
            {projectData.radarSuggestions && projectData.radarSuggestions.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-2 justify-center">
                  {projectData.radarSuggestions.map((suggestion, index) => (
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
                taskTitle={projectData.name}
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
      `}</style>
    </>
  );
}
