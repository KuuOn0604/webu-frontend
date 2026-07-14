import apiClient from '../api/apiClient';
import React, { useState, useEffect, useRef } from 'react';
import { renderFormattedDescription } from '../components/utils/descriptionFormatter';
import { ideApi } from '../api/ideService';
import { CardDetail, SubmissionHistory } from '../types/ide';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface ProblemTabsSectionProps {
  card: CardDetail;
  userId?: string;
  submissionTrigger?: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Medium: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  Hard: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

const now = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const ProblemTabsSection = ({
  card,
  userId,
  submissionTrigger,
}: ProblemTabsSectionProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState<'desc' | 'ai' | 'subs' | 'note'>(
    'desc',
  );

  // ── AI Tutor state ──────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Xin chào! Mình là AI Tutor 🤖\nMình sẵn sàng giúp bạn giải bài **${card.title}**. Hỏi mình bất cứ điều gì nhé!`,
      timestamp: now(),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        sender: 'ai',
        text: `Xin chào! Mình là AI Tutor 🤖\nMình sẵn sàng giúp bạn giải bài **${card.title}**. Hỏi mình bất cứ điều gì nhé!`,
        timestamp: now(),
      },
    ]);
  }, [card.id, card.title]);

  // ── Submissions state ───────────────────────────────────────────────────
  const [submissions, setSubmissions] = useState<SubmissionHistory[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  useEffect(() => {
    const safeCardId = (card as CardDetail & { _id?: string })._id || card.id;

    if (activeTab === 'subs' && userId && safeCardId) {
      setSubsLoading(true);
      ideApi
        .getSubmissions(safeCardId, userId)
        .then((data) => setSubmissions(data))
        .catch(() => setSubmissions([]))
        .finally(() => setSubsLoading(false));
    }
  }, [activeTab, card, userId, submissionTrigger]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: inputVal,
      timestamp: now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const question = inputVal;
    setInputVal('');
    setIsTyping(true);

    try {
      const res = await apiClient.post<{ reply?: string; message?: string }>(
        '/api/ai/chat',
        {
          message: question,
          problem_title: card.title,
          problem_description: card.content?.description ?? '',
        },
      );
      const aiText =
        res.data.reply ??
        res.data.message ??
        'Mình đang xử lý câu hỏi của bạn. Hãy thử lại sau nhé!';
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: aiText, timestamp: now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Xin lỗi, mình không thể kết nối đến AI Tutor lúc này 😥',
          timestamp: now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const formatTime = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const diffMs = Date.now() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      return `${diffDay}d ago`;
    } catch {
      return isoDate;
    }
  };

  // ── Note ─────────────────────────────────────────────────────────────
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteMessage, setNoteMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'note' && userId) {
      apiClient
        .get(`/notes?userId=${userId}&cardId=${card.id}`)
        .then((res) => {
          setNoteContent(res.data.content || '');
        })
        .catch(() => setNoteContent(''));
    }
  }, [activeTab, userId, card.id]);

  const handleSaveNote = async () => {
    if (!userId) return;
    setIsSavingNote(true);
    try {
      await apiClient.post('/notes', {
        user_id: userId,
        card_id: card.id,
        content: noteContent,
      });
      setNoteMessage('Đã lưu ghi chú thành công! ✅');
    } catch {
      setNoteMessage('Lưu thất bại! ❌');
    } finally {
      setIsSavingNote(false);
      setTimeout(() => setNoteMessage(''), 3000);
    }
  };

  const STATUS_LABEL: Record<string, string> = {
    Accepted: 'Accepted',
    'Wrong Answer': 'Wrong Answer',
    'Time Limit Exceeded': 'TLE',
    'Compilation Error': 'Compile Error',
    'Runtime Error': 'Runtime Error',
  };

  const TABS = [
    { id: 'desc' as const, label: 'Description' },
    {
      id: 'ai' as const,
      label: (
        <span className="flex items-center gap-1.5">
          AI Tutor
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </span>
      ),
    },
    { id: 'subs' as const, label: 'Submissions' },
    { id: 'note' as const, label: 'Notes' },
  ];

  const diffClass =
    DIFFICULTY_COLORS[card.difficulty_level] ?? DIFFICULTY_COLORS.Medium;

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'bullet' }, { list: 'ordered' }],
    ],
  };

  return (
    <div className="w-full h-full bg-[#0f1623] flex flex-col overflow-hidden rounded-xl border border-white/[0.07]">
      {/* ── Tab bar ── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-4 border-b border-white/[0.07] bg-[#111827]">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`relative py-3 px-3 text-sm font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap ${
              activeTab === id
                ? 'text-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {label}
            {activeTab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-a50 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Description */}
        {activeTab === 'desc' && (
          <div className="h-full overflow-y-auto px-6 py-5 space-y-5 text-sm leading-relaxed scrollbar-thin">
            {/* Title + badges */}
            <div className="space-y-2">
              <h1 className="text-white text-xl font-bold tracking-tight">
                {card.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${diffClass}`}
                >
                  {card.difficulty_level}
                </span>
                {card.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 bg-white/5 text-neutral-400 text-xs rounded-full border border-white/10 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Description text */}
            {renderFormattedDescription(
              card.content?.description ?? card.content?.question_text ?? '',
            )}

            {/* Examples */}
            {card.public_test_cases?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-white font-semibold text-sm">Examples</h3>
                {card.public_test_cases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-[#1a2235] border border-white/[0.08] overflow-hidden"
                  >
                    <div className="px-4 py-2 bg-white/[0.04] border-b border-white/[0.06]">
                      <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                        Example {idx + 1}
                      </span>
                    </div>
                    <pre className="px-4 py-3 text-neutral-300 font-mono text-xs leading-relaxed overflow-x-auto">
                      <span className="text-neutral-500">Input: </span>
                      {tc.input}
                      {'\n'}
                      <span className="text-neutral-500">Output: </span>
                      {tc.expected_output}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Tutor */}
        {activeTab === 'ai' && (
          <div className="h-full flex flex-col">
            {/* Messages area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-secondary-a90/40 border border-secondary-a70/40 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">
                      🤖
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-secondary-a90 text-white rounded-tr-sm'
                        : 'bg-[#1a2235] text-neutral-200 border border-white/[0.08] rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="block text-[10px] text-neutral-500 mt-1 text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary-a90/40 border border-secondary-a70/40 flex items-center justify-center text-xs flex-shrink-0">
                    🤖
                  </div>
                  <div className="bg-[#1a2235] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-white/[0.07]">
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 items-end bg-[#1a2235] border border-white/10 rounded-xl p-2"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Hỏi AI Tutor bất kỳ điều gì..."
                  className="flex-1 bg-transparent text-white placeholder-neutral-500 border-none outline-none py-1.5 px-2 text-sm resize-none"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isTyping}
                  className="p-2 bg-secondary-a90 hover:bg-secondary-a70 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  aria-label="Send"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Submissions */}
        {activeTab === 'subs' && (
          <div className="h-full overflow-y-auto px-4 py-5 space-y-3 scrollbar-thin">
            <h2 className="text-white h8">Submission History</h2>

            {!userId && (
              <div className="text-center py-16 text-neutral-500 text-sm">
                Vui lòng <span className="text-secondary-a50">đăng nhập</span>{' '}
                để xem lịch sử submission.
              </div>
            )}

            {userId && subsLoading && (
              <div className="flex items-center justify-center py-16 gap-2 text-neutral-500 text-sm">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </div>
            )}

            {userId && !subsLoading && submissions.length === 0 && (
              <div className="text-center py-16 text-neutral-500 text-sm">
                Chưa có submission nào. Hãy viết code và nhấn Submit!
              </div>
            )}

            {userId &&
              !subsLoading &&
              submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 bg-[#1a2235] border border-white/[0.08] rounded-xl space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          sub.passed
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {STATUS_LABEL[sub.status] ?? sub.status}
                      </span>
                      <span className="text-neutral-400 text-xs capitalize">
                        {sub.language}
                      </span>
                    </div>
                    <span className="text-neutral-600 text-xs">
                      {formatTime(sub.submitted_at)}
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs text-neutral-500">
                    <span>
                      Runtime:{' '}
                      <strong className="text-neutral-300">
                        {sub.execution_time != null
                          ? `${sub.execution_time} ms`
                          : 'N/A'}
                      </strong>
                    </span>
                    <span>
                      Memory:{' '}
                      <strong className="text-neutral-300">
                        {sub.memory_used != null
                          ? `${(sub.memory_used / 1024).toFixed(1)} MB`
                          : 'N/A'}
                      </strong>
                    </span>
                  </div>

                  <details className="cursor-pointer group">
                    <summary className="text-secondary-a50 hover:text-secondary-a30 text-xs font-semibold transition-colors select-none list-none flex items-center gap-1">
                      <svg
                        className="w-3 h-3 transition-transform group-open:rotate-90"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      View Code
                    </summary>
                    <pre className="mt-2 p-3 bg-[#0a0f1a] border border-white/[0.06] rounded-lg text-xs text-neutral-300 font-mono overflow-x-auto whitespace-pre leading-relaxed">
                      <code>{sub.submitted_code}</code>
                    </pre>
                  </details>
                </div>
              ))}
          </div>
        )}
        {/* Notes Tab */}
        {activeTab === 'note' && (
          <div className="h-full flex flex-col px-4 py-5 space-y-4">
            <div className="flex justify-between items-center flex-shrink-0">
              <h2 className="text-white h8">Personal Notes</h2>
              {noteMessage && (
                <span className="text-emerald-400 text-xs font-medium animate-pulse">
                  {noteMessage}
                </span>
              )}
            </div>

            {!userId ? (
              <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
                Vui lòng{' '}
                <span className="text-secondary-a50 mx-1">đăng nhập</span> để
                tạo ghi chú.
              </div>
            ) : (
              <>
                <div className="flex-1 w-full bg-[#1a2235] rounded-xl border border-white/[0.08] overflow-hidden flex flex-col text-neutral-200">
                  <ReactQuill
                    theme="snow"
                    value={noteContent}
                    onChange={setNoteContent} // Quill tự động trả về value là chuỗi HTML, không cần e.target.value
                    modules={quillModules}
                    placeholder={`Ghi chú lại cách giải, mẹo hay cho bài ${card.title} tại đây...`}
                    className="flex-1 flex flex-col h-full"
                  />
                </div>
                <div className="flex justify-end flex-shrink-0">
                  <button
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-xs flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    {isSavingNote ? 'Đang lưu...' : 'Lưu ghi chú'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemTabsSection;
