import React from 'react';
import { Conversation } from '../types';
import { PlusIcon, ChatBubbleLeftRightIcon, TrashIcon } from './Icons';

interface HistorySidebarProps {
  conversations: Conversation[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id:string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ conversations, currentChatId, onSelectChat, onNewChat, onDeleteChat }) => {
    
    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent onSelectChat from firing
        onDeleteChat(id);
    }
    
  return (
    <div className="w-64 bg-gray-900 flex flex-col border-r border-gray-700 flex-shrink-0">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 space-y-1">
          {conversations.map((convo) => (
            <a
              key={convo.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectChat(convo.id);
              }}
              className={`group flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentChatId === convo.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <ChatBubbleLeftRightIcon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{convo.title}</span>
              </div>
              <button
                onClick={(e) => handleDelete(e, convo.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity flex-shrink-0"
                aria-label="Delete conversation"
              >
                  <TrashIcon className="h-5 w-5" />
              </button>
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};
