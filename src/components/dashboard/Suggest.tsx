import { useNavigate } from 'react-router-dom';
import { ExpandIcon } from '@/components/ui/ExpandIcon';
import { Problem } from '@/components/dashboard/Problem';

interface SuggestProps {
  onExpandClick?: () => void;
  onReviewClick?: () => void;
  title?: string;
  problems?: {
    id: string;
    title: string;
    difficulty: string;
    tags: string[];
  }[];
}

export const Suggest = ({
  onExpandClick,
  title = '',
  problems = [],
}: SuggestProps): JSX.Element => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[580px] min-h-140 p-6 md:p-8 bg-tonal-a20 rounded-[10px] flex flex-col gap-8">
      <div className="flex justify-between items-center w-full gap-8">
        <h2 className="text-secondary-a50 h2 m-0">{title}</h2>
        <div
          className="w-8 h-9 flex items-center justify-center cursor-pointer rounded-sm"
          onClick={onExpandClick}
        >
          <ExpandIcon />
        </div>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {problems.length > 0 ? (
          problems
            .slice(0, 3)
            .map((p) => (
              <Problem
                key={p.id}
                difficulty={p.difficulty as 'Easy' | 'Medium' | 'Hard'}
                tags={p.tags.slice(0, 3)}
                title={p.title}
                onReviewClick={() => navigate(`/problems/${p.id}`)}
              />
            ))
        ) : (
          <p className="text-neutral-a400 p8 text-center mt-4">
            Không có bài tập nào.
          </p>
        )}
      </div>
    </div>
  );
};

export default Suggest;
