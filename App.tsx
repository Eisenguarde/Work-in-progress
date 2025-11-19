
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useJournal } from './hooks/useJournal';
import { queryJournal } from './services/geminiService';
import type { ChatMessage, JournalEntry, UserLocation } from './types';
import { JournalEditor } from './components/JournalEditor';
import { JournalList } from './components/JournalList';
import { QueryInterface } from './components/QueryInterface';
import { LogoIcon } from './components/icons/LogoIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { Settings } from './components/Settings';
import { UpdateToast } from './components/UpdateToast';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const { entries, addEntry, deleteEntry, updateEntry, importEntries, compileEntriesByTicketNumber } = useJournal();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'system-intro',
      role: 'system',
      content: "Welcome to your AI Knowledge Base! Add journal entries on the left, and ask me questions about them here. For example: 'What was the part number for the XYZ model?' or 'Find coffee shops near the Smith building.'"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [entryToDuplicate, setEntryToDuplicate] = useState<JournalEntry | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if(newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            setShowUpdate(true);
                        }
                    });
                }
            });
        });
        
        // Periodic check logic could go here, but simpler to rely on reloading
    }
  }, []);

  const handleUpdateApp = () => {
      window.location.reload();
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleQuery = useCallback(async (query: string) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: query };
    setChatHistory(prev => [...prev, userMessage]);

    const response = await queryJournal(query, entries, location);
    
    const modelMessage: ChatMessage = { 
      id: (Date.now() + 1).toString(), 
      role: 'model', 
      content: response.text,
      groundingChunks: response.groundingChunks,
    };
    setChatHistory(prev => [...prev, modelMessage]);
    setIsLoading(false);
  }, [entries, location]);

  const handleCiteClick = (date: string) => {
    setHighlightedDate(date);
    const element = document.getElementById(`entry-${date}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedDate(null), 2000); // Highlight for 2 seconds
  };
  
  const handleAddEntry = useCallback((payload: Omit<JournalEntry, 'id' | 'date'>) => {
    addEntry(payload);
  }, [addEntry]);

  const handleUpdateEntry = useCallback((id: string, payload: Partial<Omit<JournalEntry, 'id'>>) => {
    updateEntry(id, payload);
  }, [updateEntry]);

  const handleDuplicateEntry = (entry: JournalEntry) => {
    setEntryToDuplicate(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const welcomeMessage = chatHistory.find(msg => msg.id === 'system-intro');

  return (
    <div className="min-h-screen text-stone-900 dark:text-stone-200">
      <header className="bg-white/80 dark:bg-stone-950/80 backdrop-blur-md sticky top-0 z-10 border-b border-stone-200 dark:border-stone-700">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <LogoIcon className="w-8 h-8 text-amber-700" />
                  <h1 className="text-2xl font-bold font-serif text-stone-800 dark:text-stone-200">Work Journal <span className="text-amber-700">AI</span></h1>
              </div>
              <div className="flex items-center gap-4">
                <p className="hidden md:block text-sm text-stone-600 dark:text-stone-400">Your Personal Knowledge Base, Reimagined.</p>
                 <div ref={settingsRef} className="relative">
                  <button onClick={() => setIsSettingsOpen(o => !o)} className="p-2 rounded-full text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors" aria-label="Open settings">
                      <SettingsIcon className="w-5 h-5" />
                  </button>
                  {isSettingsOpen && (
                    <Settings 
                      theme={theme} 
                      setTheme={setTheme} 
                      entries={entries}
                      onImport={importEntries}
                    />
                  )}
                </div>
              </div>
          </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 h-[calc(100vh-65px)]">
        <div className="col-span-1 lg:col-span-3 p-4 overflow-y-auto bg-stone-50 dark:bg-stone-950">
          <div className="max-w-3xl mx-auto">
            <JournalEditor 
              onAddEntry={handleAddEntry} 
              entryToDuplicate={entryToDuplicate}
              onDuplicationDone={() => setEntryToDuplicate(null)}
            />
            <JournalList 
              entries={entries} 
              onDeleteEntry={deleteEntry} 
              onUpdateEntry={handleUpdateEntry} 
              onDuplicateEntry={handleDuplicateEntry}
              onCompileEntries={compileEntriesByTicketNumber}
              highlightedDate={highlightedDate} 
            />
          </div>
        </div>
        <div className="col-span-1 lg:col-span-2 h-full">
           <QueryInterface 
                onQuery={handleQuery} 
                chatHistory={welcomeMessage ? chatHistory.slice(1) : chatHistory} 
                isLoading={isLoading}
                onCiteClick={handleCiteClick}
            />
        </div>
      </main>
      <UpdateToast show={showUpdate} onUpdate={handleUpdateApp} />
    </div>
  );
};

export default App;
