
import React, { useRef, useState } from 'react';
import type { JournalEntry } from '../types';

type Theme = 'light' | 'dark';

interface SettingsProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  entries: JournalEntry[];
  onImport: (entries: JournalEntry[]) => void;
}

export const Settings: React.FC<SettingsProps> = ({ theme, setTheme, entries, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `work_journal_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string): JournalEntry[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Simple CSV parser that handles quoted fields
    const parseLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const entries: JournalEntry[] = [];

    // Journal it! common headers mapping
    // Known headers: entry_id, entry_date, entry_text, entry_title, entry_location, entry_tags
    const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('created'));
    const textIdx = headers.findIndex(h => h === 'entry_text' || h === 'text' || h === 'content' || h === 'note');
    const tagsIdx = headers.findIndex(h => h.includes('tags') || h.includes('label'));
    
    if (dateIdx === -1 || textIdx === -1) {
       // Fallback: Try column 1 for date, column 2 for text if headers are missing or weird
       // but return empty if we can't be sure.
       return [];
    }

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const columns = parseLine(lines[i]);
      if (columns.length <= Math.max(dateIdx, textIdx)) continue;

      const dateStr = columns[dateIdx];
      const content = columns[textIdx];
      const tags = tagsIdx !== -1 ? columns[tagsIdx] : '';

      // Attempt to find a ticket number in tags or content
      // Looks for patterns like "1 234 567" or just a sequence of digits
      const ticketMatch = tags.match(/\d[\d\s]{5,}\d/) || content.match(/Ticket:?\s*(#?[\d\s]+)/i);
      const ticketNumber = ticketMatch ? ticketMatch[0].replace(/[^\d\s]/g, '').trim() : undefined;

      let date: string;
      try {
         // Handle common CSV date formats
         const d = new Date(dateStr);
         if (!isNaN(d.getTime())) {
            date = d.toISOString();
         } else {
            date = new Date().toISOString(); // Fallback
         }
      } catch (e) {
         date = new Date().toISOString();
      }

      entries.push({
        id: new Date().toISOString() + Math.random(), // Generate new ID
        date,
        content: content.replace(/^"|"$/g, '').replace(/""/g, '"'), // Clean quotes
        ticketNumber
      });
    }
    return entries;
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedEntries: JournalEntry[] = [];
        
        if (file.name.endsWith('.json')) {
          importedEntries = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          importedEntries = parseCSV(content);
        } else {
            setImportStatus('Unsupported file format. Please use .json or .csv');
            return;
        }

        if (Array.isArray(importedEntries)) {
          onImport(importedEntries);
          setImportStatus(`Successfully imported ${importedEntries.length} entries.`);
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Invalid file format.');
        }
      } catch (error) {
        console.error("Import error:", error);
        setImportStatus('Error parsing file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="absolute top-12 right-0 w-64 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-20 p-4">
      <div className="space-y-4">
        
        <div className="flex items-center justify-between">
          <label htmlFor="dark-mode-toggle" className="text-sm font-medium text-stone-700 dark:text-stone-300 select-none cursor-pointer">
            Dark Mode
          </label>
          <button
            id="dark-mode-toggle"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-white dark:focus:ring-offset-stone-800 ${
              theme === 'dark' ? 'bg-amber-600' : 'bg-stone-300 dark:bg-stone-600'
            }`}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <hr className="border-stone-200 dark:border-stone-700" />

        <div>
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">Data Management</h3>
            <div className="space-y-2">
                <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-md transition-colors">
                    Export Backup (JSON)
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-md transition-colors">
                    Import Data (JSON/CSV)
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    accept=".json,.csv" 
                    className="hidden" 
                />
                {importStatus && <p className="text-xs text-center text-stone-500 dark:text-stone-400 mt-1">{importStatus}</p>}
                <p className="text-[10px] text-stone-400 dark:text-stone-500 text-center mt-1">Compatible with "Journal it!" CSV export.</p>
            </div>
        </div>

      </div>
    </div>
  );
};
