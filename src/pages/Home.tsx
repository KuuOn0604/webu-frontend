import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import HomePageImage from '@/assets/HomePageImage.png';
import { useNavigate } from 'react-router-dom';

export const Home = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-tonal-a0 px-4 sm:px-8 md:px-16 lg:px-30 py-6 flex flex-col justify-between items-stretch overflow-hidden select-none">
      <header className="self-stretch flex flex-row justify-start items-center gap-3 sm:gap-6 md:gap-10 flex-wrap">
        <Logo />
        <span className="text-discovery-a50 text-sm sm:text-base md:h6 lg:h4 font-['Nadoor'] font-bold italic tracking-normal">
          W.E.B.U - Web Engineering of BackKhoa University
        </span>
      </header>

      <main className="self-stretch flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col justify-center items-start gap-4 my-8 md:my-12">
          <h1 className="text-neutral-a50 text-2xl sm:text-3xl md:text-4xl lg:h1 font-extrabold font-['SFU_Futura'] tracking-normal leading-tight uppercase my-4 md:my-6">
            FSRS Code Learning Platform
          </h1>
          <div className="text-neutral-a50 text-sm sm:text-base md:h6 font-bold font-['SFU_Futura'] tracking-normal opacity-90 italic flex flex-col gap-3 md:gap-5">
            <span>Get personalized learning track </span>
            <span>Remind you everyday</span>
          </div>

          <div className="w-auto my-4 md:my-6">
            <Button
              className="px-6 sm:px-10 py-2.5 rounded-[20px] outline -outline-offset-1 outline-secondary-a90 text-base sm:h4"
              onClick={() => {
                navigate('/signup');
              }}
            >
              Get Started →
            </Button>
          </div>

          <button
            type="button"
            className="text-neutral-a50 text-base sm:text-xl font-bold font-['SFU_Futura'] underline cursor-pointer hover:text-secondary-a50 transition-colors opacity-40"
          >
            About US
          </button>
        </div>
        <div className="flex-1 flex justify-center items-center mt-6 md:mt-0">
          <img
            src={HomePageImage}
            alt="Home Page"
            className="w-full h-auto max-w-full object-contain max-h-[50vh] md:max-h-none"
          />
        </div>{' '}
      </main>

      <footer className="self-stretch flex flex-wrap justify-center items-center gap-6 sm:gap-12 md:gap-20 lg:gap-32 border-t border-solid border-tonal-a20 pt-6 md:pt-8 overflow-hidden">
        <div className="h-12 flex justify-start items-center gap-3 sm:gap-5">
          <div className="w-4 h-3 bg-neutral-a50 rounded-sm" />
          <span className="text-neutral-a50 text-xs font-normal font-['UTM_Neo_Sans_Intel'] whitespace-nowrap">
            discord.gg/webu
          </span>
        </div>

        <div className="h-12 flex justify-start items-center gap-3 sm:gap-5">
          <div className="w-5 h-4 bg-neutral-a50 rounded-sm" />
          <span className="text-neutral-a50 text-xs font-normal font-['UTM_Neo_Sans_Intel'] whitespace-nowrap">
            webu@gmail.com
          </span>
        </div>

        <div className="h-12 flex justify-start items-center gap-3 sm:gap-5">
          <div className="w-2.5 h-4 bg-neutral-a50 rounded-sm" />
          <span className="text-neutral-a50 text-xs font-normal font-['UTM_Neo_Sans_Intel'] whitespace-nowrap">
            facebook.com/webu
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
