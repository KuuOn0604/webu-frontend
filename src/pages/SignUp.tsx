import { FormEvent, useId, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { googleLogin, login, register } from '@/api/authService';
import { useAuth } from '@/contexts/AuthContext/useAuth';
import { AuthUser } from '@/contexts/AuthContext/AuthContext';
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
  const { login: contextLogin } = useAuth();

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
        const loginRes = await login(email, password);
        contextLogin(loginRes.token, loginRes.user as unknown as AuthUser);
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
        contextLogin(res.token, res.user as unknown as AuthUser);
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
        contextLogin(res.token, res.user as unknown as AuthUser);
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
        contextLogin(res.token, res.user as unknown as AuthUser);
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

          {/* Google button container */}
          <div
            className="flex w-full max-w-[710px] items-center justify-center transition-opacity"
            style={{
              opacity: googleLoading ? 0.6 : 1,
              pointerEvents: googleLoading ? 'none' : 'auto',
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="filled_black"
              shape="rectangular"
              text={activeTab === 'signup' ? 'signup_with' : 'signin_with'}
              size="large"
              width="377"
            />
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
