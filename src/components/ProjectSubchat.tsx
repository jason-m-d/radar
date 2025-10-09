"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Clock,
  Link,
  Users
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import TaskCard from "@/components/TaskCard";

type ProjectSubchatProps = {
  projectId: string;
  onClose: () => void;
  onOpenTask?: (taskId: string) => void;
};

type Message = {
  id: string;
  message: string;
  isUser: boolean;
  timestamp?: string;
};

type ProjectTask = {
  id: string;
  title: string;
  dueDate: string;
  status: "action-needed" | "waiting" | "complete";
  priority: number;
  category: string;
  waitingOn?: string;
};

type Milestone = {
  id: string;
  title: string;
  dueDate: string;
  status: "upcoming" | "complete";
};

const projectTasks: ProjectTask[] = [
  {
    id: "project-task-1",
    title: "Reconcile marketing spend",
    dueDate: "Due Oct 5",
    status: "action-needed",
    priority: 1,
    category: "Finance",
    waitingOn: "Finance"
  },
  {
    id: "project-task-2",
    title: "Approve vendor invoices",
    dueDate: "Due Oct 6",
    status: "waiting",
    priority: 2,
    category: "Operations",
    waitingOn: "Legal"
  },
  {
    id: "project-task-3",
    title: "Finalize deck outline",
    dueDate: "Due Oct 8",
    status: "complete",
    priority: 3,
    category: "Strategy"
  }
];

const milestones: Milestone[] = [
  { id: "m-1", title: "Kickoff aligned", dueDate: "Oct 1", status: "complete" },
  { id: "m-2", title: "Variance draft", dueDate: "Oct 10", status: "upcoming" },
  { id: "m-3", title: "Executive review", dueDate: "Nov 8", status: "upcoming" }
];

const headerMessages: Message[] = [
  {
    id: "project-message-1",
    message:
      "Good progress so far — 5 of 12 tasks wrapped. Want me to nudge finance about the missing vendor updates?",
    isUser: false,
    timestamp: "Today, 9:20 AM"
  },
  {
    id: "project-message-2",
    message: "Yes, please follow up so we can close the variance report.",
    isUser: true
  }
];

