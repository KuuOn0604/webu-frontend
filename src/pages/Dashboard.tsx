import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Suggest } from '@/components/dashboard/Suggest';
import { MainNavigation } from '@/components/ui/MainNavigation';
import { Review } from '@/components/ui/Review';
import { GenerateProblem } from '@/components/dashboard/GenerateProblem';
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
  created_by?: string;
}

const Dashboard = (): JSX.Element => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerate = async (prompt: string, imageFile: File | null) => {
    if (!prompt.trim() && !imageFile) return;

    setAiError(null);
    setIsProcessing(true);

    try {
      const aiProblem = await problemApi.generateFromAi(prompt, imageFile);

      navigate('/create-problem', {
        state: { aiProblem },
      });
    } catch {
      setAiError(
        'Failed to extract the problem from the image or prompt. Please try again or input manually.',
      );
    } finally {
      setIsProcessing(false);
    }
  };
  const [dueProblems, setDueProblems] = useState<DueProblem[]>([]);
  const [notebookProblems, setNotebookProblems] = useState<DashboardCard[]>([]);
  const [isLoadingReview, setIsLoadingReview] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setIsLoadingReview(false);
        return;
      }
      try {
        // Fetch due reviews
        const fsrsResponse = await apiClient.get(
          `/api/fsrs/due-reviews?userId=${userId}`,
        );
        setDueProblems(fsrsResponse.data);

        // Fetch notebook problems
        const [cardsRes, interactedRes] = await Promise.all([
          apiClient.get('/cards', { params: { limit: 200, page: 1 } }),
          apiClient.get('/users/me/interacted-cards'),
        ]);

        const allCards: DashboardCard[] = cardsRes.data?.data || [];
        const interactedSet = new Set(interactedRes.data || []);

        const myNotebookCards = allCards.filter((c) => {
          const id = c.id || c._id;
          return id && (interactedSet.has(id) || c.created_by === userId);
        });

        // Pick 4 random cards for the notebook suggest
        const shuffled = [...myNotebookCards].sort(() => 0.5 - Math.random());
        setNotebookProblems(shuffled.slice(0, 4));
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
      <div className="w-full min-h-screen bg-tonal-a10 px-4 sm:px-8 md:px-12 lg:px-20 py-5 flex flex-col justify-between items-stretch overflow-hidden select-none gap-6 md:gap-10">
        <div className="w-full relative bg-tonal-a20 rounded-[20px] overflow-hidden px-4 sm:px-8 md:px-12 lg:px-20 py-5 flex flex-col justify-between items-stretch gap-6 md:gap-10">
          <Review
            reviewCount={dueProblems.length}
            isLoading={isLoadingReview}
            onStart={handleStartReview}
          />
        </div>
        <div>
          <h1 className="h1 text-center">
            What problem do you want to solve today?
          </h1>
          <div className="w-full flex justify-center items-center mt-5">
            <GenerateProblem
              onGenerate={handleGenerate}
              isProcessing={isProcessing}
            />
          </div>
          {aiError && (
            <p className="text-danger-a10 text-center mt-3 p7">{aiError}</p>
          )}
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
