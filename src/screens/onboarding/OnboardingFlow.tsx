import { useEffect, useState } from 'react';
import { ScanStep } from './ScanStep';
import { ConnectStep } from './ConnectStep';
import { DuplicatesStep } from './DuplicatesStep';

const STEP_KEY = 'ferrite:onboarding:step';

function readStoredStep(): 0 | 1 | 2 {
  const raw = localStorage.getItem(STEP_KEY);
  return raw === '1' || raw === '2' ? (Number(raw) as 1 | 2) : 0;
}

export function OnboardingFlow({ onFinish }: { onFinish: () => void }) {
  // Connecting Spotify mid-onboarding redirects the whole page away and
  // back (real OAuth), which resets React state — persist the step so the
  // user resumes where they left off instead of restarting at step 0.
  const [step, setStep] = useState<0 | 1 | 2>(readStoredStep);

  useEffect(() => {
    localStorage.setItem(STEP_KEY, String(step));
  }, [step]);

  const finish = () => {
    localStorage.setItem('ferrite:onboarded', 'true');
    localStorage.removeItem(STEP_KEY);
    onFinish();
  };

  if (step === 0) return <ScanStep onNext={() => setStep(1)} />;
  if (step === 1) return <ConnectStep onNext={() => setStep(2)} />;
  return <DuplicatesStep onFinish={finish} />;
}