const ProjectSubchat = ({ projectId, onClose, onOpenTask }: ProjectSubchatProps) => {
  const [messages, setMessages] = useState<Message[]>(headerMessages);
  const [taskFilter, setTaskFilter] = useState<"all" | "action-needed" | "waiting">("all");
  const [playersOpen, setPlayersOpen] = useState(true);
  const [milestonesOpen, setMilestonesOpen] = useState(true);
  const [contentOpen, setContentOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onClose]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === "all") {
      return projectTasks;
    }

    return projectTasks.filter((task) => task.status === taskFilter);
  }, [taskFilter]);

  const handleSendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `project-message-${Date.now()}`,
        message: trimmed,
        isUser: true
      }
    ]);
  }, []);

  const sectionChevron = (expanded: boolean) => (
    <ChevronRight
      className={`h-4 w-4 text-[#E2E8DD]/60 transition-transform duration-200 ${
        expanded ? "rotate-90" : ""
      }`}
    />
  );

  return (
    <div className="relative flex h-full w-full bg-[#0F0E0E] text-[#E2E8DD]">
      <button
        type="button"
        onClick={onClose}
        className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-[#E2E8DD] transition hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <aside className="flex h-full w-[400px] flex-col bg-[#1E1E1E] px-6 pb-6 pt-20">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#E2E8DD]/40">Project</p>
          <h2 className="mt-2 text-lg font-semibold text-[#E2E8DD]">Q1 Financial Close</h2>
          <p className="mt-2 text-sm text-[#E2E8DD]/70">
            Close out financials for Q1 across marketing, sales, and operations. Ensure reconciliations are audit-ready for the board deck.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-xs text-[#E2E8DD]">
            <span className="flex h-2 w-2 rounded-full bg-[#4A9EFF]"></span>
            In Progress
          </div>
        </div>

        <div className="mt-6 space-y-4 text-sm text-[#E2E8DD]/70">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[#E2E8DD]/50">Progress</p>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-[#5b4842] to-[#7ba885]" style={{ width: "42%" }}></div>
              </div>
              <p className="mt-1 text-xs text-[#E2E8DD]/50">42% · 5 of 12 tasks complete</p>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#E2E8DD]/60">Timeline</span>
              <span className="font-medium text-[#E2E8DD]">Started Oct 1 · Due Nov 15</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-lg border border-white/10 bg-white/5">
              <button
                type="button"
                onClick={() => setPlayersOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[#E2E8DD] transition hover:bg-white/10"
              >
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#E2E8DD]/70" /> Players <span className="text-xs text-[#E2E8DD]/50">5</span>
                </span>
                {sectionChevron(playersOpen)}
              </button>
              <div
                className="overflow-hidden text-xs text-[#E2E8DD]/60 transition-all duration-200 ease-out"
                style={{ maxHeight: playersOpen ? 200 : 0, opacity: playersOpen ? 1 : 0 }}
              >
                <div className="mt-2 space-y-2 px-3 pb-3">
                  {["Jason Miller", "Steve M.", "Finance Ops", "Legal", "Marketing"].map((name) => (
                    <div key={name} className="flex items-center justify-between">
                      <span>{name}</span>
                      <span className="text-[#E2E8DD]/40">Owner</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5">
              <div className="flex w-full items-center justify-between px-3 py-2 text-sm text-[#E2E8DD]">
                <h3 className="text-sm font-semibold text-[#E2E8DD]">Tasks</h3>
                <div className="inline-flex items-center gap-2 rounded-lg bg-black/40 p-1">
                  {["all", "action-needed", "waiting"].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setTaskFilter(filter as typeof taskFilter)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        taskFilter === filter
                          ? "bg-[#2A2928] text-[#E2E8DD]"
                          : "text-[#E2E8DD]/60"
                      }`}
                    >
                      {filter === "all"
                        ? "All"
                        : filter === "action-needed"
                        ? "Action Needed"
                        : "Waiting"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-[500px] space-y-2 overflow-y-auto px-3 pb-3">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    onSelect={onOpenTask}
                    className="mb-3"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5">
              <button
                type="button"
                onClick={() => setMilestonesOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[#E2E8DD] transition hover:bg-white/10"
              >
                <span className="inline-flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#E2E8DD]/70" /> Milestones <span className="text-xs text-[#E2E8DD]/50">{milestones.length}</span>
                </span>
                {sectionChevron(milestonesOpen)}
              </button>
              <div
                className="overflow-hidden text-xs text-[#E2E8DD]/70 transition-all duration-200 ease-out"
                style={{ maxHeight: milestonesOpen ? 220 : 0, opacity: milestonesOpen ? 1 : 0 }}
              >
                <div className="mt-2 space-y-3 px-3 pb-3">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <span className="inline-flex items-center gap-2 text-sm text-[#E2E8DD]">
                        <Check className={`h-3.5 w-3.5 ${milestone.status === "complete" ? "text-[#7ba885]" : "text-[#E2E8DD]/40"}`} />
                        {milestone.title}
                      </span>
                      <span className="text-xs text-[#E2E8DD]/50">{milestone.dueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setContentOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left text-sm text-[#E2E8DD] transition hover:bg-white/10"
            >
              <span className="inline-flex items-center gap-2">
                <Link className="h-4 w-4 text-[#E2E8DD]/70" /> Content
              </span>
              {sectionChevron(contentOpen)}
            </button>
            <div
              className="overflow-hidden text-xs text-[#E2E8DD]/60 transition-all duration-200 ease-out"
              style={{ maxHeight: contentOpen ? 180 : 0, opacity: contentOpen ? 1 : 0 }}
            >
              <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between">
                  <span>Board prep deck (Figma)</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#E2E8DD]/40" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Finance playbook</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#E2E8DD]/40" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTimelineOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left text-sm text-[#E2E8DD] transition hover:bg-white/10"
            >
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#E2E8DD]/70" /> Timeline
              </span>
              {sectionChevron(timelineOpen)}
            </button>
            <div
              className="overflow-hidden text-xs text-[#E2E8DD]/60 transition-all duration-200 ease-out"
              style={{ maxHeight: timelineOpen ? 200 : 0, opacity: timelineOpen ? 1 : 0 }}
            >
              <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between">
                  <span>Kickoff</span>
                  <span className="text-[#E2E8DD]/40">Oct 1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Variance analysis</span>
                  <span className="text-[#E2E8DD]/40">Oct 10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Executive review</span>
                  <span className="text-[#E2E8DD]/40">Nov 8</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-6">
          <button
            type="button"
            className="radar-primary-button w-full justify-center"
            style={{
              ["--button-background" as const]: "var(--accent-forest-green)",
              ["--button-shadow" as const]: "0 12px 28px rgba(77, 144, 66, 0.38)",
              ["--button-focus-outline" as const]: "rgba(77, 144, 66, 0.45)",
            }}
          >
            Mark Complete
          </button>
          <button
            type="button"
            className="w-full text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
          >
            Archive Project
          </button>
        </div>
      </aside>

      <section className="flex h-full min-w-0 flex-1 flex-col bg-[#0F0E0E] pt-16">
        <header className="px-10">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#E2E8DD]/40">Project</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#E2E8DD]">Q1 Financial Close</h1>
            <div className="mt-3 inline-flex items-center gap-3 text-xs text-[#E2E8DD]/60">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#4A9EFF]"></span>
                In Progress
              </span>
              <span>42% complete</span>
              <span>Due Nov 15</span>
            </div>
          </div>
        </header>

        <div className="mt-8 flex flex-1 flex-col px-10 pb-8">
          <div className="flex-1 overflow-y-auto">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} {...msg} onOpenTask={onOpenTask} />
            ))}
          </div>
          <div className="mt-6 pb-2">
            <div className="mb-4 flex flex-wrap gap-2">
              {projectSuggestionPills.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-[#E2E8DD]/60 transition hover:bg-white/10"
                >
                  {pill}
                </button>
              ))}
            </div>
            <ChatInput onSend={handleSendMessage} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectSubchat;
