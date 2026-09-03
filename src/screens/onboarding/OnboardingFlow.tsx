import { useState } from 'react';
import { ScanStep } from './ScanStep';
import { ConnectStep } from './ConnectStep';
import { DuplicatesStep } from './DuplicatesStep';

export function OnboardingFlow({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const finish = () => {
    localStorage.setItem('ferrite:onboarded', 'true');
    onFinish();
  };

  if (step === 0) return <ScanStep onNext={() => setStep(1)} />;
  if (step === 1) return <ConnectStep onNext={() => setStep(2)} />;
  return <DuplicatesStep onFinish={finish} />;
}
