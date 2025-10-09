import { useState } from 'react';
import { ChevronLeft, ChevronRight, Circle, CheckCircle2, Folder, ArrowUpDown, Settings, User, Undo2, Filter, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: number;
  dueDateSort: number;
  waitingOn?: 'me' | string;
  lastActivity: string;
  category: string;
  daysUntilDeletion?: number;
}

interface Project {
  id: string;
  name: string;
  taskCount: number;
  lastActivity: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Submit Q1 marketing reconciliation',
    dueDate: 'Oct 4',
    dueDateSort: 4,
    completed: false,
    priority: 9,
    waitingOn: 'me',
    lastActivity: 'Updated 2h ago',
    category: 'Finance',
  },
  {
    id: '2',
    title: 'Review vendor contracts for Q2',
    dueDate: 'Oct 8',
    dueDateSort: 8,
    completed: false,
    priority: 7,
    waitingOn: 'Sarah Mitchell',
    lastActivity: 'Updated 1d ago',
    category: 'Operations',
  },
  {
    id: '3',
    title: 'Update inventory system',
    dueDate: 'Oct 12',
    dueDateSort: 12,
    completed: true,
    priority: 5,
    lastActivity: 'Completed 3h ago',
    category: 'Technology',
  },
  {
    id: '4',
    title: 'Schedule team performance reviews',
    dueDate: 'Oct 15',
    dueDateSort: 15,
    completed: false,
    priority: 6,
    waitingOn: 'me',
    lastActivity: 'Updated 5h ago',
    category: 'HR',
  },
  {
    id: '5',
    title: 'Prepare monthly sales report',
    dueDate: 'Oct 20',
    dueDateSort: 20,
    completed: false,
    priority: 8,
    waitingOn: 'Lisa Chen',
    lastActivity: 'Updated 30m ago',
    category: 'Finance',
  },
];

