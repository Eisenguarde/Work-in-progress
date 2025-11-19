import React from 'react';

export const CompileIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m3 6 3-3 3 3" />
        <path d="m18 21 3-3-3-3" />
        <path d="M6 3v12a2 2 0 0 0 2 2h7" />
        <path d="M21 18v-7a2 2 0 0 0-2-2h-2" />
    </svg>
);