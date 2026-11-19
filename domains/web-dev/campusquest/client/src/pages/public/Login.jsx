import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Mail, Sparkles } from 'lucide-react';
import { Button, Input } from '../../components/ui.jsx';
import { Logo } from '../../components/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const demos = [
  { label: 'Student', email: 'ava@campusquest.dev' },
  { label: 'Organizer', email: 'maya@campusquest.dev' },
  { label: 'Admin', email: 'admin@campusquest.dev' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const destination = (user) => {
    if (location.state?.from) return location.state.from;
    if (user.role === 'admin') return '/admin';
    if (user.role === 'organizer') return '/organizer';
    return '/dashboard';
  };

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    if (!form.email.trim()) return setErrors({ email: 'Enter your email address.' });
    if (!form.password) return setErrors({ password: 'Enter your password.' });
    setSubmitting(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
      navigate(destination(user), { replace: true });
    } catch (error) {
      const details = error.response?.data?.error?.details;
      if (Array.isArray(details)) {
        setErrors(Object.fromEntries(details.map((item) => [item.path, item.message])));
      }
      toast.error(error.friendlyMessage || 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 hero-grid opacity-20" aria-hidden="true" />
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Sparkles size={18} />
            </span>
            <span className="font-display text-lg font-extrabold">CampusQuest</span>
          </Link>
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-3xl font-bold leading-tight text-white">
            “I stopped forgetting which club night was which. Now my whole campus life lives in one place.”
          </p>
          <p className="mt-5 text-sm font-medium text-ink-300">Ava Patel · Computer Science, Class of 2028</p>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-white">
            <div><p className="font-display text-2xl font-bold">17</p><p className="text-[11px] uppercase tracking-wider text-ink-400">Students</p></div>
            <div><p className="font-display text-2xl font-bold">7</p><p className="text-[11px] uppercase tracking-wider text-ink-400">Clubs</p></div>
            <div><p className="font-display text-2xl font-bold">13</p><p className="text-[11px] uppercase tracking-wider text-ink-400">Events</p></div>
          </div>
        </div>
        <p className="relative text-xs text-ink-500">Local demo · no real student data · CampusQuest</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden"><Logo /></div>
          <h1 className="mt-8 font-display text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">Sign in to pick up your quest where you left it.</p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <div className="relative">
              <Input
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@campus.edu"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                error={errors.email}
              />
              <Mail size={15} className="pointer-events-none absolute right-3 top-[34px] text-ink-300" />
            </div>
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                error={errors.password}
              />
              <KeyRound size={15} className="pointer-events-none absolute right-3 top-[34px] text-ink-300" />
            </div>
            <Button type="submit" loading={submitting} className="w-full py-3">
              Sign in <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-ink-200 p-3 dark:border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Demo accounts · password CampusQuest123!</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {demos.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => setForm({ email: demo.email, password: 'CampusQuest123!' })}
                  className="chip hover:border-brand-400"
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
            New to CampusQuest?{' '}
            <Link to="/register" className="link">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
