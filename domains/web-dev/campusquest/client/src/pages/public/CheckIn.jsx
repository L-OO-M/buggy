import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, QrCode, ScanLine } from 'lucide-react';
import { registrationsApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Card, Input } from '../../components/ui.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function CheckIn() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const [token, setToken] = useState(params.get('token') || '');
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const autoRun = useRef(false);

  const submit = async (value = token) => {
    if (!user) return;
    if (!value.trim()) return toast.warning('Paste a check-in code first.');
    setState('loading');
    try {
      const data = await registrationsApi.checkIn(value.trim());
      setResult(data);
      setState('success');
      toast.success('Check-in complete.');
    } catch (error) {
      setState('error');
      toast.error(error.friendlyMessage);
    }
  };

  useEffect(() => {
    if (params.get('token') && user && !autoRun.current) {
      autoRun.current = true;
      submit(params.get('token'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="p-8 text-center">
        <span className="mx-auto inline-flex rounded-2xl bg-brand-600 p-3 text-white shadow-lg shadow-brand-600/30">
          <QrCode size={26} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink-900 dark:text-white">Event check-in</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          Scan the organizer&apos;s QR code or paste the check-in code below. You must already be registered.
        </p>

        {!user ? (
          <Link to="/login" state={{ from: `/checkin?token=${encodeURIComponent(token)}` }} className="btn-primary mt-6 w-full">
            Sign in to check in
          </Link>
        ) : state === 'success' ? (
          <div className="mt-6 rounded-2xl bg-mint/10 p-6">
            <CheckCircle2 size={34} className="mx-auto text-emerald-500" />
            <p className="mt-2 font-display text-lg font-bold text-emerald-700 dark:text-emerald-200">You&apos;re checked in</p>
            <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-200/70">{result?.event?.title}</p>
            <Link to={`/events/${result?.event?.id}`} className="btn-secondary mt-4">Back to event</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4 text-left">
            <Input
              label="Check-in code"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste the code from the QR screen"
            />
            <Button className="w-full" loading={state === 'loading'} onClick={() => submit()}>
              <ScanLine size={16} /> Validate and check in
            </Button>
            {state === 'error' ? (
              <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                The code was rejected. Ask the organizer to rotate and show a fresh QR, then try again.
              </p>
            ) : null}
          </div>
        )}
        <p className="mt-6 text-xs text-ink-400">
          Demo tip: an organizer can open <span className="font-semibold">Organizer → Attendance</span> to display the live code.
        </p>
      </Card>
    </div>
  );
}
