
import { useState, useEffect, useCallback } from 'react';
import type { JournalEntry } from '../types';

const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    date: new Date('2023-06-05T10:00:00Z').toISOString(),
    content: "Fixed the XYZ model at the Smith building. The faulty component was the main logic board. Replaced it with part number #123-ABC. Double-checked the connections and everything seems to be working fine now.",
    ticketNumber: '2 382 182'
  },
  {
    id: '2',
    date: new Date('2024-01-15T14:30:00Z').toISOString(),
    content: "Followed 'Procedure 10-A' for the server maintenance. Made a mistake by forgetting to back up the configuration file first, which caused a minor delay. Remember to always backup before running the script. This is the third time this has happened.",
    ticketNumber: '2 363 806'
  },
  {
    id: '3',
    date: new Date('2024-05-20T09:00:00Z').toISOString(),
    content: "Key instructions for Acme Serial #45-B: The device requires a specific power cycle sequence to reset. First, unplug the power. Second, hold the reset button for 10 seconds. Third, plug the power back in while still holding the button. Release after the green light flashes three times.",
    ticketNumber: '2 373 091'
  },
   {
    id: '4',
    date: new Date('2024-02-10T11:00:00Z').toISOString(),
    content: "Another note on 'Procedure 10-A'. The official documentation is outdated. The correct command is `run-diag --extended` not `run-diag --full`. Made this mistake on the Johnson account, had to roll back.",
    ticketNumber: '2 373 092'
  }
];

const STORAGE_KEY = 'moleskine-ai-journal';

type NewEntryPayload = Omit<JournalEntry, 'id' | 'date'>;
type UpdateEntryPayload = Partial<Omit<JournalEntry, 'id'>>;

export const useJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const storedEntries = window.localStorage.getItem(STORAGE_KEY);
      if (storedEntries) {
        return JSON.parse(storedEntries);
      }
    } catch (error) {
      console.error("Error reading from localStorage", error);
    }
    return INITIAL_ENTRIES;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [entries]);

  const addEntry = useCallback((payload: NewEntryPayload) => {
    if (!payload.content.trim()) return;
    const newEntry: JournalEntry = {
      id: new Date().toISOString() + Math.random(),
      date: new Date().toISOString(),
      ...payload,
    };
    setEntries(prevEntries => [newEntry, ...prevEntries]);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
  }, []);
  
  const updateEntry = useCallback((id: string, payload: UpdateEntryPayload) => {
    setEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.id === id ? { ...entry, ...payload } : entry
      )
    );
  }, []);

  const importEntries = useCallback((importedEntries: JournalEntry[]) => {
    setEntries(prevEntries => {
        // Create a Set of existing content/date signatures to prevent duplicates
        const existingSignatures = new Set(prevEntries.map(e => `${e.date}-${e.content}`));
        
        const uniqueNewEntries = importedEntries.filter(entry => {
            // Normalize date for comparison if needed, but exact match on ISO string is strict
            const signature = `${entry.date}-${entry.content}`;
            if (existingSignatures.has(signature)) {
                return false;
            }
            existingSignatures.add(signature);
            return true;
        });
        
        // Ensure new entries have unique IDs if they collide (unlikely with Math.random but good practice)
        const sanitizedNewEntries = uniqueNewEntries.map(e => ({
            ...e,
            id: e.id || (new Date().toISOString() + Math.random())
        }));

        return [...sanitizedNewEntries, ...prevEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  }, []);

  const compileEntriesByTicketNumber = useCallback((ticketNumber: string) => {
    const entriesToCompile = entries.filter(e => e.ticketNumber === ticketNumber);
    if (entriesToCompile.length < 2) return;

    // Sort oldest to newest
    entriesToCompile.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const compiledContent = entriesToCompile.map(entry => {
      const entryDate = new Date(entry.date).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `--- Entry from ${entryDate} ---\n${entry.content}`;
    }).join('\n\n');

    const newestEntry = entriesToCompile[entriesToCompile.length - 1];

    const compiledEntry: JournalEntry = {
      id: new Date().toISOString() + Math.random(), // new ID
      date: newestEntry.date, // date of the last entry
      content: compiledContent,
      ticketNumber: ticketNumber,
      imageUrl: newestEntry.imageUrl, // image from the last entry
    };

    const remainingEntries = entries.filter(e => e.ticketNumber !== ticketNumber);
    setEntries([compiledEntry, ...remainingEntries]);
  }, [entries]);

  const sortedEntries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { entries: sortedEntries, addEntry, deleteEntry, updateEntry, importEntries, compileEntriesByTicketNumber };
};
