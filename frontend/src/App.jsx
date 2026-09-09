  import { useState } from 'react';
  import Sidebar from './components/SIdebar.jsx';

  function App() {
    // Master state for the active job
    const [activeJobId, setActiveJobId] = useState(null);

    return (
      <div className="flex h-screen bg-slate-50 font-sans">
        <Sidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 p-4 shadow-sm">
            <h1 className="text-xl font-semibold text-slate-800">Operational Dashboard</h1>
          </header>
          
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-lg border border-slate-200 shadow-sm p-6 min-h-[500px]">
              {/* UploadBox.jsx and TracePanel.jsx will go here next */}
              <p className="text-slate-500">Awaiting document upload...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  export default App;