interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/** Accessible +/- number control. Direction-agnostic (flex flips under RTL). */
export function Stepper({ label, value, onChange, min = 0, max = 99 }: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-stone-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label={`${label} −`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-lg text-stone-600 transition hover:border-sand hover:text-sand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="w-6 text-center text-lg tabular-nums text-stone-800" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label={`${label} +`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-lg text-stone-600 transition hover:border-sand hover:text-sand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
