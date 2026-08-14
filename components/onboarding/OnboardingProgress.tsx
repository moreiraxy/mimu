export function OnboardingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-xs font-semibold text-neutro-muted">{step}/3</p>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s <= step ? "bg-primary" : "bg-neutro-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
