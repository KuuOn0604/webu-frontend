import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MainNavigation } from '@/components/ui/MainNavigation';
import { ideApi } from '../api/ideService';
import { CardDetail } from '../types/ide';
import CodeEditorSection from './CodeEditorSection';
import ProblemTabsSection from './ProblemTabsSection';
import apiClient from '../api/apiClient';

/** Lấy userId từ JWT token trong localStorage */
const getUserIdFromToken = (): string | undefined => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return undefined;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload as { sub?: string }).sub;
  } catch {
    return undefined;
  }
};

export const Ide = (): JSX.Element => {
  const { problemSlug } = useParams<{ problemSlug: string }>();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionTrigger, setSubmissionTrigger] = useState(0);

  // Draggable split panel state (% width of left panel)
  const [splitPct, setSplitPct] = useState(45);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [navHeight, setNavHeight] = useState(112);

  const userId = getUserIdFromToken();

  // Measure real nav height after mount
  useEffect(() => {
    if (headerRef.current) {
      setNavHeight(headerRef.current.getBoundingClientRect().height);
    }
  }, []);

  useEffect(() => {
    if (!problemSlug) {
      setError('Không tìm thấy ID bài tập');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    ideApi
      .getCard(problemSlug)
      .then((data) => {
        if (data && data.difficulty_level) {
          data.difficulty_level = (data.difficulty_level
            .charAt(0)
            .toUpperCase() + data.difficulty_level.slice(1).toLowerCase()) as
            | 'Easy'
            | 'Medium'
            | 'Hard';
        }
        setCard(data);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error
            ? err.message
            : 'Không thể tải bài tập. Vui lòng thử lại.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [problemSlug]);

  // ── Drag logic ─────────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPct = ((e.clientX - rect.left) / rect.width) * 100;
    // clamp between 25% and 75%
    setSplitPct(Math.min(75, Math.max(25, newPct)));
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const handleFSRSUpdate = async (isPassed: boolean) => {
    if (!userId || !card) return;

    const safeCardId = (card as CardDetail & { _id?: string })._id || card.id;

    try {
      await apiClient.post('/api/fsrs/review', {
        userId: userId,
        cardId: safeCardId,
        isPassed: isPassed,
        problemDifficulty: card.difficulty_level,
      });
      console.log('FSRS score submitted successfully!');
    } catch (error) {
      console.error('Error submitting FSRS scores:', error);
    } finally {
      setSubmissionTrigger((prev) => prev + 1);
    }
  };

  const onDividerMouseDown = () => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      className="w-full bg-[#0d131f] flex flex-col"
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
      {/* ── Header ── */}
      <header
        ref={headerRef}
        className="flex-shrink-0 bg-[#0d131f] border-b border-white/[0.07] z-20"
      >
        <MainNavigation />
      </header>

      {/* ── Body ── */}
      <div
        className="flex-1 flex min-h-0"
        style={{ height: `calc(100dvh - ${navHeight}px)` }}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <svg
              className="animate-spin h-10 w-10 text-secondary-a70"
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
            <p className="text-neutral-a300 p8">Đang tải bài tập...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 px-8">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-white h6 mb-2">Không tìm thấy bài tập</h2>
              <p className="text-neutral-a400 p8 mb-6">{error}</p>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 bg-secondary-a90 hover:bg-secondary-a70 text-white h8 rounded-lg transition-colors cursor-pointer"
              >
                Quay lại
              </button>
            </div>
          </div>
        ) : card ? (
          /* ── Split panels ── */
          <div
            ref={containerRef}
            className="flex-1 flex min-h-0 min-w-0 p-2 gap-0"
          >
            {/* Left — Problem tabs */}
            <div
              className="flex-shrink-0 min-h-0 rounded-xl overflow-hidden"
              style={{ width: `${splitPct}%` }}
            >
              <ProblemTabsSection
                card={card}
                userId={userId}
                submissionTrigger={submissionTrigger}
              />
            </div>

            {/* Divider */}
            <div
              onMouseDown={onDividerMouseDown}
              className="flex-shrink-0 flex items-center justify-center w-2 mx-0.5 cursor-col-resize group z-10"
              title="Drag to resize"
            >
              <div className="w-0.5 h-12 rounded-full bg-white/10 group-hover:bg-secondary-a70 group-active:bg-secondary-a50 transition-colors duration-150" />
            </div>

            {/* Right — Code editor */}
            <div className="flex-1 min-h-0 min-w-0 rounded-xl overflow-hidden">
              <CodeEditorSection
                cardId={(card as CardDetail & { _id?: string })._id || card.id}
                boilerplateCodes={card.ide_data?.boilerplate_code ?? {}}
                onSubmissionDone={handleFSRSUpdate}
                cardTitle={card.title}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Ide;
