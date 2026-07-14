import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const questions = [
  {
    text: 'Bạn đã học lập trình được bao lâu?',
    options: [
      { id: 'duoi-6-thang', label: 'Dưới 6 tháng' },
      { id: 'duoi-1-nam', label: 'Dưới 1 năm' },
      { id: 'tu-1-den-2-nam', label: 'Từ 1 đến 2 năm' },
      { id: 'tren-2-nam', label: 'Trên 2 năm' },
    ],
  },
  {
    text: 'Trình độ lập trình hiện tại của bạn?',
    options: [
      { id: 'beginner', label: 'Beginner — Mới bắt đầu' },
      { id: 'intermediate', label: 'Intermediate — Đã biết cơ bản' },
      { id: 'advanced', label: 'Advanced — Có kinh nghiệm thực tế' },
      { id: 'expert', label: 'Expert — Senior / Chuyên gia' },
    ],
  },
  {
    text: 'Mục tiêu học lập trình của bạn là gì?',
    options: [
      { id: 'di-lam', label: 'Tìm việc làm / Đi làm' },
      { id: 'freelance', label: 'Làm freelance' },
      { id: 'du-an-ca-nhan', label: 'Xây dựng dự án cá nhân' },
      { id: 'hoc-thuat', label: 'Nghiên cứu / Học thuật' },
    ],
  },
  {
    text: 'Bạn muốn tập trung vào lĩnh vực nào?',
    options: [
      { id: 'thuat-toan', label: 'Thuật toán & Cấu trúc dữ liệu' },
      { id: 'web-frontend', label: 'Web Frontend' },
      { id: 'backend', label: 'Backend / API' },
      { id: 'fullstack', label: 'Full-stack Development' },
    ],
  },
];

const RadioIcon = ({ checked }: { checked: boolean }) => (
  <svg
    className={`w-6 h-6 shrink-0 transition-all duration-200 ${
      checked ? 'text-secondary-secondary-a90' : 'text-neutral-neutral-a50/40'
    }`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <circle cx="12" cy="12" r="10" />
    {checked && <circle cx="12" cy="12" r="5" fill="currentColor" />}
  </svg>
);

export const Survey = (): JSX.Element => {
  const groupId = useId();
  const navigate = useNavigate();

  // step tracks current question index: 1, 2, 3, 4
  const [step, setStep] = useState(1);

  // Track selected options for each step separately
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, string>
  >({
    1: questions[0].options[0].id,
    2: questions[1].options[0].id,
    3: questions[2].options[0].id,
    4: questions[3].options[0].id,
  });

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/signup');
    }
  };

  const handleNext = () => {
    console.log(`Step ${step} answered:`, selectedOptions[step]);
    if (step < 4) {
      setStep(step + 1);
    } else {
      console.log('Survey completed, answers:', selectedOptions);
      navigate('/dashboard');
    }
  };

  // Dynamically calculate progress percentage (25%, 50%, 75%, 100%)
  const progressPercent = step * 25;

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center bg-[#0a1222] px-4 py-10 select-none">
      <section
        className="w-full max-w-[830px] h-[878px] relative"
        aria-labelledby={`${groupId}-title`}
      >
        {/* Title */}
        <h1
          id={`${groupId}-title`}
          className="absolute top-[7px] left-[calc(50%_-_120px)] w-[239px] text-center h00 text-[#f2f2f2]"
        >
          Survey
        </h1>

        <div
          className="flex w-[calc(100%_-_253px)] md:w-[577px] h-[66px] items-center justify-center gap-5 absolute top-[136px] left-[120px]"
          aria-label="Survey progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div className="relative flex-1 grow bg-[#ddeeff] rounded-[100px] overflow-hidden border border-solid border-neutral-neutral-a800 h-6">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-[#8bc5ff] rounded-[100px] transition-all duration-300"
            />
          </div>
        </div>

        {/* Question Text */}
        <p className="absolute w-[calc(100%_-_253px)] top-[271px] left-[120px] p5 text-[#8bc5ff]">
          Question {step}: {questions[step - 1].text}
        </p>

        {/* Radio Options List */}
        <fieldset className="flex flex-col w-[calc(100%_-_254px)] items-start gap-10 absolute top-[360px] left-[121px] border-0 p-0 m-0 min-w-0">
          <legend className="sr-only">{questions[step - 1].text}</legend>
          {questions[step - 1].options.map((option) => {
            const inputId = `${groupId}-${option.id}`;
            const checked = selectedOptions[step] === option.id;

            return (
              <label
                key={option.id}
                htmlFor={inputId}
                className={`h-[63px] px-6 gap-4 self-stretch w-full rounded border border-solid flex items-center relative cursor-pointer transition-colors duration-200 ${
                  checked
                    ? 'border-secondary-secondary-a90 bg-surface-tonal-tonal-a20'
                    : 'border-surface-tonal-tonal-a0 bg-surface-tonal-tonal-a10 hover:border-secondary-secondary-a50'
                }`}
              >
                <input
                  id={inputId}
                  type="radio"
                  name={`${groupId}-${step}`}
                  value={option.id}
                  checked={checked}
                  onChange={() =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [step]: option.id,
                    }))
                  }
                  className="sr-only"
                />
                <RadioIcon checked={checked} />
                <span className="justify-center w-fit p5 text-[#8bc5ff] text-center flex items-center relative">
                  {option.label}
                </span>
              </label>
            );
          })}
        </fieldset>

        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="flex w-[212px] h-12 items-center justify-center gap-2.5 p-2.5 absolute top-[772px] left-[121px] bg-surface-tonal-tonal-a20 rounded-[10px] border border-solid border-secondary-secondary-a70 cursor-pointer hover:bg-surface-tonal-tonal-a30 transition-colors"
          aria-label="Back"
        >
          <span className="relative w-fit h6 text-secondary-secondary-a70 whitespace-nowrap">
            Back
          </span>
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          className="flex w-[212px] h-12 items-center justify-center gap-2.5 p-2.5 absolute top-[772px] left-[calc(100%_-_333px)] md:left-[485px] bg-surface-tonal-tonal-a20 rounded-[10px] border border-solid border-secondary-secondary-a70 cursor-pointer hover:bg-surface-tonal-tonal-a30 transition-colors"
          aria-label="Next"
        >
          <span className="relative w-fit h6 text-secondary-secondary-a70 whitespace-nowrap">
            {step < 4 ? 'Next' : 'Finish'}
          </span>
        </button>
      </section>
    </main>
  );
};

export default Survey;
