export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4"
      style={{ backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.07) 0%, transparent 60%)` }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-cyan tracking-tight">
            COIN<span className="text-text-primary">X</span>444
          </h1>
          <p className="text-text-secondary text-sm mt-1">Pakistan's Premier Trading Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
