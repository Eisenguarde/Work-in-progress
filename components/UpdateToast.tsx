
import React from 'react';

interface UpdateToastProps {
  show: boolean;
  onUpdate: () => void;
}

export const UpdateToast: React.FC<UpdateToastProps> = ({ show, onUpdate }) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className="bg-stone-800 dark:bg-stone-700 text-white px-4 py-3 rounded-lg shadow-xl flex items-center justify-between border border-amber-500/50">
        <div className="flex flex-col">
            <span className="font-semibold text-sm">Update Available</span>
            <span className="text-xs text-stone-300">A new version of the app is ready.</span>
        </div>
        <button
          onClick={onUpdate}
          className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-1.5 px-4 rounded-md transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};