const mockBackBurnerTasks: Task[] = [
  {
    id: 'bb1',
    title: 'Research new POS systems',
    dueDate: 'Oct 25',
    dueDateSort: 25,
    completed: false,
    priority: 4,
    lastActivity: 'Back burnered 2d ago',
    category: 'Technology',
    daysUntilDeletion: 38,
  },
  {
    id: 'bb2',
    title: 'Update employee handbook',
    dueDate: 'Nov 1',
    dueDateSort: 32,
    completed: false,
    priority: 3,
    lastActivity: 'Back burnered 1w ago',
    category: 'HR',
    daysUntilDeletion: 33,
  },
  {
    id: 'bb3',
    title: 'Plan Q4 team building event',
    dueDate: 'Nov 15',
    dueDateSort: 46,
    completed: false,
    priority: 2,
    lastActivity: 'Back burnered 3d ago',
    category: 'HR',
    daysUntilDeletion: 37,
  },
  {
    id: 'bb4',
    title: 'Review insurance policies',
    dueDate: 'Dec 1',
    dueDateSort: 62,
    completed: false,
    priority: 5,
    lastActivity: 'Back burnered 5d ago',
    category: 'Operations',
    daysUntilDeletion: 35,
  },
  {
    id: 'bb5',
    title: 'Explore franchise opportunities',
    dueDate: 'Dec 15',
    dueDateSort: 76,
    completed: false,
    priority: 6,
    lastActivity: 'Back burnered 1d ago',
    category: 'Strategy',
    daysUntilDeletion: 39,
  },
];

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Store Expansion 2025',
    taskCount: 8,
    lastActivity: '2h ago',
  },
  {
    id: '2',
    name: 'Marketing Fund Management',
    taskCount: 3,
    lastActivity: '5h ago',
  },
  {
    id: '3',
    name: 'Operations Optimization',
    taskCount: 12,
    lastActivity: '1d ago',
  },
  {
    id: '4',
    name: 'Staff Training Program',
    taskCount: 5,
    lastActivity: '3d ago',
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
  onProjectClick?: (projectId: string) => void;
  onTaskClick?: (taskId: string) => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse, onOpenSettings, onProjectClick, onTaskClick }: SidebarProps) {
  const [activeView, setActiveView] = useState<'tasks' | 'projects'>('tasks');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [backBurnerTasks, setBackBurnerTasks] = useState<Task[]>(mockBackBurnerTasks);
  const [isBackBurnerExpanded, setIsBackBurnerExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate');
  const [hoveredBackBurnerTask, setHoveredBackBurnerTask] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [groupedView, setGroupedView] = useState(false);

  const toggleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const restoreTask = (taskId: string) => {
    const taskToRestore = backBurnerTasks.find(t => t.id === taskId);
    if (taskToRestore) {
      // Remove daysUntilDeletion when restoring
      const { daysUntilDeletion, ...restoredTask } = taskToRestore;
      setTasks([...tasks, restoredTask as Task]);
      setBackBurnerTasks(backBurnerTasks.filter(t => t.id !== taskId));
    }
  };

  // Get unique categories from tasks
  const categories = Array.from(new Set(tasks.map(task => task.category))).sort();

  // Filter and sort tasks
  const filteredTasks = categoryFilter === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === categoryFilter);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return a.dueDateSort - b.dueDateSort;
    } else {
      return b.priority - a.priority;
    }
  });

  // Group tasks by category if grouped view is enabled
  const groupedTasks = categories.reduce((acc, category) => {
    const categoryTasks = sortedTasks.filter(task => task.category === category);
    if (categoryTasks.length > 0) {
      acc[category] = categoryTasks;
    }
    return acc;
  }, {} as Record<string, Task[]>);

  if (isCollapsed) {
    return (
      <div 
        className="h-full flex flex-col"
        style={{
          width: '60px',
          backgroundColor: '#1E1E1E',
        }}
      >
        <div className="flex-1 flex flex-col items-center pt-4 gap-3">
          <button
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5" style={{ color: '#E2E8DD' }} />
          </button>
          <button
            onClick={() => setActiveView('tasks')}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
            style={{
              backgroundColor: activeView === 'tasks' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            }}
            aria-label="Tasks"
          >
            <Circle className="w-5 h-5" style={{ color: '#E2E8DD' }} />
          </button>
          <button
            onClick={() => setActiveView('projects')}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
            style={{
              backgroundColor: activeView === 'projects' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            }}
            aria-label="Projects"
          >
            <Folder className="w-5 h-5" style={{ color: '#E2E8DD' }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: '#1E1E1E',
      }}
    >
      {/* Header with RADAR branding */}
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <h2 className="tracking-tight" style={{ color: '#E2E8DD', fontSize: '16px', fontWeight: 500, lineHeight: 1.2 }}>RADAR</h2>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#E2E8DD', opacity: 0.5 }}>
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>•</span>
            <span>72°F</span>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 flex-shrink-0"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: '#E2E8DD', opacity: 0.7 }} />
        </button>
      </div>

      {/* Tasks/Projects Toggle */}
      <div className="p-4">
        <div
          className="flex p-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '100px' }}
        >
          <button
            onClick={() => setActiveView('tasks')}
            className="flex-1 px-3 py-2 transition-all duration-200 text-sm flex items-center justify-center"
            style={{
              backgroundColor: activeView === 'tasks' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: '#E2E8DD',
              borderRadius: '100px',
            }}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveView('projects')}
            className="flex-1 px-3 py-2 rounded-md transition-all duration-200 text-sm flex items-center justify-center"
            style={{
              backgroundColor: activeView === 'projects' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: '#E2E8DD',
            }}
          >
            Projects
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4">
        {activeView === 'tasks' ? (
          <div>
            {/* Sort and filter controls */}
            <div className="mb-3">
              {/* Sort by, Category filter, and Group toggle - all on one line */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 flex-shrink-0" style={{ color: '#E2E8DD', opacity: 0.4 }} />
                
                {/* Sort buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setSortBy('dueDate')}
                    className="px-2 py-1 rounded text-xs transition-all duration-200"
                    style={{
                      backgroundColor: sortBy === 'dueDate' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      color: '#E2E8DD',
                      opacity: sortBy === 'dueDate' ? 1 : 0.5,
                    }}
                  >
                    Due Date
                  </button>
                  <button
                    onClick={() => setSortBy('priority')}
                    className="px-2 py-1 rounded text-xs transition-all duration-200"
                    style={{
                      backgroundColor: sortBy === 'priority' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      color: '#E2E8DD',
                      opacity: sortBy === 'priority' ? 1 : 0.5,
                    }}
                  >
                    Priority
                  </button>
                </div>

                <div className="flex-1" />

                {/* Group by category toggle - expands to show text */}
                <button
                  onClick={() => setGroupedView(!groupedView)}
                  className="rounded flex items-center gap-1.5 overflow-hidden transition-all duration-300"
                  style={{
                    backgroundColor: groupedView ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    color: '#E2E8DD',
                    opacity: groupedView ? 1 : 0.5,
                    width: groupedView ? 'auto' : '24px',
                    paddingLeft: groupedView ? '8px' : '4px',
                    paddingRight: groupedView ? '8px' : '4px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                  }}
                  aria-label="Group by category"
                >
                  <Folder className="w-3.5 h-3.5 flex-shrink-0" />
                  <span 
                    className="text-xs whitespace-nowrap transition-all duration-300"
                    style={{
                      opacity: groupedView ? 1 : 0,
                      maxWidth: groupedView ? '200px' : '0px',
                      overflow: 'hidden',
                    }}
                  >
                    Grouped by Category
                  </span>
                </button>

                {/* Category filter dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="px-2 py-1 rounded text-xs transition-all duration-200 flex items-center gap-1"
                      style={{
                        backgroundColor: categoryFilter !== 'all' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        color: '#E2E8DD',
                        opacity: categoryFilter !== 'all' ? 1 : 0.5,
                      }}
                    >
                      <Filter className="w-3 h-3" />
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end"
                    style={{
                      backgroundColor: '#1E1E1E',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <DropdownMenuItem
                      onClick={() => setCategoryFilter('all')}
                      style={{
                        color: '#E2E8DD',
                        backgroundColor: categoryFilter === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      className="text-xs"
                    >
                      All Categories
                    </DropdownMenuItem>
                    {categories.map((category) => (
                      <DropdownMenuItem
                        key={category}
                        onClick={() => setCategoryFilter(category)}
                        style={{
                          color: '#E2E8DD',
                          backgroundColor: categoryFilter === category ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                          cursor: 'pointer',
                        }}
                        className="text-xs"
                      >
                        {category}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tasks list */}
            {groupedView ? (
              // Grouped view - tasks organized by category
              <div className="space-y-4">
                {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
                  <div key={category}>
                    {/* Category header */}
                    <div 
                      className="px-2 py-1 mb-2 rounded"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.6 }}>
                        {category} ({categoryTasks.length})
                      </p>
                    </div>
                    {/* Tasks in this category */}
                    <div className="space-y-1">
                      {categoryTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => onTaskClick?.(task.id)}
                          className="rounded-lg transition-all duration-200 cursor-pointer p-3 hover:bg-white/5"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskComplete(task.id);
                              }}
                              className="mt-0.5 flex-shrink-0"
                              aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5" style={{ color: '#636940' }} />
                              ) : (
                                <Circle className="w-5 h-5" style={{ color: '#E2E8DD', opacity: 0.4 }} />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm break-words"
                                style={{
                                  color: '#E2E8DD',
                                  opacity: task.completed ? 0.5 : 1,
                                  textDecoration: task.completed ? 'line-through' : 'none',
                                }}
                              >
                                {task.title}
                              </p>
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.4 }}>
                                    {task.dueDate}
                                  </p>
                                  {task.waitingOn && (
                                    <span 
                                      className="text-xs"
                                      style={{ color: '#E2E8DD', opacity: 0.4 }}
                                    >
                                      • Waiting on {task.waitingOn === 'me' ? 'me' : task.waitingOn}
                                    </span>
                                  )}
                                  <span 
                                    className="text-xs px-1.5 py-0.5 rounded"
                                    style={{ 
                                      backgroundColor: 'rgba(233, 138, 21, 0.2)',
                                      color: '#E98A15',
                                    }}
                                  >
                                    {task.priority}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.3 }}>
                                    {task.lastActivity}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Normal view - flat list
              <div className="space-y-1">
                {sortedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task.id)}
                    className="rounded-lg transition-all duration-200 cursor-pointer p-3 hover:bg-white/5"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskComplete(task.id);
                        }}
                        className="mt-0.5 flex-shrink-0"
                        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5" style={{ color: '#636940' }} />
                        ) : (
                          <Circle className="w-5 h-5" style={{ color: '#E2E8DD', opacity: 0.4 }} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm break-words"
                          style={{
                            color: '#E2E8DD',
                            opacity: task.completed ? 0.5 : 1,
                            textDecoration: task.completed ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </p>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.4 }}>
                              {task.dueDate}
                            </p>
                            {task.waitingOn && (
                              <span 
                                className="text-xs"
                                style={{ color: '#E2E8DD', opacity: 0.4 }}
                              >
                                • Waiting on {task.waitingOn === 'me' ? 'me' : task.waitingOn}
                              </span>
                            )}
                            <span 
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ 
                                backgroundColor: 'rgba(233, 138, 21, 0.2)',
                                color: '#E98A15',
                              }}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.3 }}>
                              {task.lastActivity}
                            </p>
                            <span className="text-xs" style={{ color: '#E2E8DD', opacity: 0.3 }}>
                              • {task.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Back Burner Section */}
            <div className="mt-4">
              {/* Divider */}
              <div 
                className="mb-3"
                style={{ 
                  height: '1px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                }} 
              />

              {/* Back Burner Header */}
              <button
                onClick={() => setIsBackBurnerExpanded(!isBackBurnerExpanded)}
                className="w-full flex items-center justify-between px-2 py-3 rounded-lg transition-all hover:bg-white/5"
                style={{ opacity: 0.6 }}
              >
                <span className="text-sm" style={{ color: '#E2E8DD' }}>
                  Back Burner ({backBurnerTasks.length})
                </span>
                {isBackBurnerExpanded ? (
                  <ChevronRight 
                    className="w-4 h-4 transition-transform rotate-90" 
                    style={{ color: '#E2E8DD' }} 
                  />
                ) : (
                  <ChevronRight 
                    className="w-4 h-4 transition-transform" 
                    style={{ color: '#E2E8DD' }} 
                  />
                )}
              </button>

              {/* Back Burner Tasks (when expanded) */}
              {isBackBurnerExpanded && (
                <div className="space-y-2 mt-2 pb-3">
                  {backBurnerTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg transition-all duration-200 cursor-pointer p-3 hover:bg-white/5 relative"
                      style={{ opacity: 0.6 }}
                      onMouseEnter={() => setHoveredBackBurnerTask(task.id)}
                      onMouseLeave={() => setHoveredBackBurnerTask(null)}
                    >
                      <div className="flex items-start gap-3">
                        <Circle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#E2E8DD', opacity: 0.4 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm break-words" style={{ color: '#E2E8DD' }}>
                            {task.title}
                          </p>
                          <div className="flex flex-col gap-1 mt-1">
                            {task.dueDate && (
                              <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.7 }}>
                                {task.dueDate}
                              </p>
                            )}
                            {task.daysUntilDeletion && (
                              <p className="text-xs" style={{ color: '#E2E8DD', opacity: 0.5 }}>
                                Deletes in {task.daysUntilDeletion} days
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Restore button (appears on hover) */}
                        {hoveredBackBurnerTask === task.id && (
                          <button
                            onClick={() => restoreTask(task.id)}
                            className="px-2 py-1 rounded text-xs transition-all hover:bg-white/10 flex items-center gap-1"
                            style={{ 
                              color: '#E2E8DD',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          >
                            <Undo2 className="w-3 h-3" />
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {mockProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onProjectClick?.(project.id)}
                className="rounded-lg transition-all duration-200 cursor-pointer p-3 hover:bg-white/5"
              >
                <div className="flex items-start gap-3">
                  <Folder className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#E98A15' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm break-words" style={{ color: '#E2E8DD' }}>
                      {project.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#E2E8DD', opacity: 0.4 }}>
                      {project.taskCount} tasks • {project.lastActivity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        {/* Settings */}
        <button 
          onClick={onOpenSettings}
          className="w-full p-4 flex items-center gap-3 transition-all hover:bg-white/5"
        >
          <Settings className="w-5 h-5" style={{ color: '#E2E8DD', opacity: 0.7 }} />
          <span className="text-sm" style={{ color: '#E2E8DD', opacity: 0.7 }}>Settings</span>
        </button>

        {/* User Profile */}
        <div className="p-4 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#DB4C40' }}
          >
            <User className="w-5 h-5" style={{ color: '#E2E8DD' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{ color: '#E2E8DD' }}>Jason Miller</p>
            <p className="text-xs truncate" style={{ color: '#E2E8DD', opacity: 0.5 }}>jason@wingstop.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}