import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import type { JournalEntry } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { ImageModal } from './ImageModal';
import { DuplicateIcon } from './icons/DuplicateIcon';
import { CompileIcon } from './icons/CompileIcon';

interface JournalListProps {
  entries: JournalEntry[];
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (id: string, payload: Partial<Omit<JournalEntry, 'id'>>) => void;
  onDuplicateEntry: (entry: JournalEntry) => void;
  onCompileEntries: (ticketNumber: string) => void;
  highlightedDate: string | null;
}

const formatTicketNumber = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) {
        return '';
    }
    const reversed = digitsOnly.split('').reverse().join('');
    const grouped = reversed.match(/.{1,3}/g)?.join(' ') || '';
    const result = grouped.split('').reverse().join('');
    return result;
};

const JournalEntryCard: React.FC<{
  entry: JournalEntry;
  onDelete: () => void;
  onUpdate: (payload: Partial<Omit<JournalEntry, 'id'>>) => void;
  onDuplicate: () => void;
  onCompile: (ticketNumber: string) => void;
  isHighlighted: boolean;
  isCompilable: boolean;
}> = ({ entry, onDelete, onUpdate, onDuplicate, onCompile, isHighlighted, isCompilable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(entry.content);
  const [editedTicketNumber, setEditedTicketNumber] = useState(entry.ticketNumber || '');
  const [editedDate, setEditedDate] = useState(entry.date);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = new Date(entry.date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });
  
  const toLocalISOString = (isoString: string) => {
    const date = new Date(isoString);
    const tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleSave = () => {
    if (editedContent.trim()) {
      onUpdate({ content: editedContent, ticketNumber: editedTicketNumber, date: editedDate });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(entry.content);
    setEditedTicketNumber(entry.ticketNumber || '');
    setEditedDate(entry.date);
    setIsEditing(false);
  };
  
  const handleCompile = () => {
    if (entry.ticketNumber && window.confirm(`Are you sure you want to compile all entries for ticket "${entry.ticketNumber}" into a single entry? The original entries will be deleted.`)) {
        onCompile(entry.ticketNumber);
    }
  };
  
  const createMarkup = () => {
      const rawMarkup = marked.parse(entry.content) as string;
      return { __html: rawMarkup };
  };

  return (
    <>
      <div
        id={`entry-${new Date(entry.date).toLocaleDateString('en-CA')}`}
        className={`bg-white dark:bg-stone-800 p-4 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 transition-all duration-300 ${isHighlighted ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-stone-950' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">{formattedDate}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">{formattedTime}</p>
          </div>
          <div className="flex items-center gap-2">
            {entry.ticketNumber && !isEditing && (
              <span className="text-xs font-semibold bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2 py-1 rounded-full">{entry.ticketNumber}</span>
            )}
            {!isEditing && (
              <>
                 {isCompilable && (
                    <button onClick={handleCompile} aria-label="Compile entries" title="Compile Entries" className="text-stone-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors p-1 rounded-full">
                        <CompileIcon className="w-4 h-4" />
                    </button>
                 )}
                <button onClick={onDuplicate} aria-label="Duplicate entry" title="Duplicate Entry" className="text-stone-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors p-1 rounded-full">
                  <DuplicateIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setIsEditing(true)} aria-label="Edit entry" title="Edit Entry" className="text-stone-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors p-1 rounded-full">
                  <EditIcon className="w-4 h-4" />
                </button>
                <button onClick={onDelete} aria-label="Delete entry" title="Delete Entry" className="text-stone-400 hover:text-red-500 transition-colors p-1 rounded-full">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-2">
             <div className="flex gap-2 mb-2">
                <div className="flex-1">
                    <label className="text-xs text-stone-500 dark:text-stone-400">Date & Time</label>
                    <input
                        type="datetime-local"
                        value={toLocalISOString(editedDate)}
                        onChange={(e) => setEditedDate(new Date(e.target.value).toISOString())}
                        className="w-full mt-1 p-2 text-sm border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-md focus:ring-2 focus:ring-amber-500"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-xs text-stone-500 dark:text-stone-400">Ticket Number</label>
                    <input
                        type="text"
                        value={editedTicketNumber}
                        onChange={(e) => setEditedTicketNumber(formatTicketNumber(e.target.value))}
                        className="w-full mt-1 p-2 text-sm border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-md focus:ring-2 focus:ring-amber-500"
                    />
                </div>
             </div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-32 p-3 border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-150 ease-in-out resize-none"
              aria-label="Journal entry content"
            />
            {/* Note: Image editing is not implemented in this view for simplicity */}
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={handleCancel} className="px-3 py-1 text-sm font-semibold text-stone-600 dark:text-stone-300 bg-stone-200 dark:bg-stone-600 rounded-md hover:bg-stone-300 dark:hover:bg-stone-500 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!editedContent.trim()} className="px-3 py-1 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:bg-stone-400 dark:disabled:bg-stone-600 transition-colors">
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
                className="prose mt-2 text-stone-800 dark:text-stone-300 max-w-none"
                dangerouslySetInnerHTML={createMarkup()}
            />
            {entry.imageUrl && (
                <div className="mt-3">
                    <button onClick={() => setIsModalOpen(true)} className="w-full">
                        <img src={entry.imageUrl} alt="Journal entry attachment" className="rounded-md object-cover w-full max-h-48 cursor-pointer hover:opacity-90 transition-opacity" />
                    </button>
                </div>
            )}
          </>
        )}
      </div>
      {isModalOpen && entry.imageUrl && <ImageModal imageUrl={entry.imageUrl} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};


export const JournalList: React.FC<JournalListProps> = ({ entries, onDeleteEntry, onUpdateEntry, onDuplicateEntry, onCompileEntries, highlightedDate }) => {
  const ticketCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of entries) {
        if (entry.ticketNumber) {
            counts[entry.ticketNumber] = (counts[entry.ticketNumber] || 0) + 1;
        }
    }
    return counts;
  }, [entries]);

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-2 px-4">Journal Archive</h2>
      <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto p-4">
        {entries.length > 0 ? (
          entries.map(entry => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onDelete={() => onDeleteEntry(entry.id)}
              onUpdate={(payload) => onUpdateEntry(entry.id, payload)}
              onDuplicate={() => onDuplicateEntry(entry)}
              onCompile={onCompileEntries}
              isHighlighted={highlightedDate === new Date(entry.date).toLocaleDateString('en-CA')}
              isCompilable={!!entry.ticketNumber && ticketCounts[entry.ticketNumber] > 1}
            />
          ))
        ) : (
          <div className="text-center py-10 text-stone-500 dark:text-stone-400">
            <p>No journal entries yet.</p>
            <p>Add one above to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};