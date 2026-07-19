
type LoaderProps = {
  variant?: "page" | "inline" | "overlay" | "card";
  size?: "sm" | "md" | "lg";
  text?: string;
};

export default function Loader({
  variant = "page",
  size = "md",
  text,
}: LoaderProps) {
  const dotSize = {
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-4 h-4",
  }[size];

  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  const Dots = () => (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${dotSize} rounded-full bg-green-500 animate-bounce`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );

  // ── Full page loader ───────────────────────────────────────────────────────
  if (variant === "page") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Dots />
        {text && <p className={`${textSize} text-gray-400 font-medium`}>{text}</p>}
      </div>
    );
  }

  // ── Overlay loader (covers parent with relative position) ─────────────────
  if (variant === "overlay") {
    return (
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl gap-3">
        <Dots />
        {text && <p className={`${textSize} text-gray-400 font-medium`}>{text}</p>}
      </div>
    );
  }

  // ── Card skeleton loader ───────────────────────────────────────────────────
  if (variant === "card") {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
        <div className="h-8 w-48 bg-slate-200 rounded mb-3" />
        <div className="h-3 w-24 bg-slate-100 rounded" />
      </div>
    );
  }

  // ── Inline loader (inside buttons, rows, etc) ─────────────────────────────
  return (
    <div className="flex items-center gap-2">
      <Dots />
      {text && <p className={`${textSize} text-gray-400`}>{text}</p>}
    </div>
  );
}