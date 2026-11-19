import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, Sparkles } from 'lucide-react';
import { Button, Input, Select } from '../../components/ui.jsx';
import { Logo } from '../../components/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const perks = [
  'Join clubs and approved campus events',
  'Build a team for team challenges',
  'Submit evidence and collect points',
  'Unlock achievements and climb the board',
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    campus: 'Northfield University',
    department: '',
    year: 1,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Use at least two characters.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const user = await register({ ...form, year: Number(form.year) });
      toast.success(`Your CampusQuest account is ready, ${user.name.split(' ')[0]}.`);
      navigate(user.role === 'organizer' ? '/organizer' : '/dashboard', { replace: true });
    } catch (error) {
      const details = error.response?.data?.error?.details;
      if (Array.isArray(details)) {
        setErrors(Object.fromEntries(details.map((item) => [item.path, item.message])));
      }
      toast.error(error.friendlyMessage || 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-fuchsia-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 hero-grid opacity-20" aria-hidden="true" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur"><Compass size={18} /></span>
            <span className="font-display text-lg font-extrabold">CampusQuest</span>
          </Link>
        </div>
        <div className="relative max-w-md">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <Sparkles size={13} /> Start with one small quest
          </p>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight">
            Build a campus record that looks like you.
          </h2>
          <ul className="mt-7 space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-3 text-sm text-white/90">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-mint" /> {perk}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/60">Local demo environment · use only demo data</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-lg">
          <div className="lg:hidden"><Logo /></div>
          <h1 className="mt-8 font-display text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            Students join as participants. Organizers get event and challenge management tools.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <Input label="Full name" name="name" placeholder="Ava Patel" value={form.name} onChange={update('name')} error={errors.name} required />
            <Input label="Campus email" name="email" type="email" placeholder="you@campus.edu" value={form.email} onChange={update('email')} error={errors.email} required />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={update('password')}
              error={errors.password}
              hint="Use a unique demo password. Never reuse a real one."
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Account type" name="role" value={form.role} onChange={update('role')}>
                <option value="student">Student</option>
                <option value="organizer">Club organizer</option>
              </Select>
              <Select label="Year" name="year" value={form.year} onChange={update('year')}>
                {[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>Year {year}</option>)}
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Campus" name="campus" value={form.campus} onChange={update('campus')} />
              <Input label="Department" name="department" placeholder="Computer Science" value={form.department} onChange={update('department')} />
            </div>
            <Button type="submit" loading={submitting} className="w-full py-3">
              Create account <ArrowRight size={16} />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
            Already have an account? <Link to="/login" className="link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
