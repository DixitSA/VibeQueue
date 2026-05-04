import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-charcoal text-cream text-center">
      <h1 className="text-5xl font-display font-light mb-4 tracking-tighter">VibeQueue</h1>
      <p className="text-cream/60 mb-12 max-w-xs mx-auto font-sans">
        The real-time crowd jukebox for high-end taprooms and venues.
      </p>
      
      <Link 
        href="/session/demo-taproom"
        className="bg-cream text-charcoal px-8 py-4 rounded-sm font-display font-bold uppercase tracking-[0.2em] hover:bg-white transition-colors"
      >
        Enter Demo Session
      </Link>
      
      <div className="mt-24 border-t border-cream/10 pt-8 w-full max-w-xs">
        <p className="text-[10px] uppercase tracking-widest text-cream/30">
          Venue Owner? <span className="text-cream/50 underline cursor-pointer">Login to Dashboard</span>
        </p>
      </div>
    </main>
  );
}
