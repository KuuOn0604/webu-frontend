import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Suggest } from '@/components/dashboard/Suggest';
import { MainNavigation } from '@/components/ui/MainNavigation';
import { Review } from '@/components/ui/Review';
import {
  GenerateProblem,
  type GenerateProblemHandle,
} from '@/components/dashboard/GenerateProblem';
import { problemApi } from '@/api/problemService';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/contexts/AuthContext/useAuth';

interface DueProblem {
  card_id:
    | {
        _id: string;
        title?: string;
        difficulty_level?: string;
        tags?: string[];
        id?: string;
      }
    | string;
  [key: string]: unknown;
}

interface DashboardCard {
  _id?: string;
  id?: string;
  title?: string;
  difficulty_level?: string;
  tags?: string[];
  /** Serialized ObjectId string from backend JSON response */
  created_by?: string;
}

export interface FsrsHistoryItem {
  card_id: string;
  state: string;
  title: string;
  difficulty_level: string;
  tags: string[];
}

export const Dashboard = (): JSX.Element => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Ref để gọi reset() trên component con sau khi tạo problem thành công
  const generateProblemRef = useRef<GenerateProblemHandle>(null);

  const handleGenerate = async (prompt: string, imageFile: File | null) => {
    if (!prompt.trim() && !imageFile) return;

    setIsProcessing(true);

    try {
      const aiProblem = await problemApi.generateFromAi(prompt, imageFile);

      // Reset ô nhập liệu sau khi AI xử lý xong
      generateProblemRef.current?.reset();

      navigate('/create-problem', {
        state: { aiProblem },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to extract the problem from the image or prompt. Please try again or input manually.';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };
  const [dueProblems, setDueProblems] = useState<DueProblem[]>([]);
  const [notebookProblems, setNotebookProblems] = useState<DashboardCard[]>([]);
  const [fsrsHistory, setFsrsHistory] = useState<FsrsHistoryItem[]>([]);
  const [isLoadingReview, setIsLoadingReview] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setIsLoadingReview(false);
        return;
      }
      try {
        // Ensure daily tasks are initialized for new users
        try {
          await apiClient.get('/users/me/daily-tasks');
        } catch (initError) {
          console.error('Failed to initialize daily tasks:', initError);
        }

        // Fetch due reviews and fsrs history
        const [fsrsResponse, historyResponse] = await Promise.all([
          apiClient.get(
            `/api/fsrs/due-reviews?userId=${userId}&_t=${Date.now()}`,
          ),
          apiClient.get(`/users/me/fsrs-progress?_t=${Date.now()}`),
        ]);
        console.log('DEBUG fsrsResponse:', fsrsResponse.data);
        console.log('DEBUG historyResponse:', historyResponse.data);

        setDueProblems(fsrsResponse.data);
        setFsrsHistory(historyResponse.data);

        // Fetch notebook problems
        const [cardsRes, interactedRes] = await Promise.all([
          apiClient.get('/cards', { params: { limit: 200, page: 1 } }),
          apiClient.get('/users/me/interacted-cards'),
        ]);

        const allCards: DashboardCard[] = cardsRes.data?.data || [];
        // interactedRes.data is string[] of card IDs from submissions
        const interactedSet = new Set<string>(interactedRes.data || []);

        const myNotebookCards = allCards.filter((c) => {
          // Mongoose does not expose the `id` virtual by default in API responses;
          // use `_id` (serialized as string) as the canonical identifier.
          const id = (c._id || c.id)?.toString();
          const createdBy = c.created_by?.toString();
          return id && (interactedSet.has(id) || createdBy === userId);
        });

        // Pick 4 random cards for the notebook suggest
        const shuffled = [...myNotebookCards].sort(() => 0.5 - Math.random());
        setNotebookProblems(shuffled.slice(0, 4));
      } catch (error: unknown) {
        console.error('Failed to fetch dashboard data:', error);

        // Define a type for axios errors to safely extract the message
        type AxiosError = {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const axiosErr = error as AxiosError;

        setErrorMsg(
          axiosErr?.response?.data?.message ||
            axiosErr?.message ||
            String(error),
        );
      } finally {
        setIsLoadingReview(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleStartReview = () => {
    if (dueProblems.length > 0) {
      const firstProblem = dueProblems[0] as {
        card_id?: string | { id?: string; _id?: string };
      };

      const rawCardId = firstProblem?.card_id;

      const problemId =
        typeof rawCardId === 'object' && rawCardId !== null
          ? rawCardId.id || rawCardId._id
          : rawCardId;

      if (problemId) {
        navigate(`/problems/${problemId}`);
      } else {
        return;
      }
    }
  };

  return (
    <div>
      <header className="self-stretch flex flex-row justify-start gap-10 sticky top-0 z-10">
        <MainNavigation />
      </header>
      {errorMsg && (
        <div className="w-full bg-danger-a20 text-white p-4 text-center">
          <p className="font-bold">LỖI FETCH DATA: {errorMsg}</p>
        </div>
      )}
      <div className="w-full min-h-screen bg-tonal-a10 px-4 sm:px-8 md:px-12 lg:px-20 py-5 flex flex-col justify-between items-stretch overflow-hidden select-none gap-6 md:gap-10">
        <div className="w-full relative bg-tonal-a20 rounded-[20px] overflow-hidden px-4 sm:px-8 md:px-12 lg:px-20 py-5 flex flex-col justify-between items-stretch gap-6 md:gap-10">
          <Review
            reviewCount={dueProblems.length}
            isLoading={isLoadingReview}
            onStart={handleStartReview}
            completedHistory={fsrsHistory.filter((p) => p.state !== 'new')}
          />
        </div>
        <div>
          <h1 className="h1 text-center">
            What problem do you want to solve today?
          </h1>
          <div className="w-full flex justify-center items-center mt-5">
            <GenerateProblem
              ref={generateProblemRef}
              onGenerate={handleGenerate}
              isProcessing={isProcessing}
            />
          </div>
        </div>
        <div
          className="self-stretch flex-1 flex flex-row justify-center items-center py-1 gap-10"
          aria-hidden="true"
        >
          <div></div>
        </div>
        <div className="self-stretch flex-1 flex flex-col lg:flex-row justify-center items-center py-1 gap-6 md:gap-10">
          <div>
            <Suggest
              onExpandClick={() => {
                navigate('/problem');
              }}
              title={'Suggested Problems'}
              problems={dueProblems
                .map((p) => {
                  const card = (
                    typeof p.card_id === 'object' && p.card_id !== null
                      ? p.card_id
                      : {}
                  ) as {
                    _id?: string;
                    title?: string;
                    difficulty_level?: string;
                    tags?: string[];
                    id?: string;
                  };
                  return {
                    id: card.id || card._id || '',
                    title: card.title || 'Unknown',
                    difficulty: card.difficulty_level || 'Medium',
                    tags: card.tags || [],
                  };
                })
                .filter((p) => p.id)}
            />
          </div>
          <div>
            <Suggest
              onExpandClick={() => {
                navigate('/notebook');
              }}
              title="Your Notebook"
              problems={notebookProblems.map((card) => ({
                id: card.id || card._id || '',
                title: card.title || 'Unknown',
                difficulty: card.difficulty_level || 'Medium',
                tags: card.tags || [],
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
