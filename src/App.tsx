import { Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Notebook from '@/pages/Notebook';
import Problem from '@/pages/Problem';
import SignUp from '@/pages/SignUp';
import ForgetPassword from '@/pages/ForgetPassword';
import { Survey } from '@/pages/Survey';
import Ide from '@/pages/Ide';
import { CreateProblem } from '@/pages/CreateProblem';
import Stats from '@/pages/Stats';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/notebook" element={<Notebook />} />

      <Route path="/problem" element={<Problem />} />
      <Route path="/problems/:problemSlug" element={<Ide />} />
      <Route path="/create-problem" element={<CreateProblem />} />
      <Route path="/stats" element={<Stats />} />
      {/* /signup và /signin đều dùng chung trang tích hợp SignUp (có 2 tab) */}
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignUp />} />
      <Route path="/forget-password" element={<ForgetPassword />} />
      <Route path="/survey" element={<Survey />} />
    </Routes>
  );
}

export default App;
