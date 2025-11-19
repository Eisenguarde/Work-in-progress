import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon } from './icons/SendIcon';
import { LogoIcon } from './icons/LogoIcon';
import { MapPinIcon } from './icons/MapPinIcon';

interface QueryInterfaceProps {
  onQuery: (query: string) => void;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  onCiteClick: (date: string) => void;
}

const ChatBubble: React.FC<{ message: ChatMessage, onCiteClick: (date: string) => void }> = ({ message, onCiteClick }) => {
  const isModel = message.role === 'model';
  
  const parseAndRenderContent = (content: string) => {
    const parts = content.split(/(\[Source: [0-9]{4}-[0-9]{2}-[0-9]{2}\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[Source: ([0-9]{4}-[0-9]{2}-[0-9]{2})\]/);
      if (match) {
        const date = match[1];
        return (
          <button 
            key={index}
            onClick={() => onCiteClick(date)}
            className="inline-block bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-semibold px-2 py-0.5 rounded-md text-xs mx-1 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
          >
            Source: {date}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const groundingLinks = message.groundingChunks
    ?.map(chunk => chunk.maps)
    .filter((maps): maps is { uri: string; title: string } => !!maps);

  return (
    <div className={`flex items-start gap-3 my-4 ${isModel ? '' : 'flex-row-reverse'}`}>
      <div className={`p-1.5 rounded-full ${isModel ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-stone-200 dark:bg-stone-700'}`}>
        {isModel ? <LogoIcon className="w-6 h-6 text-amber-600" /> : 
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-stone-600 dark:text-stone-300"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        }
      </div>
      <div className={`p-4 rounded-lg max-w-lg ${isModel ? 'bg-amber-50 dark:bg-amber-900/20 text-stone-800 dark:text-stone-200' : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'}`}>
        <div className="whitespace-pre-wrap">{parseAndRenderContent(message.content)}</div>
        {groundingLinks && groundingLinks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-900/50">
            <h4 className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5 flex items-center gap-1.5">
              <MapPinIcon className="w-3.5 h-3.5" />
              Related Places
            </h4>
            <ul className="space-y-1">
              {groundingLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};


export const QueryInterface: React.FC<QueryInterfaceProps> = ({ onQuery, chatHistory, isLoading, onCiteClick }) => {
  const [query, setQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onQuery(query);
      setQuery('');
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 h-full flex flex-col border-l border-stone-200 dark:border-stone-700">
      <div className="p-4 border-b border-stone-200 dark:border-stone-700">
        <h2 className="text-lg font-semibold text-stone-700 dark:text-stone-300 text-center font-serif">Your AI Knowledge Base</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {chatHistory.map(msg => <ChatBubble key={msg.id} message={msg} onCiteClick={onCiteClick} />)}
        {isLoading && (
           <div className="flex items-start gap-3 my-4">
            <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <LogoIcon className="w-6 h-6 text-amber-600" />
            </div>
             <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              </div>
             </div>
           </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your journal..."
            className="w-full p-3 border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-full focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-150 ease-in-out placeholder:text-stone-400 dark:placeholder:text-stone-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="p-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 disabled:bg-stone-400 dark:disabled:bg-stone-600 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Send query"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};