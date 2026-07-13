import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import Tab from '@/components/ui/Tab';
import UserIcon from '@/components/ui/UserIcon';
import { useNavigate, useLocation } from 'react-router-dom';

export const MainNavigation = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Determine active tab from current URL pathname
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/problem')) return 'PROBLEM';
    if (path.startsWith('/notebook')) return 'NOTEBOOK';
    if (path.startsWith('/stats')) return 'STATS';
    return 'DASHBOARD';
  };

  const activeTab = getActiveTab();

  const navItems = [
    { label: 'DASHBOARD', path: '/dashboard' },
    { label: 'PROBLEM', path: '/problem' },
    { label: 'NOTEBOOK', path: '/notebook' },
    { label: 'STATS', path: '/stats' },
  ] as const;

  const handleNavClick = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    navigate('/signin');
  };

  return (
    <div className="w-full bg-tonal-a10 rounded-[5px] flex flex-col justify-start items-start relative">
      {/* Main header bar */}
      <div className="self-stretch h-16 md:h-28 px-4 md:px-8 bg-tonal-a0 flex flex-row justify-between items-center overflow-hidden">
        {/* Logo */}
        <div
          className="flex items-center justify-start px-2 md:px-10 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <Logo />
        </div>

        {/* Desktop tab bar — hidden below md */}
        <div className="hidden md:flex items-center gap-2 h-full">
          {navItems.map(({ label, path }) => (
            <Tab
              key={label}
              isActive={activeTab === label}
              onClick={() => handleNavClick(path)}
            >
              {label}
            </Tab>
          ))}
        </div>

        {/* Right side: UserIcon + Sign Out + hamburger */}
        <div className="flex items-center gap-3">
          <UserIcon />

          {/* Sign Out Button */}
          <button
            id="sign-out-btn"
            type="button"
            onClick={handleSignOut}
            title="Sign Out"
            className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-danger-a0/40 bg-danger-a0/10 text-danger-a10 hover:bg-danger-a0 hover:text-white hover:border-danger-a0 hover:shadow-[0_0_16px_rgba(214,61,61,0.45)] active:scale-95 transition-all duration-200 cursor-pointer select-none"
          >
            {/* Icon */}
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
              />
            </svg>
            {/* Label — hidden on small screens */}
            <span className="hidden sm:inline text-xs font-bold tracking-widest uppercase">
              Sign Out
            </span>
          </button>

          {/* Hamburger button — visible only below md */}
          <button
            id="nav-hamburger"
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden flex flex-col justify-center items-center gap-[5px] w-9 h-9 rounded-lg bg-tonal-a20 hover:bg-tonal-a30 transition-colors cursor-pointer border-0 p-2"
          >
            <span
              className={`block w-5 h-0.5 bg-neutral-a50 rounded transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[6px]' : ''}`}
            />
            <span
              className={`block w-5 h-0.5 bg-neutral-a50 rounded transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`}
            />
            <span
              className={`block w-5 h-0.5 bg-neutral-a50 rounded transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu — rendered via portal-like fixed overlay */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          {/* Menu panel — fixed so it escapes any overflow:hidden ancestor */}
          <div
            className="md:hidden fixed left-0 right-0 z-50 bg-tonal-a0 border-t border-tonal-a20 flex flex-col py-2 shadow-xl"
            style={{ top: '64px' }}
          >
            {navItems.map(({ label, path }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleNavClick(path)}
                className={`w-full text-left px-6 py-4 text-sm font-bold tracking-widest transition-colors cursor-pointer border-0 ${
                  activeTab === label
                    ? 'text-secondary-a70 bg-tonal-a20 border-l-4 border-secondary-a70'
                    : 'text-neutral-a300 hover:text-neutral-a50 hover:bg-tonal-a20'
                }`}
              >
                {label}
              </button>
            ))}
            {/* Sign Out row in mobile menu */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-left px-6 py-4 text-sm font-bold tracking-widest transition-colors cursor-pointer border-0 text-danger-a10 hover:text-white hover:bg-danger-a0/20 flex items-center gap-3"
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                />
              </svg>
              SIGN OUT
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MainNavigation;
