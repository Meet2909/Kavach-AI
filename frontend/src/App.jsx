import Sidebar from './components/Sidebar';
import Prism from './components/Prism';

export default function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060608] text-white">
      {/* SINGLE UNIFIED BACKGROUND CANVAS */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <Prism
          height={4}
          baseWidth={5}
          animationType="3drotate"
          glow={0.5}
          noise={0}
          transparent
          scale={1.9}
          hueShift={0}
          colorFrequency={2.8}
          hoverStrength={1.5}
          inertia={0.05}
          bloom={1}
          timeScale={0.5}
        />
      </div>

      {/* FOREGROUND LAYOUT */}
      <div className="relative z-10 flex w-full h-full">
        <Sidebar />

        <main className="flex-1 h-full overflow-y-auto p-8">
          <h1 className="text-3xl font-bold tracking-tight mb-6 font-mono text-white">
            Operational Dashboard
          </h1>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 min-h-[500px] flex items-center justify-center text-gray-300 font-mono">
            Awaiting document upload...
          </div>
        </main>
      </div>
    </div>
  );
}