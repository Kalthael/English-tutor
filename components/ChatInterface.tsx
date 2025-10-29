import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ConnectionState, TranscriptMessage, Conversation } from '../types';
import { connectToGemini, getConversationTitle } from '../services/geminiService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ConnectButton } from './ConnectButton';
import { Transcript } from './Transcript';
import { Header } from './Header';
import { Footer } from './Footer';
import { HistorySidebar } from './HistorySidebar';

type LiveSession = Awaited<ReturnType<typeof connectToGemini>>['session'];

export const ChatInterface: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('conversations', []);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const cleanup = useCallback(async () => {
    console.log("Cleaning up audio resources...");
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current && mediaStreamSourceRef.current && audioContextRef.current) {
      try {
        mediaStreamSourceRef.current.disconnect(scriptProcessorRef.current);
        scriptProcessorRef.current.disconnect(audioContextRef.current.destination);
      } catch (e) {
        console.warn("Error disconnecting audio nodes:", e);
      }
      scriptProcessorRef.current = null;
      mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const saveConversation = async () => {
    // Only save new conversations that have more than the initial system message
    if (!currentChatId && transcript.length > 1) {
        console.log("Saving conversation...");
        const title = await getConversationTitle(transcript);
        const newConversation: Conversation = {
            id: Date.now().toString(),
            title,
            transcript,
            createdAt: new Date().toISOString(),
        };
        setConversations(prev => [newConversation, ...prev]);
        console.log("Conversation saved.");
    }
  };

  const handleToggleConnection = useCallback(async () => {
    if (connectionState === ConnectionState.CONNECTED) {
      // --- DISCONNECT ---
      setConnectionState(ConnectionState.IDLE);
      await saveConversation();
      await cleanup();
      setTranscript(prev => [...prev, { role: 'system', content: 'Session ended.' }]);
    } else if (connectionState === ConnectionState.IDLE || connectionState === ConnectionState.ERROR) {
      // --- CONNECT ---
      // If we are connecting on a loaded chat, we should start a new one.
      if (currentChatId) {
          setCurrentChatId(null);
          setTranscript([]);
      }
      setConnectionState(ConnectionState.CONNECTING);
      // Use a function for setTranscript to avoid stale state in callbacks
      setTranscript(() => [{ role: 'system', content: 'Connecting to AI Coach...' }]);
      
      await cleanup();

      try {
        const { session, stream, context, processor, source } = await connectToGemini(
          setTranscript,
          () => {
            setConnectionState(ConnectionState.CONNECTED);
          },
          async () => { // onError callback for mid-session errors
            await cleanup();
            setConnectionState(ConnectionState.ERROR);
            setTranscript(prev => [...prev, { role: 'system', content: `Connection lost. Please try reconnecting.` }]);
          }
        );

        sessionRef.current = session;
        mediaStreamRef.current = stream;
        audioContextRef.current = context;
        scriptProcessorRef.current = processor;
        mediaStreamSourceRef.current = source;

      } catch (error) {
        console.error('Failed to connect to Gemini:', error);
        await cleanup(); // Clean up on initial connection failure
        setConnectionState(ConnectionState.ERROR);
        setTranscript(prev => [...prev, { role: 'system', content: 'Connection failed. Please try again.' }]);
      }
    }
  }, [connectionState, cleanup, transcript, currentChatId, setConversations]);
  
  const handleNewChat = useCallback(() => {
    if (connectionState === ConnectionState.CONNECTED) {
        return;
    }
    setCurrentChatId(null);
    setTranscript([]);
  }, [connectionState]);

  const handleSelectChat = useCallback((id: string) => {
    if (connectionState === ConnectionState.CONNECTED) {
        return; // Can't switch chats while connected
    }
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
        setCurrentChatId(id);
        setTranscript(conversation.transcript);
    }
  }, [conversations, connectionState]);

  const handleDeleteChat = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) {
        handleNewChat();
    }
  }, [currentChatId, setConversations, handleNewChat]);

  // Effect for cleaning up on component unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const sortedConversations = [...conversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
       <HistorySidebar
        conversations={sortedConversations}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-4xl h-full flex flex-col bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
            <Transcript transcript={transcript} />
            <div className="p-6 bg-gray-800 border-t border-gray-700">
              <ConnectButton
                connectionState={connectionState}
                onClick={handleToggleConnection}
              />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}