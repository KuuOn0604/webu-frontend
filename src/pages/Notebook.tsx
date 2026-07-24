import { useState, useEffect, useMemo } from 'react';
import { MainNavigation } from '@/components/ui/MainNavigation';
import { NotebookHeader } from '@/components/notebook/NotebookHeader';
import { NotebookFilter } from '@/components/notebook/NotebookFilter';
import { NotebookProblem } from '@/components/notebook/NotebookProblem';
import { Pagination } from '@/components/notebook/Pagination';
import { ProblemType } from '@/components/notebook/MockData';
import apiClient from '@/api/apiClient';
import { problemApi } from '@/api/problemService';
import { statsApi } from '@/api/statsService';

interface BackendCard {
  _id?: string;
  id?: string;
  title: string;
  content?: {
    description?: string;
  };
  tags?: string[];
  course?: string;
  group?: string;
  difficulty_level?: 'Easy' | 'Medium' | 'Hard';
  created_by?: string | null;
}

export const Notebook = (): JSX.Element => {
  const [problems, setProblems] = useState<ProblemType[]>([]);
  const [metaTags, setMetaTags] = useState<string[]>([]);
  const [metaGroups, setMetaGroups] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchMetaAndNotebooks = async () => {
      try {
        const meta = await problemApi.getMetaOptions();
        setMetaTags(meta.tags);
        setMetaGroups(meta.courses);

        // Pass limit=200 to fetch all problems at once for client-side filtering/pagination
        const [response, fsrsProgress, interacted] = await Promise.all([
          apiClient.get('/cards', {
            params: { limit: 200, page: 1, scope: 'user' },
          }),
          statsApi.getFsrsProgress().catch(() => []),
          statsApi.getInteractedCards().catch(() => []),
        ]);

        const data = response.data;
        const now = new Date();

        const interactedCardIds = new Set([
          ...fsrsProgress
            .filter((item: { state?: string }) => item.state !== 'new')
            .map((item: { card_id: string }) => item.card_id),
          ...interacted,
        ]);

        const suggestedCardIds = new Set(
          fsrsProgress
            .filter(
              (item: { next_review_date: string | null }) =>
                item.next_review_date && new Date(item.next_review_date) <= now,
            )
            .map((item: { card_id: string }) => item.card_id),
        );

        const token = localStorage.getItem('auth_token');
        let currentUserId = '';
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload.sub || '';
          } catch {
            // ignore
          }
        }

        const filteredData = data.data.filter((item: BackendCard) => {
          const cardId = item.id || item._id;
          if (!cardId) return false;
          const isMyCustom = item.created_by === currentUserId;
          return interactedCardIds.has(cardId) || isMyCustom;
        });

        const formattedData = filteredData.map(
          (item: BackendCard, index: number) => {
            const cardId = (item.id || item._id) as string;
            return {
              id: String(index + 1),
              dbId: cardId,
              title: item.title,
              description: item.content?.description || '',
              tags: item.tags || [],
              group: item.group || item.course || '',
              difficulty: item.difficulty_level
                ? item.difficulty_level.charAt(0).toUpperCase() +
                  item.difficulty_level.slice(1).toLowerCase()
                : 'Medium',
              isFavorite: false,
              isCustom: item.created_by === currentUserId,
              isSuggested: suggestedCardIds.has(cardId),
              isInteracted: interactedCardIds.has(cardId),
            };
          },
        );

        setProblems(formattedData);
      } catch (error) {
        console.error('Error while fetching data from the database:', error);
      }
    };

    fetchMetaAndNotebooks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTags, selectedCourses]);

  const handleDeleteProblem = async (dbId: string) => {
    if (!window.confirm('Are you sure you want to delete this custom problem?'))
      return;
    try {
      await problemApi.deleteProblem(dbId);
      setProblems((prev) => prev.filter((p) => p.dbId !== dbId));
    } catch (error) {
      console.error('Error deleting problem:', error);
      alert('Failed to delete the problem. Please try again.');
    }
  };

  const handleToggleFavorite = (id: string) => {
    setProblems((prevProblems) =>
      prevProblems.map((problem) =>
        problem.id === id
          ? { ...problem, isFavorite: !problem.isFavorite }
          : problem,
      ),
    );
  };

  const processedProblems = useMemo(() => {
    const result = problems.filter((problem) => {
      const matchSearch = problem.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => problem.tags.includes(tag));
      const matchCourses =
        selectedCourses.length === 0 || selectedCourses.includes(problem.group);
      return matchSearch && matchTags && matchCourses;
    });
    result.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    return result;
  }, [problems, searchQuery, selectedTags, selectedCourses]);

  const totalPages = Math.ceil(processedProblems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProblems = processedProblems.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  return (
    <div>
      <header className="self-stretch flex flex-row justify-start gap-10 sticky top-0 z-10">
        <MainNavigation />
      </header>

      <div className="w-full min-h-screen bg-tonal-a10 px-4 sm:px-8 md:px-16 lg:px-20 py-5 flex flex-col items-center overflow-hidden select-none gap-6 md:gap-10 pb-20">
        <div className="w-full max-w-[1400px] flex flex-col gap-6 md:gap-10 mt-5">
          <NotebookHeader />

          <NotebookFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            selectedCourses={selectedCourses}
            setSelectedCourses={setSelectedCourses}
            tagOptions={metaTags}
            courseOptions={metaGroups}
          />

          {currentProblems.length > 0 ? (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {currentProblems.map((problem) => (
                <NotebookProblem
                  key={problem.id}
                  id={problem.id}
                  dbId={problem.dbId}
                  title={problem.title}
                  description={problem.description}
                  tags={problem.tags}
                  group={problem.group}
                  difficulty={problem.difficulty}
                  isFavorite={problem.isFavorite}
                  onToggleFavorite={() => handleToggleFavorite(problem.id)}
                  isCustom={problem.isCustom}
                  isSuggested={problem.isSuggested}
                  isInteracted={problem.isInteracted}
                  onDelete={
                    problem.isCustom
                      ? () => handleDeleteProblem(problem.dbId!)
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="w-full flex justify-center items-center py-20 text-neutral-a50 p6">
              No exercises were found that match your filters.
            </div>
          )}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Notebook;
