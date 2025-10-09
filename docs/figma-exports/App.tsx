import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { TaskSubchat } from './components/TaskSubchat';
import { ProjectSubchat } from './components/ProjectSubchat';
import { Settings } from './components/Settings';
import { LiquidGlassCanvas } from './components/LiquidGlassCanvas';
import { RadarTypingIndicator } from './components/RadarTypingIndicator';
import { ArrowDown } from 'lucide-react';

function ScrollToBottomButton({ onClick }: { onClick: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <button
      onClick={onClick}
      className="rounded-xl flex items-center justify-center transition-all duration-200 hover:opacity-80 pointer-events-auto relative overflow-hidden"
      style={{
        width: '40px',
        height: '40px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
      aria-label="Scroll to bottom"
    >
      {/* Liquid Glass Background */}
      <div ref={containerRef} className="absolute inset-0 rounded-xl overflow-hidden">
        <LiquidGlassCanvas containerRef={containerRef} />
      </div>
      
      {/* Arrow Icon */}
      <div className="relative z-10">
        <ArrowDown className="w-5 h-5" style={{ color: '#A0A0A0' }} />
      </div>
    </button>
  );
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  confidence?: number; // 0-10 confidence level for action messages
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: "Good morning, Jason! I've been monitoring your inbox and calendar. You have 3 priority items today and 2 meetings scheduled.",
    isUser: false,
    timestamp: '9:15 AM',
  },
  {
    id: '2',
    text: 'Thanks RADAR. What are the priority items?',
    isUser: true,
    timestamp: '9:16 AM',
  },
  {
    id: '3',
    text: "Here's what needs your attention:\n\n**1. Marketing Fund Reconciliation** - Steve Chen needs Q1 data by Friday\n**2. Vendor Contract Review** - Sysco contract renewal expires next week\n**3. Store 451 Performance Review** - Monthly numbers are ready for your review\n\nWould you like me to prioritize these for you?",
    isUser: false,
    timestamp: '9:16 AM',
  },
  {
    id: '4',
    text: 'Yes, start with the marketing fund issue',
    isUser: true,
    timestamp: '9:18 AM',
  },
  {
    id: '5',
    text: "Hey Jason — just caught this from Steve Chen (Wingstop Corporate):\n\n**Q1 2025 Marketing Fund Reconciliation Due**\n\nLooks like he needs the marketing fund receipts and spend breakdown by Friday, October 4th. He mentioned specifically wanting Store 326, 451, and 895 data.\n[Submit Q1 marketing reconciliation\nDue: Oct 4 • Stores: 326, 451, 895]",
    isUser: false,
    timestamp: '9:18 AM',
    confidence: 8,
  },
  {
    id: '6',
    text: 'Got it. Can you pull the receipts from those stores for Q1?',
    isUser: true,
    timestamp: '9:20 AM',
  },
  {
    id: '7',
    text: "I've found 47 marketing-related receipts across those three stores from January-March 2025. Total spend is $23,847. I'm compiling them now with expense categorization.\n\nI noticed Store 451 has some uncategorized expenses - would you like me to flag those for manual review?",
    isUser: false,
    timestamp: '9:21 AM',
  },
  {
    id: '8',
    text: 'Yes, flag anything uncategorized',
    isUser: true,
    timestamp: '9:21 AM',
  },
  {
    id: '9',
    text: "Perfect. Also, I spotted an email from Marcus Williams (Regional Manager) that came in 30 minutes ago:\n\n**Store 895 Equipment Issue**\n\nHe's reporting a walk-in freezer malfunction at Store 895. Temperature is rising and they need immediate service authorization.\n[Approve emergency equipment repair\nStore: 895 • Vendor: CoolTech Services • Est: $1,200]",
    isUser: false,
    timestamp: '9:23 AM',
    confidence: 9,
  },
  {
    id: '10',
    text: 'That needs to be handled right away. Approve it and let Marcus know.',
    isUser: true,
    timestamp: '9:24 AM',
  },
  {
    id: '11',
    text: "Done. I've sent approval to CoolTech Services and notified Marcus. They're dispatching a technician within 2 hours.\n\nI also added this to your operations log and flagged it for the monthly incident report.",
    isUser: false,
    timestamp: '9:24 AM',
  },
  {
    id: '12',
    text: 'Great work. What about that vendor contract you mentioned?',
    isUser: true,
    timestamp: '9:26 AM',
  },
  {
    id: '13',
    text: "Your Sysco Foods contract expires October 10th. I pulled your current terms:\n\n• Monthly volume: ~$85K across all stores\n• Current discount: 12%\n• Delivery schedule: 3x weekly\n\nI found a competitor offer from US Foods with 15% discount for similar volume. Would you like me to set up a renewal negotiation call with your Sysco rep?",
    isUser: false,
    timestamp: '9:27 AM',
  },
  {
    id: '14',
    text: 'Yes, schedule that for this week if possible',
    isUser: true,
    timestamp: '9:28 AM',
  },
  {
    id: '15',
    text: "I'm checking Sarah Mitchell's (Sysco Account Manager) calendar now...\n\n**Vendor Contract Renewal Meeting**\n\nI found an opening Thursday, October 3rd at 2:00 PM. Does that work for you?\n[Schedule Sysco contract renewal call\nThursday, Oct 3 • 2:00 PM • 45 min]",
    isUser: false,
    timestamp: '9:29 AM',
    confidence: 7,
  },
  {
    id: '16',
    text: 'Perfect, book it',
    isUser: true,
    timestamp: '9:30 AM',
  },
  {
    id: '17',
    text: "Meeting confirmed and added to your calendar. I've also prepared a negotiation brief with:\n\n• Current contract terms\n• Market comparison data\n• Your volume trends (up 8% YoY)\n• Recommended counter-offer points\n\nI'll send it to you an hour before the meeting.",
    isUser: false,
    timestamp: '9:30 AM',
  },
  {
    id: '18',
    text: 'You mentioned Store 451 performance review earlier?',
    isUser: true,
    timestamp: '9:32 AM',
  },
  {
    id: '19',
    text: "Yes! Store 451's September numbers just came in. Quick summary:\n\n• Revenue: $147,320 (↑ 6% vs August)\n• Labor cost: 28.3% (target: 30%)\n• Food cost: 31.2% (slightly above 30% target)\n• Customer satisfaction: 4.6/5.0\n\nOverall strong performance, but I noticed food waste increased by 2.1%. Manager is Lisa Chen - might be worth a check-in on inventory practices.",
    isUser: false,
    timestamp: '9:33 AM',
  },
  {
    id: '20',
    text: 'Add a task to review inventory with Lisa next week',
    isUser: true,
    timestamp: '9:34 AM',
  },
  {
    id: '21',
    text: "Task created! I've scheduled it for Tuesday, October 8th. I'll also pull the detailed waste reports before your meeting.\n\nBy the way, you have a team check-in call in 25 minutes. Should I prepare anything specific?",
    isUser: false,
    timestamp: '9:35 AM',
  },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth / 3 : 400
  );
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isCatchingUp, setIsCatchingUp] = useState(false);
  const [subchatConversations, setSubchatConversations] = useState<Record<string, Message[]>>({
    '5': [] // Initialize empty conversation for task 5
  });
  const [projectConversations, setProjectConversations] = useState<Record<string, Message[]>>({
    '1': [] // Initialize empty conversation for project 1
  });
  const [isResizing, setIsResizing] = useState(false);
  const [showResizeIndicator, setShowResizeIndicator] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Mock task data for the subchat
  const mockTaskData = {
    id: '5',
    title: 'Submit Q1 marketing reconciliation',
    status: 'Action needed',
    dueDate: 'Oct 4',
    dayOfWeek: 'Friday',
    description: 'Compile and submit marketing fund receipts and spend breakdown for Q1 2025. Steve Chen from Wingstop Corporate needs data for stores 326, 451, and 895 by Friday.',
    stores: ['326', '451', '895'],
    priority: 'High',
    assignee: 'Jason Miller',
    project: { name: 'Q1 Financial Close', emoji: '📊' },
    people: [
      { name: 'Steve Chen', initials: 'SC' },
      { name: 'Jason Miller', initials: 'JM' },
    ],
    lastActivity: 'Updated 2h ago',
    originalEmail: {
      from: 'Steve Chen',
      fromInitials: 'SC',
      timestamp: 'Oct 2, 9:18 AM',
      subject: 'Q1 2025 Marketing Fund Reconciliation Due',
      preview: 'Hi Jason, we need the marketing fund receipts and spend breakdown by Friday, October 4th. Please include data for Store 326, 451, and 895...',
    },
    attachedFiles: [
      { name: 'Q1_Guidelines.pdf', type: 'PDF', size: '2.3 MB' },
      { name: 'Template.xlsx', type: 'XLSX', size: '156 KB' },
    ],
    relatedTasks: [
      { name: 'Q2 Marketing Fund Reconciliation', status: 'Upcoming', dueDate: 'Jan 4' },
      { name: 'Review marketing ROI', status: 'In Progress', dueDate: 'Oct 10' },
    ],
    activity: [
      { action: 'Created task', timestamp: 'Oct 2, 9:18 AM', user: 'RADAR' },
      { action: 'Updated priority', timestamp: '2h ago', user: 'RADAR' },
      { action: 'Last message', timestamp: '1h ago', user: 'Jason Miller' },
    ],
    radarSuggestions: [
      'Pull the latest P&L for these stores',
      'Draft the reconciliation report',
      'Show me marketing expenses from Q1',
    ],
  };

  // Mock project data for the subchat
  const mockProjectData = {
    id: '1',
    name: 'Q1 Financial Close',
    status: 'In Progress' as const,
    description: 'Marketing fund reconciliation initiative for Q1 2025 across stores 326, 451, and 895. Includes expense categorization, receipt compilation, and corporate reporting to Wingstop headquarters.',
    progress: 42,
    tasksComplete: 5,
    tasksTotal: 12,
    startDate: 'Oct 1',
    dueDate: 'Nov 15',
    owner: { name: 'Jason Miller', initials: 'JM' },
    members: [
      { name: 'Sarah Mitchell', initials: 'SM' },
      { name: 'Steve Chen', initials: 'SC' },
      { name: 'Lisa Chen', initials: 'LC' },
      { name: 'Marcus Williams', initials: 'MW' },
    ],
    tasks: {
      actionNeeded: [
        { id: '5', title: 'Submit Q1 marketing reconciliation', dueDate: 'Oct 4' },
        { id: 't2', title: 'Review categorized expenses', dueDate: 'Oct 5' },
        { id: 't3', title: 'Approve vendor invoices', dueDate: 'Oct 6' },
      ],
      waiting: [
        { id: 't4', title: 'Store 451 expense report', dueDate: 'Oct 8' },
        { id: 't5', title: 'Corporate approval confirmation', dueDate: 'Oct 10' },
      ],
      inProgress: [
        { id: 't6', title: 'Compile Q1 receipts', dueDate: 'Oct 7' },
        { id: 't7', title: 'Generate financial summary', dueDate: 'Oct 9' },
      ],
      complete: [
        { id: 't8', title: 'Initial data collection', dueDate: 'Oct 1' },
        { id: 't9', title: 'Store 326 reconciliation', dueDate: 'Oct 2' },
        { id: 't10', title: 'Store 895 reconciliation', dueDate: 'Oct 2' },
        { id: 't11', title: 'Budget variance analysis', dueDate: 'Oct 3' },
        { id: 't12', title: 'Expense categorization setup', dueDate: 'Oct 1' },
      ],
    },
    milestones: [
      { title: 'All store data collected', date: 'Oct 7', completed: true },
      { title: 'Corporate submission ready', date: 'Oct 10', completed: false },
      { title: 'Final approval received', date: 'Nov 15', completed: false },
    ],
    activity: [
      { action: 'Created project', timestamp: 'Oct 1, 9:00 AM', user: 'RADAR' },
      { action: 'Added 5 tasks', timestamp: 'Oct 1, 9:15 AM', user: 'RADAR' },
      { action: 'Completed Store 326 reconciliation', timestamp: 'Oct 2, 2:30 PM', user: 'Jason Miller' },
      { action: 'Updated progress to 42%', timestamp: '2h ago', user: 'RADAR' },
    ],
    radarSuggestions: [
      'Show all overdue tasks',
      'Generate a progress report',
      'What are the blockers',
    ],
  };

  // Get subchat messages for the active task
  const subchatMessages = activeTaskId ? (subchatConversations[activeTaskId] || []) : [];
  const projectMessages = activeProjectId ? (projectConversations[activeProjectId] || []) : [];

  const handleSendMessage = (text: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp,
    };

    setMessages((prev) => [...prev, newUserMessage]);

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

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI response with 3 second delay
    setTimeout(() => {
      setIsTyping(false);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I've received your message and I'm processing it. This is a demo response to show how the chat interface works.",
        isUser: false,
        timestamp,
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 3000);
  };

  const handleEditMessage = (id: string, newText: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, text: newText } : msg))
    );
  };

  const handleTaskClick = (taskId: string) => {
    setActiveTaskId(taskId);
  };

  const handleCloseSubchat = () => {
    setActiveTaskId(null);
  };

  const handleProjectClick = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveTaskId(null); // Close task subchat if open
  };

  const handleCloseProjectSubchat = () => {
    setActiveProjectId(null);
  };

  const handleSubchatSendMessage = (text: string) => {
    if (!activeTaskId) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp,
    };

    // Add to subchat-specific conversation
    setSubchatConversations((prev) => ({
      ...prev,
      [activeTaskId]: [...(prev[activeTaskId] || []), newUserMessage]
    }));

    // Simulate AI response for subchat with smart context and 3 second delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I've pulled the marketing receipts for stores 326, 451, and 895 from Q1. Total spend: $23,847. I can draft the reconciliation report now if you'd like.\n\nNext steps I suggest:\n1. Review categorized expenses (I found 3 uncategorized)\n2. Generate final report\n3. Email to Steve Chen with deadline reminder\n\nWhat would you like me to do first?",
        isUser: false,
        timestamp,
      };
      setSubchatConversations((prev) => ({
        ...prev,
        [activeTaskId]: [...(prev[activeTaskId] || []), aiResponse]
      }));
    }, 3000);
  };

  const handleSubchatRadarMessage = (text: string, confidence?: number) => {
    if (!activeTaskId) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    const radarMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: false,
      timestamp,
      confidence,
    };

    // Add RADAR message to subchat-specific conversation
    setSubchatConversations((prev) => ({
      ...prev,
      [activeTaskId]: [...(prev[activeTaskId] || []), radarMessage]
    }));
  };

  const handleSnoozeSelect = (timeframe: string) => {
    if (!activeTaskId) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    const timeframeLabels: Record<string, string> = {
      'custom': 'a custom time',
      'later-today': 'later today at 5:00 PM',
      'tomorrow': 'tomorrow at 9:00 AM',
      'next-week': 'next Monday at 9:00 AM',
    };

    const radarResponse: Message = {
      id: Date.now().toString(),
      text: `Got it. I'll ping you about this ${timeframeLabels[timeframe]}. Setting reminder now...`,
      isUser: false,
      timestamp,
    };

    setSubchatConversations((prev) => ({
      ...prev,
      [activeTaskId]: [...(prev[activeTaskId] || []), radarResponse]
    }));
  };

  const handleProjectSendMessage = (text: string) => {
    if (!activeProjectId) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp,
    };

    setProjectConversations((prev) => ({
      ...prev,
      [activeProjectId]: [...(prev[activeProjectId] || []), newUserMessage]
    }));

    // Simulate AI response with 3 second delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm analyzing the project status. Currently, you have 3 tasks that need action, and 2 tasks are waiting on others. The project is 42% complete with a target completion date of November 15th. Would you like me to provide more details on any specific area?",
        isUser: false,
        timestamp,
      };
      setProjectConversations((prev) => ({
        ...prev,
        [activeProjectId]: [...(prev[activeProjectId] || []), aiResponse]
      }));
    }, 3000);
  };

  const handleProjectRadarMessage = (text: string, confidence?: number) => {
    if (!activeProjectId) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    const radarMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: false,
      timestamp,
      confidence,
    };

    setProjectConversations((prev) => ({
      ...prev,
      [activeProjectId]: [...(prev[activeProjectId] || []), radarMessage]
    }));
  };

  const handleCatchMeUp = () => {
    setIsCatchingUp(true);

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    // Simulate RADAR composing a contextual overview
    setTimeout(() => {
      const overviewMessage: Message = {
        id: Date.now().toString(),
        text: "Here's your current status:\n\n**Priority Items Today:**\n• Marketing Fund Reconciliation (Due Oct 4) - Ready to submit\n• Sysco Contract Renewal Meeting (Tomorrow 2:00 PM) - Brief prepared\n• Store 895 Equipment Repair - Approved, technician dispatched\n\n**Recent Activity:**\n• 3 tasks completed today\n• 2 new emails require response\n• 1 urgent issue resolved (freezer malfunction)\n\n**Upcoming:**\n• Store 451 inventory review scheduled for Oct 8\n• Q1 financial data compilation in progress\n\nAnything specific you'd like me to dive into?",
        isUser: false,
        timestamp,
      };
      
      setMessages((prev) => [...prev, overviewMessage]);
      setIsCatchingUp(false);
    }, 2000);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  // Check if user is at bottom of messages
  const checkScrollPosition = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
  };

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Handle resize with useEffect
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarCollapsed) {
        const newWidth = e.clientX; // No padding to subtract
        if (newWidth >= 240 && newWidth <= 400) {
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setShowResizeIndicator(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarCollapsed]);

  // Add scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', checkScrollPosition);
    // Check initial position
    checkScrollPosition();

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Only auto-scroll if user is already near the bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    if (isNearBottom) {
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);
    }
  }, [messages]);

  // Show settings page if enabled
  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden dark" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="h-full flex">
        {/* Sidebar Container */}
        <div
          style={{
            width: sidebarCollapsed ? '60px' : `${sidebarWidth}px`,
            transition: isResizing ? 'none' : 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: activeTaskId || activeProjectId ? 0.2 : 1,
            pointerEvents: activeTaskId || activeProjectId ? 'none' : 'auto',
          }}
        >
          <Sidebar 
            isCollapsed={sidebarCollapsed} 
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onOpenSettings={() => setShowSettings(true)}
            onProjectClick={handleProjectClick}
            onTaskClick={handleTaskClick}
          />
        </div>

        {/* Resize Handle - Invisible overlay at sidebar edge */}
        {!sidebarCollapsed && (
          <div
            className="absolute"
            style={{ 
              left: `${sidebarWidth - 4}px`,
              top: 0,
              bottom: 0,
              width: '8px',
              cursor: 'col-resize',
              zIndex: 10,
              opacity: activeTaskId || activeProjectId ? 0.2 : 1,
              pointerEvents: activeTaskId || activeProjectId ? 'none' : 'auto',
            }}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setShowResizeIndicator(true)}
            onMouseLeave={() => !isResizing && setShowResizeIndicator(false)}
          >
            {(showResizeIndicator || isResizing) && (
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: '2px',
                  height: '150px',
                  backgroundColor: 'rgba(226, 232, 221, 0.3)',
                  borderRadius: '1px',
                  transition: 'opacity 150ms',
                }}
              />
            )}
          </div>
        )}
        
        {/* Main Chat Container */}
        <div 
          className="flex-1 flex flex-col overflow-hidden relative"
          style={{ 
            backgroundColor: '#161616',
            transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            transform: activeTaskId || activeProjectId ? 'translateX(-60px)' : 'translateX(0)',
            opacity: activeTaskId || activeProjectId ? 0.2 : 1,
          }}
        >
          {/* Messages area - with bottom padding for input overlap */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-12 py-6" 
            style={{ paddingBottom: '180px' }}
          >
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                id={message.id}
                message={message.text}
                isUser={message.isUser}
                timestamp={message.timestamp}
                confidence={message.confidence}
                onEdit={handleEditMessage}
                onTaskClick={handleTaskClick}
              />
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
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

          {/* Scroll to bottom button */}
          {showScrollToBottom && (
            <div 
              className="absolute left-0 right-0 flex justify-center pointer-events-none"
              style={{ 
                bottom: '192px', // Input area height (~180px) + 12px gap
                zIndex: 10 
              }}
            >
              <ScrollToBottomButton onClick={scrollToBottom} />
            </div>
          )}

          {/* Input area - positioned to float over messages */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              onCatchMeUp={handleCatchMeUp}
              isCatchingUp={isCatchingUp}
            />
          </div>
        </div>
      </div>

      {/* Task Subchat */}
      <TaskSubchat
        isOpen={!!activeTaskId && !activeProjectId}
        onClose={handleCloseSubchat}
        taskData={mockTaskData}
        messages={subchatMessages}
        onSendMessage={handleSubchatSendMessage}
        onRadarMessage={handleSubchatRadarMessage}
        onEditMessage={handleEditMessage}
        onSnoozeSelect={handleSnoozeSelect}
      />

      {/* Project Subchat */}
      <ProjectSubchat
        isOpen={!!activeProjectId}
        onClose={handleCloseProjectSubchat}
        projectData={mockProjectData}
        messages={projectMessages}
        onSendMessage={handleProjectSendMessage}
        onRadarMessage={handleProjectRadarMessage}
        onEditMessage={handleEditMessage}
        onTaskClick={handleTaskClick}
      />
    </div>
  );
}