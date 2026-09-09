    import { useState } from 'react';
    import { motion } from 'framer-motion';
    import { LayoutDashboard, FileText, Cpu, BookOpen, Archive, ShieldCheck, Network, Settings, Menu } from 'lucide-react';

    const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Documents", icon: FileText },
    { name: "AI Jobs", icon: Cpu },
    { name: "Knowledge", icon: BookOpen },
    { name: "Artifacts", icon: Archive },
    { name: "Audit", icon: ShieldCheck },
    { name: "Network", icon: Network },
    { name: "Settings", icon: Settings }
    ];

    export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <motion.div 
        animate={{ width: isOpen ? "250px" : "70px" }}
        className="h-screen bg-slate-900 text-white flex flex-col border-r border-slate-700 shadow-xl"
        >
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
            {isOpen && <span className="font-bold text-lg tracking-wider">KAVACH-AI</span>}
            <button onClick={() => setIsOpen(!isOpen)} className="p-1 hover:bg-slate-700 rounded transition-colors">
            <Menu size={24} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
            {menuItems.map((item, index) => (
            <div key={index} className="flex items-center px-4 py-3 hover:bg-slate-800 cursor-pointer transition-colors group">
                <item.icon size={22} className="text-slate-400 group-hover:text-blue-400" />
                {isOpen && <span className="ml-4 font-medium text-slate-300 group-hover:text-white">{item.name}</span>}
            </div>
            ))}
        </div>

        {isOpen && (
            <div className="p-4 text-xs text-slate-500 border-t border-slate-700">
            MRPL Enterprise Workbench v1.0
            </div>
        )}
        </motion.div>
    );
    }