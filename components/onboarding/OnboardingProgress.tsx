export function OnboardingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-[13px] font-semibold text-neutro-muted">{step} de 3</p>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-[5px] flex-1 rounded-full ${
              s <= step ? "bg-primary" : "bg-white/[0.10]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
