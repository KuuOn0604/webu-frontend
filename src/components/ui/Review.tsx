import { Button } from '@/components/ui/Button';
import { Problem } from '@/components/dashboard/Problem';
import { useNavigate } from 'react-router-dom';

export interface CompletedProblem {
  card_id: string;
  state: string;
  title: string;
  difficulty_level: string;
  tags: string[];
}

interface ReviewProps {
  reviewCount: number;
  isLoading: boolean;
  onStart: () => void;
  completedHistory?: CompletedProblem[];
}

export const Review = ({
  reviewCount,
  isLoading,
  onStart,
  completedHistory,
}: ReviewProps): JSX.Element => {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="w-full bg-tonal-a20 rounded-[20px] p-6 flex flex-col items-center justify-center">
        <p className="text-white animate-pulse">Loading learning data...</p>
      </div>
    );
  }

  if (reviewCount === 0) {
    return (
      <div className="w-full bg-tonal-a20 rounded-[20px] p-6 flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-white h2">Great! 🎉</h2>
          <p className="text-neutral-400 p4 text-center">
            You have successfully completed today's review goal.
          </p>
        </div>

        {completedHistory && completedHistory.length > 0 && (
          <div className="w-full max-w-[580px] flex flex-col gap-4 mt-2">
            <h3 className="text-secondary-a50 h5 self-start">
              Your Submitted Work
            </h3>
            <div className="flex flex-col gap-4 w-full max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
              {completedHistory.map((p) => (
                <Problem
                  key={p.card_id}
                  difficulty={p.difficulty_level as 'Easy' | 'Medium' | 'Hard'}
                  tags={p.tags || []}
                  title={p.title}
                  onReviewClick={() => navigate(`/problems/${p.card_id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-tonal-a20 rounded-[20px] p-6 flex flex-col md:flex-row items-center justify-between overflow-hidden">
      <div className="flex flex-col gap-3 flex-1 min-w-0 w-full md:w-auto">
        <h2 className="text-white h2 truncate">It's time to review! 🔥</h2>

        <div className="flex flex-wrap gap-2 mt-1">
          <p className="text-neutral-300 p4">
            The FSRS system is ready.{' '}
            <span className="text-secondary-a50 font-bold">
              {reviewCount} exercise
            </span>{' '}
            needs to be reviewed to optimize your memory.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-20 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
        <div className="">
          <Button
            className="text-neutral-a50 h3 font-medium cursor-pointer"
            onClick={onStart}
          >
            Review Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Review;
