import { useState, type FC, type KeyboardEvent } from "react";
import { ArrowRight, Paperclip, Plus, RefreshCw } from "lucide-react";

type ChatInputProps = {
  onSend: (value: string) => void | Promise<void>;
};

const iconButtonClass = "radar-icon-button";

const primaryButtonClass = "radar-primary-button";

const ChatInput: FC<ChatInputProps> = ({ onSend }) => {
  const [draft, setDraft] = useState("");

  const sendMessage = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    void onSend(trimmed);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[rgba(232,227,216,0.12)] bg-[var(--bg-surface)] px-5 py-5">
      <input
        type="text"
        placeholder="Ask RADAR anything..."
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent text-[14px] font-normal leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" className={iconButtonClass} aria-label="Attach file">
            <Paperclip className="h-[18px] w-[18px]" />
          </button>
          <button type="button" className={iconButtonClass} aria-label="Add subtask">
            <Plus className="h-[18px] w-[18px]" />
          </button>
          <button type="button" className={iconButtonClass} aria-label="Catch me up">
            <RefreshCw className="h-[18px] w-[18px]" />
          </button>
        </div>
        <button type="button" onClick={sendMessage} className={primaryButtonClass}>
          <span>Send</span>
          <ArrowRight className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
