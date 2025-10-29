
import React from 'react';
import { SparklesIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="p-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <SparklesIcon className="h-8 w-8 text-indigo-400" />
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          AI Language Coach
        </h1>
      </div>
       <p className="mt-2 text-lg leading-8 text-gray-300">
        Improve your English by chatting with your personal AI tutor.
      </p>
    </header>
  );
};
