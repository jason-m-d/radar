import { useMemo, type FC } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  Calendar,
  Clock,
  Copy,
  RotateCcw,
  ThumbsDown,
  ThumbsUp
} from "lucide-react";

import ActionMessage, { type ActionMessageMetadata, type ActionMessagePayload } from "@/components/ActionMessage";

type MessageMetadata = ActionMessageMetadata & {
  snoozePrompt?: boolean;
  snoozeForMessageId?: string;
};

type ChatMessageProps = {
  id: string;
  message: string;
  isUser: boolean;
  timestamp?: string;
  type?: "REGULAR" | "ACTION" | "CATCHUP";
  confidence?: number | null;
  taskId?: string | null;
  projectId?: string | null;
  metadata?: MessageMetadata | null;
  isRead?: boolean;
  snoozedUntil?: string | null;
  onOpenTask?: (taskId: string) => void;
  onOpenProject?: (projectId: string) => void;
  onSnoozeAction?: (messageId: string) => void;
  onBackBurner?: (messageId: string, taskIds: string[]) => Promise<void> | void;
  onMarkRead?: (messageId: string) => Promise<void> | void;
  onSnoozeOptionSelect?: (actionMessageId: string, promptMessageId: string, option: "later_today" | "tomorrow" | "next_week") => void;
  onSnoozeCustomSelect?: (actionMessageId: string, promptMessageId: string) => void;
  onRescheduleAction?: (messageId: string, taskIds: string[]) => Promise<void> | void;
  onRescheduleOptionSelect?: (taskId: string, promptMessageId: string, option: "later_today" | "tomorrow" | "next_week") => void;
  onCompleteTask?: (taskId: string) => Promise<void> | void;
};

type ParsedTask = {
  title: string;
  dueDate?: string;
  tags?: string[];
  priority?: string;
};

type ParsedMessage = {
  beforeTask: string;
  taskContent?: ParsedTask;
  afterTask: string;
  hasTask: boolean;
};

const radarActions = [
  { icon: Copy, label: "Copy message" },
  { icon: RotateCcw, label: "Retry response" },
  { icon: ThumbsUp, label: "Thumbs up" },
  { icon: ThumbsDown, label: "Thumbs down" }
];

const iconButtonClass = "radar-icon-button";

const parseTaskMetadata = (raw: string): ParsedTask => {
  const [titleLine, ...otherLines] = raw.split("\n");
  const metadataLine = otherLines.join(" ").trim();

  const parsed: ParsedTask = {
    title: titleLine.trim()
  };

  if (metadataLine.length === 0) {
    return parsed;
  }

  const dueMatch = metadataLine.match(/Due:\s*([^•]+)/i);
  if (dueMatch) {
    parsed.dueDate = dueMatch[1].trim();
  }

  const tagsMatch = metadataLine.match(/Tags:\s*([^•]+)/i);
  if (tagsMatch) {
    parsed.tags = tagsMatch[1]
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  const priorityMatch = metadataLine.match(/Priority:\s*([^•]+)/i);
  if (priorityMatch) {
    parsed.priority = priorityMatch[1].trim();
  }

  return parsed;
};

const parseMessageWithTask = (message: string): ParsedMessage => {
  const taskPattern = /\[([^\]]+)\]/;
  const match = message.match(taskPattern);

  if (!match) {
    return {
      beforeTask: message,
      afterTask: "",
      hasTask: false
    };
  }

  const beforeTask = message.slice(0, match.index).trimEnd();
  const taskContent = match[1];
  const afterTask = message.slice((match.index ?? 0) + match[0].length).trimStart();

  return {
    beforeTask,
    afterTask,
    taskContent: parseTaskMetadata(taskContent),
    hasTask: true
  };
};

type TaskCardProps = ParsedTask & {
  taskId: string;
  onOpenTask?: (taskId: string) => void;
};

