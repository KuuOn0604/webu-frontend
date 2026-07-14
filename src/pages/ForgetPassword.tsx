import React, { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ForgetPassword = (): JSX.Element => {
  const emailId = useId();
  const verificationId = useId();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
  });

  const handleChange =
    (field: 'email' | 'verificationCode') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleBack = () => {
    navigate('/signup'); // Go back to signup/signin page
  };

  const handleResend = () => {
    alert('Đã gửi lại mã xác minh!');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.email.trim() || !formData.verificationCode.trim()) {
      alert('Vui lòng điền đầy đủ Email và Mã xác minh!');
      return;
    }
    alert('Mã xác minh hợp lệ, đang tiến hành đặt lại mật khẩu...');
    navigate('/signup');
  };

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center bg-[#0a1222] px-4 py-10 select-none">
      {/* Title - Centered */}
      <header className="flex justify-center items-center mb-10">
        <h1 className="text-[#f2f2f2] p1 md:h00">Forget Password</h1>
      </header>

      {/* Form Container - Centered and Relative wrapper to keep exact absolute coordinates inside */}
      <form
        className="relative w-full max-w-[710px] h-[289px]"
        onSubmit={handleSubmit}
      >
        {/* Email Field Wrapper */}
        <div className="absolute top-0 left-0 w-full h-14 shadow-[1px_4px_4px_#0c24ac]">
          <div className="absolute w-full top-0 left-0 h-14 flex items-center bg-surface-tonal-tonal-a10 rounded-[10px] overflow-hidden border border-solid border-surface-tonal-tonal-a0 cursor-text">
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              placeholder=" "
              value={formData.email}
              onChange={handleChange('email')}
              aria-label="Email"
              className="peer w-full h-full pl-6 pr-6 pt-[18px] pb-2 p7 text-neutral-neutral-a50 bg-transparent border-0 outline-none caret-secondary-secondary-a70"
            />
            <span className="absolute left-6 top-[19px] p7 text-neutral-neutral-a50 whitespace-nowrap pointer-events-none transition-opacity duration-150 peer-placeholder-shown:opacity-100 opacity-0">
              Email
            </span>
          </div>
        </div>

        {/* Verification Code Field Wrapper */}
        <div className="absolute top-[116px] left-0 w-[calc(100%-170px)] md:w-[555px] h-14 shadow-[1px_4px_4px_#0c24ac]">
          <div className="absolute w-full top-0 left-0 h-14 flex items-center bg-surface-tonal-tonal-a10 rounded-[10px] overflow-hidden border border-solid border-surface-tonal-tonal-a0 cursor-text">
            <input
              id={verificationId}
              name="verificationCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder=" "
              value={formData.verificationCode}
              onChange={handleChange('verificationCode')}
              aria-label="Verification code"
              className="peer w-full h-full pl-6 pr-6 pt-[18px] pb-2 p7 text-neutral-neutral-a50 bg-transparent border-0 outline-none caret-secondary-secondary-a70"
            />
            <span className="absolute left-6 top-[19px] p7 text-neutral-neutral-a50 whitespace-nowrap pointer-events-none transition-opacity duration-150 peer-placeholder-shown:opacity-100 opacity-0">
              Verification code
            </span>
          </div>
        </div>

        {/* Resend Button */}
        <button
          type="button"
          onClick={handleResend}
          className="flex w-[150px] md:w-[155px] h-14 items-center justify-center gap-2.5 p-2.5 absolute top-[116px] right-0 md:left-[555px] bg-[#1d2535] rounded-[10px] shadow-[1px_4px_4px_#0c24ac] cursor-pointer hover:bg-[#283247] transition-colors"
          aria-label="Resend verification code"
        >
          <span className="relative w-fit p7 text-secondary-secondary-a70 whitespace-nowrap">
            Resend
          </span>
        </button>

        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="flex w-[118px] h-14 items-center justify-center gap-2.5 p-2.5 absolute top-[232px] left-0 bg-surface-tonal-tonal-a20 rounded-[10px] border border-solid border-secondary-secondary-a70 shadow-[1px_4px_4px_#0c24ac] cursor-pointer hover:bg-surface-tonal-tonal-a30 transition-colors"
          aria-label="Go back"
        >
          <span className="relative w-fit mt-[-1.00px] p4 text-secondary-secondary-a70">
            Back
          </span>
        </button>

        {/* Continue Submit Button */}
        <button
          type="submit"
          className="flex w-[179px] h-14 items-center justify-center gap-2.5 p-2.5 absolute top-[229px] right-0 md:left-[531px] bg-surface-tonal-tonal-a20 rounded-[10px] border border-solid border-secondary-secondary-a70 shadow-[1px_4px_4px_#0c24ac] cursor-pointer hover:bg-surface-tonal-tonal-a30 transition-colors"
          aria-label="Continue"
        >
          <span className="relative w-fit mt-[-1.00px] p4 text-secondary-secondary-a70">
            Continue
          </span>
        </button>
      </form>
    </main>
  );
};

export default ForgetPassword;
