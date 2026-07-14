import { FormEvent, useId, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { googleLogin, login, register, saveAuthToken } from '@/api/authService';
import { LinkAccountModal } from '@/components/ui/LinkAccountModal';

type FormField = {
  id: 'email' | 'username' | 'password' | 'confirmPassword';
  label: string;
  type: 'email' | 'text' | 'password';
  autoComplete: string;
};

const signUpFields: FormField[] = [
  { id: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { id: 'username', label: 'Username', type: 'text', autoComplete: 'username' },
  {
    id: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'new-password',
  },
  {
    id: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    autoComplete: 'new-password',
  },
];

const signInFields: FormField[] = [
  { id: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  {
    id: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'current-password',
  },
];

export const SignUp = (): JSX.Element => {
  const formId = useId();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active tab directly from URL pathname
  const activeTab = location.pathname.startsWith('/signin')
    ? 'signin'
    : 'signup';
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  // Loading / error state cho form thường
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Google OAuth state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Branch B: link account modal state
  const [linkModal, setLinkModal] = useState<{
    visible: boolean;
    email: string;
    idToken: string;
  }>({ visible: false, email: '', idToken: '' });
  const [linkLoading, setLinkLoading] = useState(false);

  // ─── Computed fields dựa theo activeTab ───────────────────────────────
  const fields =
    activeTab === 'signup'
      ? signUpFields
      : (signInFields as unknown as FormField[]);

  // ─── Form Submit (register / login thường) ────────────────────────────
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { email, username, password, confirmPassword } = formData;
    setFormError('');

    if (activeTab === 'signup') {
      if (!email.trim() || !username.trim() || !password || !confirmPassword) {
        setFormError('Vui lòng nhập đầy đủ tất cả các trường!');
        return;
      }
      if (!email.includes('@')) {
        setFormError('Email không hợp lệ!');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Mật khẩu xác nhận không khớp!');
        return;
      }

      setIsLoading(true);
      try {
        await register(username, email, password);
        // Auto-login sau khi đăng ký để lấy JWT token
        const loginRes = await login(email, password);
        saveAuthToken(loginRes.token);
        navigate('/survey');
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Đăng ký thất bại. Vui lòng thử lại.';
        setFormError(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email.trim() || !password) {
        setFormError('Vui lòng nhập đầy đủ Email và Mật khẩu!');
        return;
      }
      if (!email.includes('@')) {
        setFormError('Email không hợp lệ!');
        return;
      }

      setIsLoading(true);
      try {
        const res = await login(email, password);
        saveAuthToken(res.token);
        navigate('/dashboard');
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Email hoặc mật khẩu không chính xác.';
        setFormError(msg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ─── Google Sign-In ────────────────────────────────────────────────────
  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    const idToken = credentialResponse.credential;
    if (!idToken) return;

    setGoogleError('');
    setGoogleLoading(true);
    try {
      const res = await googleLogin(idToken);

      if (res.requirePassword && res.email) {
        // Branch B: tài khoản email đã tồn tại → hiện modal nhập password
        setLinkModal({ visible: true, email: res.email, idToken });
        return;
      }

      if (res.token) {
        // Branch A hoặc C: đăng nhập thành công
        saveAuthToken(res.token);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Đăng nhập Google thất bại.';
      setGoogleError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleError('Đăng nhập Google thất bại. Vui lòng thử lại.');
  };

  // ─── Link Account (Branch B confirm) ──────────────────────────────────
  const handleLinkConfirm = async (password: string) => {
    setLinkLoading(true);
    try {
      const res = await googleLogin(linkModal.idToken, password);
      if (res.token) {
        saveAuthToken(res.token);
        setLinkModal({ visible: false, email: '', idToken: '' });
        navigate('/dashboard');
      }
    } finally {
      setLinkLoading(false);
    }
  };

  const handleLinkCancel = () => {
    setLinkModal({ visible: false, email: '', idToken: '' });
  };

  // ─── Tab click (chỉ chuyển tab, KHÔNG submit) ────────────────────────
  const handleTabClick = (tab: 'signup' | 'signin') => {
    if (activeTab !== tab) {
      setFormError('');
      setGoogleError('');
      navigate(tab === 'signin' ? '/signin' : '/signup');
    }
  };

  return (
    <>
      {/* Branch B modal */}
      {linkModal.visible && (
        <LinkAccountModal
          email={linkModal.email}
          onConfirm={handleLinkConfirm}
          onCancel={handleLinkCancel}
          isLoading={linkLoading}
        />
      )}

      <main className="w-full min-h-screen flex flex-col items-center justify-center bg-[#0a1222] px-4 py-10 select-none">
        {/* Title */}
        <header className="flex justify-center items-center">
          <h1 className="text-[#e0e0e0] p3 sm:p2 md:p1 lg:h00 whitespace-nowrap">
            {activeTab === 'signup' ? 'Sign Up' : 'Sign In'}
          </h1>
        </header>

        {/* Form */}
        <form
          id={formId}
          onSubmit={handleSubmit}
          className={`flex w-full max-w-[710px] h-auto relative mt-8 sm:mt-[60px] flex-col items-center gap-6 sm:gap-[60px] transition-all duration-300 ${
            activeTab === 'signup' ? 'min-h-[404px]' : 'min-h-[172px]'
          }`}
        >
          {fields.map((field) => {
            const inputId = `${formId}-${field.id}`;

            return (
              <div key={field.id} className="relative self-stretch w-full">
                <div className="relative w-full h-14 bg-surface-tonal-tonal-a10 rounded-[10px] overflow-hidden border border-solid border-surface-tonal-tonal-a0 shadow-[1px_4px_4px_#0c24ac]">
                  <input
                    id={inputId}
                    name={field.id}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    aria-label={field.label}
                    placeholder=" "
                    value={formData[field.id as keyof typeof formData]}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        [field.id]: event.target.value,
                      }))
                    }
                    disabled={isLoading}
                    className="peer absolute inset-0 z-10 h-full w-full rounded-[10px] px-6 pt-[18px] pb-2 p7 text-neutral-neutral-a50 caret-secondary-secondary-a70 bg-transparent border-0 outline-none disabled:opacity-50"
                  />
                  <label
                    htmlFor={inputId}
                    className="absolute top-[19px] left-6 p7 text-neutral-neutral-a50 whitespace-nowrap pointer-events-none transition-opacity duration-150 peer-placeholder-shown:opacity-100 opacity-0"
                  >
                    {field.label}
                  </label>
                </div>

                {activeTab === 'signin' && field.id === 'password' && (
                  <div className="absolute right-0 mt-2">
                    <a
                      href="#forgot-password"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/forget-password');
                      }}
                      className="text-neutral-neutral-a50/60 hover:text-secondary-secondary-a70 transition-colors p8 underline cursor-pointer"
                    >
                      Forget Password
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </form>

        {/* Form error */}
        {formError && (
          <p className="mt-4 p8 text-red-400 text-center" role="alert">
            {formError}
          </p>
        )}

        {/* Divider + Google button */}
        <div className="flex flex-col items-center gap-4 mt-8 w-full max-w-[710px]">
          {/* Divider */}
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px bg-surface-tonal-tonal-a0" />
            <span className="text-neutral-neutral-a50/60 p9 whitespace-nowrap">
              OR
            </span>
            <div className="flex-1 h-px bg-surface-tonal-tonal-a0" />
          </div>

          {/* Custom Google button container with hidden-overlay trigger */}
          <div
            className="relative overflow-hidden flex h-14 w-full max-w-[710px] items-center justify-center gap-2.5 rounded-[10px] border border-solid border-secondary-secondary-a70 bg-surface-tonal-tonal-a20 p-2.5 shadow-[0px_4px_12px_rgba(0,0,0,0.35),0px_2px_0px_#4ca3ff] transition-all hover:brightness-110 active:brightness-95"
            style={{
              opacity: googleLoading ? 0.6 : 1,
              pointerEvents: googleLoading ? 'none' : 'auto',
            }}
          >
            {/* Google Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>

            {/* Button Text */}
            <span className="relative w-fit p5 text-secondary-secondary-a70 [text-shadow:0px_0px_8px_rgba(76,163,255,0.35)]">
              {activeTab === 'signup'
                ? 'Sign Up with Google'
                : 'Sign In with Google'}
            </span>

            {/* Invisible GoogleLogin overlay (scaled up to cover the 710px width) */}
            <div className="absolute inset-0 z-20 cursor-pointer opacity-0 scale-[3] flex items-center justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
              />
            </div>
          </div>

          {/* Google error */}
          {googleError && (
            <p className="p8 text-red-400 text-center" role="alert">
              {googleError}
            </p>
          )}

          {/* Loading indicator */}
          {googleLoading && (
            <p className="p8 text-neutral-neutral-a50">Đang xử lý...</p>
          )}
        </div>

        {/* Tab bar — chỉ chuyển tab, không submit */}
        <nav
          aria-label="Authentication pages"
          className="inline-flex w-full max-w-[377px] h-16 relative mt-10 items-center justify-between p-1.5 rounded-full bg-surface-tonal-tonal-a10 border border-solid border-surface-tonal-tonal-a0"
        >
          <button
            id="btn-signup"
            type="button"
            onClick={() => handleTabClick('signup')}
            disabled={isLoading || googleLoading}
            className={`flex-1 h-full inline-flex items-center justify-center relative rounded-full cursor-pointer transition-all duration-300 border-0 ${
              activeTab === 'signup'
                ? 'bg-secondary-secondary-a90 text-secondary-secondary-a30 shadow-md'
                : 'bg-transparent text-neutral-neutral-a50 hover:text-white'
            } disabled:opacity-50`}
          >
            <span className="relative w-fit p5 text-inherit">Sign Up</span>
          </button>

          <button
            id="btn-signin"
            type="button"
            onClick={() => handleTabClick('signin')}
            disabled={isLoading || googleLoading}
            className={`flex-1 h-full inline-flex items-center justify-center relative rounded-full cursor-pointer transition-all duration-300 border-0 ${
              activeTab === 'signin'
                ? 'bg-secondary-secondary-a90 text-secondary-secondary-a30 shadow-md'
                : 'bg-transparent text-neutral-neutral-a50 hover:text-white'
            } disabled:opacity-50`}
          >
            <span className="relative w-fit text-neutral-neutral-a50 p5 text-inherit">
              Sign In
            </span>
          </button>
        </nav>

        {/* Confirm Submit Button */}
        <div className="flex justify-center w-full max-w-[377px] mt-4">
          <button
            id="btn-confirm-submit"
            type="submit"
            form={formId}
            disabled={isLoading || googleLoading}
            className="w-full h-14 inline-flex items-center justify-center rounded-lg bg-secondary-secondary-a70 text-white h4 shadow-[0px_4px_16px_rgba(76,163,255,0.4)] transition-all duration-200 hover:brightness-110 hover:shadow-[0px_6px_20px_rgba(76,163,255,0.6)] active:brightness-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? 'Đang xử lý...'
              : activeTab === 'signin'
                ? 'Confirm'
                : 'Confirm'}
          </button>
        </div>
      </main>
    </>
  );
};

export default SignUp;