const TaskCard: FC<TaskCardProps> = ({ title, dueDate, tags, priority, taskId, onOpenTask }) => {
  const handleClick = () => {
    console.log("Open subchat for task:", title);
    onOpenTask?.(taskId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative mt-4 flex w-full flex-col gap-3 rounded-lg bg-[var(--accent-forest-green)] px-5 py-4 text-left text-[#E8E3D8] shadow-[0_2px_8px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-250 ease-[cubic-bezier(0.65,0,0.35,1)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(232,227,216,0.4)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[16px] font-semibold leading-tight tracking-[-0.015em]">
            {title}
          </span>
          <div className="flex flex-wrap items-center gap-2 text-[12px] uppercase tracking-[0.06em] text-[rgba(232,227,216,0.78)]">
            {dueDate ? <span>Due {dueDate}</span> : null}
            {priority ? <span>Priority {priority}</span> : null}
          </div>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.22)] text-[#1C1A17] transition-transform duration-250 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
      {tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#E8E3D8]"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.12)" }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
};

const ChatMessage: FC<ChatMessageProps> = ({
  id,
  message,
  isUser,
  timestamp,
  type = "REGULAR",
  confidence,
  taskId,
  projectId,
  metadata,
  isRead = false,
  snoozedUntil,
  onOpenTask,
  onOpenProject,
  onSnoozeAction,
  onBackBurner,
  onMarkRead,
  onSnoozeOptionSelect,
  onSnoozeCustomSelect,
  onRescheduleAction,
  onRescheduleOptionSelect,
  onCompleteTask,
}) => {
  const parsed = useMemo(() => parseMessageWithTask(message), [message]);
  const actionMetadata: ActionMessageMetadata | null = metadata
    ? {
        taskIds: metadata.taskIds,
        projectIds: metadata.projectIds,
      }
    : null;

  if (!isUser && (type === "ACTION" || type === "CATCHUP")) {
    const actionPayload: ActionMessagePayload = {
      id,
      content: message,
      confidence,
      isRead,
      metadata: actionMetadata,
      taskId,
      projectId,
      createdAt: timestamp,
    };

    return (
      <ActionMessage
        key={id}
        message={actionPayload}
        onOpenTask={onOpenTask}
        onOpenProject={onOpenProject}
        onBackBurner={onBackBurner}
        onRead={onMarkRead}
        onCompleteTask={onCompleteTask}
        onReschedule={onRescheduleAction}
        {...(type === "ACTION" ? { onSnooze: onSnoozeAction } : {})}
      />
    );
  }

  if (!isUser && metadata?.reschedulePrompt) {
    const targetTaskId = metadata.rescheduleForTaskId ?? taskId ?? null;
    const canSelectOption = typeof onRescheduleOptionSelect === "function" && Boolean(targetTaskId);

    const handleRescheduleOption = (option: "later_today" | "tomorrow" | "next_week") => {
      if (!canSelectOption || !targetTaskId) {
        return;
      }
      onRescheduleOptionSelect?.(targetTaskId, id, option);
    };

    return (
      <div className="mb-8 ml-20 flex justify-start">
        <div className="max-w-[calc(100%-128px)]">
          <div className="rounded-lg border border-[rgba(232,227,216,0.12)] bg-[var(--bg-surface)] px-5 py-4 text-[16px] leading-[1.6] text-[#F5F0E8] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <ReactMarkdown className="radar-markdown">
              {message}
            </ReactMarkdown>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleRescheduleOption("later_today")}
              disabled={!canSelectOption}
              className="rounded-full border border-[rgba(232,227,216,0.2)] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)] transition hover:border-[var(--accent-tropical-indigo)] hover:text-[var(--accent-tropical-indigo)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Later Today
            </button>
            <button
              type="button"
              onClick={() => handleRescheduleOption("tomorrow")}
              disabled={!canSelectOption}
              className="rounded-full border border-[rgba(232,227,216,0.2)] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)] transition hover:border-[var(--accent-tropical-indigo)] hover:text-[var(--accent-tropical-indigo)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleRescheduleOption("next_week")}
              disabled={!canSelectOption}
              className="rounded-full border border-[rgba(232,227,216,0.2)] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)] transition hover:border-[var(--accent-tropical-indigo)] hover:text-[var(--accent-tropical-indigo)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next Week
            </button>
          </div>
          <p className="mt-2 text-[16px] font-normal text-[#F5F0E8]" style={{ opacity: 0.8 }}>
            Or type a specific date (for example, "next Friday at 3pm").
          </p>
        </div>
      </div>
    );
  }

  if (!isUser && metadata?.snoozePrompt) {
    const targetMessageId = metadata.snoozeForMessageId ?? id;

    const handleOption = (option: "later_today" | "tomorrow" | "next_week") => {
      onSnoozeOptionSelect?.(targetMessageId, id, option);
    };

    const handleCustom = () => {
      onSnoozeCustomSelect?.(targetMessageId, id);
    };

    return (
      <div className="mb-8 ml-20 flex justify-start">
        <div className="max-w-[calc(100%-128px)]">
          <div className="rounded-lg border border-[rgba(232,227,216,0.12)] bg-[var(--bg-surface)] px-5 py-4 text-[16px] leading-[1.6] text-[#F5F0E8] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <ReactMarkdown className="radar-markdown">
              {message}
            </ReactMarkdown>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleOption("later_today")}
              className="rounded-full border border-[rgba(232,227,216,0.2)] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)] transition hover:border-[var(--accent-tropical-indigo)] hover:text-[var(--accent-tropical-indigo)]"
            >
              Later Today
            </button>
            <button
              type="button"
              onClick={() => handleOption("tomorrow")}
              className="rounded-full border border-[rgba(232,227,216,0.2)] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)] transition hover:border-[var(--accent-tropical-indigo)] hover:text-[var(--accent-tropical-indigo)]"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleOption("next_week")}
              className="rounded-full border border-[rgba(232,227,216,0.2)] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)] transition hover:border-[var(--accent-tropical-indigo)] hover:text-[var(--accent-tropical-indigo)]"
            >
              Next Week
            </button>
            <button
              type="button"
              onClick={handleCustom}
              className="radar-icon-button radar-icon-button--compact h-9 w-9 rounded-full bg-[rgba(255,255,255,0.08)] text-[#F5F0E8] transition hover:bg-[rgba(158,135,235,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(158,135,235,0.45)]"
            >
              <Clock />
            </button>
          </div>
          <p className="mt-2 text-[16px] font-normal text-[#F5F0E8]" style={{ opacity: 0.8 }}>
            Or you can tell me in the chat.
          </p>
        </div>
      </div>
    );
  }

  const actionMessageBody = useMemo(() => {
    if (!parsed.hasTask) {
      return "";
    }

    const segments = [parsed.beforeTask, parsed.afterTask].filter((segment) => segment && segment.length);
    return segments.join("\n\n");
  }, [parsed]);

  if (isUser) {
    return (
      <div className="mb-6 flex justify-end">
        <div className="max-w-[calc(100%-128px)]">
          <div className="rounded-lg bg-[#E8E3D8] px-5 py-4 text-[#1C1A17] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            <div className="flex items-start gap-4">
              <p className="flex-1 text-[16px] leading-[1.6] text-[#1C1A17]">{message}</p>
              <span className="-mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-tomato)] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1C1A17]">
                JM
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (parsed.hasTask && parsed.taskContent) {
    return (
      <div className="mb-8 flex justify-start">
        <div className="max-w-[calc(100%-128px)]">
          {timestamp ? (
            <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              {timestamp}
            </p>
          ) : null}
          <div className="rounded-lg border border-[rgba(232,227,216,0.12)] bg-[var(--bg-surface)] px-5 py-5 text-[16px] leading-[1.6] text-[#F5F0E8] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            {actionMessageBody.length ? (
              <ReactMarkdown className="radar-markdown">
                {actionMessageBody}
              </ReactMarkdown>
            ) : null}
          </div>
          <div className="ml-6 mt-3 h-6 w-0.5 bg-[var(--accent-forest-green)]"></div>
          <TaskCard {...parsed.taskContent} taskId={id} onOpenTask={onOpenTask} />
          <div className="mt-4 flex items-center gap-2">
            {radarActions.map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                className={`${iconButtonClass} radar-icon-button--compact`}
              >
                <Icon />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 flex justify-start">
      <div className="max-w-[calc(100%-128px)]">
        {timestamp ? (
          <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            {timestamp}
          </p>
        ) : null}
        <ReactMarkdown className="radar-markdown">
          {message}
        </ReactMarkdown>
        <div className="mt-3 flex items-center gap-2">
          {radarActions.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className={`${iconButtonClass} radar-icon-button--compact`}
            >
              <Icon />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
