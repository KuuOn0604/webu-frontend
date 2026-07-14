import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Editor, { OnMount } from '@monaco-editor/react';
import SelectDropdown from '@/components/ui/SelectDropdown';
import ChipBoard from '@/components/ui/ChipBoard';
import { Button } from '@/components/ui/Button';
import OverlayLoader from '@/components/ui/OverlayLoader';
import type { AiGeneratedProblem } from '@/types/problem';
import { problemApi } from '@/api/problemService';

const BOILERPLATE_TEMPLATES = {
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your C++20 code here\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        // Your Java 17 code here\n    }\n}`,
  python: `def main():\n    # Your Python 3 code here\n    pass\n\nif __name__ == '__main__':\n    main()`,
  typescript: `function main() {\n    // Your TypeScript code here\n}\n\nmain();`,
};

type LanguageType = keyof typeof BOILERPLATE_TEMPLATES;

const LANGUAGE_DISPLAY_NAMES: Record<LanguageType, string> = {
  cpp: 'C++20',
  java: 'Java 17',
  python: 'Python 3',
  typescript: 'TypeScript',
};

export const CreateProblem = (): JSX.Element => {
  const [name, setName] = useState('');
  const [chips, setChips] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [selectedLang, setSelectedLang] = useState<LanguageType>('cpp');
  const [boilerplate, setBoilerplate] = useState(BOILERPLATE_TEMPLATES);
  const [code, setCode] = useState(BOILERPLATE_TEMPLATES.cpp);
  // loadingMessage: chuỗi rỗng nghĩa là không loading; chuỗi có nội dung = đang xử lý
  const [loadingMessage, setLoadingMessage] = useState('');

  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [difficultyOptions, setDifficultyOptions] = useState<string[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  const handleEditorMount: OnMount = (_editor, monaco) => {
    monaco.editor.defineTheme('webu-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7a99', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c8dff' },
        { token: 'string', foreground: '7dd3a8' },
        { token: 'number', foreground: 'f0a070' },
        { token: 'type', foreground: '65d9ef' },
        { token: 'function', foreground: 'dcdcaa' },
      ],
      colors: {
        'editor.background': '#0a0f1a',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#3a4560',
        'editorLineNumber.activeForeground': '#6b7a99',
        'editor.selectionBackground': '#3b4f7033',
        'editor.lineHighlightBackground': '#131d2e',
        'editorCursor.foreground': '#7c8dff',
        'editor.inactiveSelectionBackground': '#2a3548',
        'scrollbarSlider.background': '#1e2c44',
        'scrollbarSlider.hoverBackground': '#2a3d5a',
        'editorIndentGuide.background1': '#1e2840',
        'editorBracketMatch.background': '#3b4f7066',
        'editorBracketMatch.border': '#7c8dff',
      },
    });
    monaco.editor.setTheme('webu-dark');
  };

  useEffect(() => {
    problemApi
      .getMetaOptions()
      .then((data) => {
        setTagOptions(data.tags);
        setCourseOptions(data.courses);
        setDifficultyOptions(data.difficulties);
      })
      .catch((err) => {
        console.error('Failed to fetch metadata options:', err);
      });
  }, []);

  const { aiProblem } =
    (location.state as { aiProblem?: AiGeneratedProblem }) || {};

  const hasAppliedAiProblem = useRef(false);

  useEffect(() => {
    if (!aiProblem || hasAppliedAiProblem.current) return;
    hasAppliedAiProblem.current = true;

    setName(aiProblem.title || '');
    setDescription(aiProblem.description || '');

    const initialBoilerplates = {
      cpp: aiProblem.boilerplateCode?.cpp || BOILERPLATE_TEMPLATES.cpp,
      java: aiProblem.boilerplateCode?.java || BOILERPLATE_TEMPLATES.java,
      python: aiProblem.boilerplateCode?.python || BOILERPLATE_TEMPLATES.python,
      typescript:
        aiProblem.boilerplateCode?.typescript ||
        BOILERPLATE_TEMPLATES.typescript,
    };
    setBoilerplate(initialBoilerplates);
    setCode(initialBoilerplates[selectedLang]);

    if (aiProblem.difficulty) {
      const diffFormatted =
        aiProblem.difficulty.charAt(0).toUpperCase() +
        aiProblem.difficulty.slice(1).toLowerCase();
      addChip('Difficulty', diffFormatted);
    }

    if (aiProblem.course) {
      addChip('Course', aiProblem.course);
    }

    if (aiProblem.tags && aiProblem.tags.length > 0) {
      aiProblem.tags.forEach((tag) => addChip('Tag', tag));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiProblem]);

  const addChip = (prefix: string, value: string) => {
    const chip = `${prefix}: ${value}`;

    setChips((prev) => {
      if (prev.includes(chip)) return prev;

      if (prefix === 'Tag') {
        return [...prev, chip];
      }

      const withoutSamePrefix = prev.filter(
        (c) => !c.startsWith(`${prefix}: `),
      );
      return [...withoutSamePrefix, chip];
    });
  };

  const removeChip = (chip: string) => {
    setChips((prev) => prev.filter((c) => c !== chip));
  };

  const handleLanguageChange = (lang: LanguageType) => {
    setSelectedLang(lang);
    setCode(boilerplate[lang]);
  };

  const handleLanguageSelect = (displayName: string) => {
    const langKey = Object.keys(LANGUAGE_DISPLAY_NAMES).find(
      (key) => LANGUAGE_DISPLAY_NAMES[key as LanguageType] === displayName,
    ) as LanguageType;
    if (langKey) {
      setBoilerplate((prev) => ({
        ...prev,
        [selectedLang]: code,
      }));
      handleLanguageChange(langKey);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng điền tên bài tập.');
      return;
    }
    if (!description.trim()) {
      toast.error('Vui lòng điền mô tả bài tập.');
      return;
    }

    let testcases: {
      input: string;
      expected_output: string;
      is_hidden: boolean;
    }[] = [];

    // Bước 1: Gọi AI tạo testcase
    setLoadingMessage('AI đang tạo testcase...');
    try {
      testcases = await problemApi.generateTestCases(name, description);
    } catch (aiErr) {
      console.warn('Lỗi AI generateTestCases:', aiErr);
      toast(
        'AI không thể tạo testcase. Bài tập sẽ được lưu không kèm testcase.',
        {
          icon: '⚠️',
          duration: 5000,
        },
      );
    }

    // Bước 2: Tách dữ liệu từ Chips
    const tags: string[] = [];
    let course = '';
    let difficulty_level = 'Medium';

    chips.forEach((chip) => {
      const parts = chip.split(': ');
      if (parts.length === 2) {
        const prefix = parts[0];
        const value = parts[1];
        if (prefix === 'Tag') {
          tags.push(value);
        } else if (prefix === 'Course') {
          course = value;
        } else if (prefix === 'Difficulty') {
          difficulty_level = value;
        }
      }
    });

    const finalBoilerplates = {
      ...boilerplate,
      [selectedLang]: code,
    };

    // Bước 3: Tạo problem trong DB
    setLoadingMessage('Đang lưu bài tập...');
    try {
      const savedCard = await problemApi.createProblem({
        title: name,
        difficulty_level: difficulty_level.toLowerCase(),
        tags,
        course,
        description,
        boilerplate_code: finalBoilerplates,
        testcases,
      });

      toast.success('Bài tập đã được tạo thành công!');

      // Bước 4: Điều hướng tới IDE của bài tập mới tạo
      const cardId = savedCard._id || savedCard.id;
      navigate(`/problems/${cardId}`);
    } catch (err) {
      console.error('Lỗi khi tạo bài tập:', err);
      toast.error('Không thể lưu bài tập. Vui lòng thử lại.');
    } finally {
      setLoadingMessage('');
    }
  };

  return (
    <div className="w-full min-h-screen bg-tonal-a0 px-30 py-20 flex flex-col justify-between items-stretch overflow-hidden select-none">
      {/* Overlay khóa màn hình khi đang xử lý tác vụ nặng */}
      <OverlayLoader isOpen={loadingMessage !== ''} message={loadingMessage} />
      <div className="bg-tonal-a20 w-full rounded-lg flex flex-col px-30 py-10 gap-10 relative">
        <h1 className="text-neutral-a50 h1 text-center tracking-normal leading-tight uppercase">
          CREATING NEW PROBLEM
        </h1>

        <div className="flex items-center gap-4">
          <label htmlFor="problem-name" className="text-neutral-a50 h4">
            Name:
          </label>
          <input
            id="problem-name"
            type="text"
            placeholder="Enter problem name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-2 bg-secondary-a10 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black p4"
          />
        </div>

        <div className="flex gap-10">
          <SelectDropdown
            label="Select Tag"
            options={tagOptions}
            onSelect={(value) => addChip('Tag', value)}
          />
          <SelectDropdown
            label="Select Course"
            options={courseOptions}
            onSelect={(value) => addChip('Course', value)}
          />
          <SelectDropdown
            label="Select Difficulty"
            options={difficultyOptions}
            onSelect={(value) => addChip('Difficulty', value)}
          />
        </div>

        <ChipBoard tags={chips} onRemove={removeChip} />

        <div className="flex flex-col gap-2">
          <label htmlFor="problem-description" className="text-neutral-a50 h4">
            Problem Description:
          </label>
          <textarea
            id="problem-description"
            placeholder="Enter problem description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="px-4 py-2 bg-secondary-a10 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black p4 whitespace-pre-wrap min-h-[150px]"
            rows={8}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label htmlFor="code-editor" className="text-neutral-a50 h4">
              Code Editor:
            </label>
            <SelectDropdown
              label={LANGUAGE_DISPLAY_NAMES[selectedLang]}
              options={Object.values(LANGUAGE_DISPLAY_NAMES)}
              onSelect={handleLanguageSelect}
            />
          </div>
          <div className="border border-white/10 rounded-lg overflow-hidden bg-[#0a0f1a] p-2">
            <Editor
              height="350px"
              language={selectedLang}
              theme="webu-dark"
              value={code}
              onChange={(val) => setCode(val ?? '')}
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 12, bottom: 12 },
                lineNumbersMinChars: 3,
              }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center w-full mt-6">
          <Button
            className="w-fit flex items-center justify-center rounded-lg border-2 border-secondary-a70 px-6 py-2 h2 text-center"
            onClick={() => {
              navigate('/notebook');
            }}
          >
            Cancel
          </Button>
          <Button
            isProcessing={loadingMessage !== ''}
            type="button"
            className="w-fit flex items-center justify-center rounded-lg border-2 border-secondary-a70 px-6 py-2 h2 text-center"
            onClick={() => {
              void handleCreate();
            }}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateProblem;
