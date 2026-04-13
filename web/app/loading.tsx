export default function Loading() {
  return (
    <div className="bg-pacame-black min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center animate-pulse">
          <span className="font-heading font-bold text-white text-sm">P</span>
        </div>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-electric-violet animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-electric-violet animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-electric-violet animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
