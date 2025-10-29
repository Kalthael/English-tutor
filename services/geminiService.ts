import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
// Fix: Import React types to resolve type errors.
import type { Dispatch, SetStateAction } from 'react';
import type { TranscriptMessage } from '../types';

// --- Gemini System Instruction ---
const SYSTEM_INSTRUCTION = `You are a friendly and encouraging English language tutor. Your name is Alex. 
Engage in a natural conversation with the user. After each user response, first reply conversationally. 
Then, on a new line, provide a 'Feedback:' section. 
In this section, gently correct any grammatical mistakes and offer suggestions for better pronunciation. 
Keep your feedback concise and positive. If there are no mistakes, compliment them on their good English.
For example:
User: "I go to the store yesterday."
Your Response:
It sounds like you had a busy day! What did you get from the store?
Feedback: Great sentence! Just a small correction: since it was yesterday, you would say "I went to the store yesterday." Keep up the great work!`;

// --- Audio Processing Helper Functions ---
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string; } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        const s = Math.max(-1, Math.min(1, data[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

// --- WAV Audio Creation ---
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(output: Int16Array, input: Float32Array) {
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
}

function writeWavHeader(samples: Int16Array, sampleRate: number, numChannels: number, bitDepth: number): DataView {
  const dataSize = samples.length * (bitDepth / 8);
  const fileSize = 44 + dataSize;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  return view;
}

function createWavBlob(audioChunks: Float32Array[], sampleRate: number): Blob | null {
    if (audioChunks.length === 0) return null;

    const totalLength = audioChunks.reduce((acc, val) => acc + val.length, 0);
    const concatenated = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
        concatenated.set(chunk, offset);
        offset += chunk.length;
    }

    const pcmData = new Int16Array(concatenated.length);
    floatTo16BitPCM(pcmData, concatenated);

    const header = writeWavHeader(pcmData, sampleRate, 1, 16);
    
    return new Blob([header, pcmData], { type: 'audio/wav' });
}


// --- Main Service Function ---
export const connectToGemini = async (
    // Fix: Use imported React types.
    setTranscript: Dispatch<SetStateAction<TranscriptMessage[]>>,
    onConnected: () => void,
    onError: () => void
) => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // --- Audio Contexts and State ---
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);
  
  let nextStartTime = 0;
  const sources = new Set<AudioBufferSourceNode>();
  let currentUserAudioChunks: Float32Array[] = [];
  
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  let isNewTurn = true;

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: SYSTEM_INSTRUCTION,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
    callbacks: {
      onopen: () => {
        setTranscript([{ role: 'model', content: "Hello! I'm Alex, your AI language coach. Let's start talking. How are you today?" }]);
        onConnected();
      },
      onmessage: async (message: LiveServerMessage) => {
        // --- Transcription Handling ---
        if (message.serverContent?.inputTranscription) {
          const text = message.serverContent.inputTranscription.text;
          setTranscript(prev => {
            if (isNewTurn) {
              isNewTurn = false;
              return [...prev, { role: 'user', content: text }];
            } else {
              // Fix: Replace findLastIndex with a compatible method to support older JS environments.
              const lastUserMessageIndex = prev.map(m => m.role).lastIndexOf('user');
              if (lastUserMessageIndex !== -1) {
                const newTranscript = [...prev];
                const updatedMessage = {
                  ...newTranscript[lastUserMessageIndex],
                  content: newTranscript[lastUserMessageIndex].content + text,
                };
                newTranscript[lastUserMessageIndex] = updatedMessage;
                return newTranscript;
              } else {
                return [...prev, { role: 'user', content: text }];
              }
            }
          });
        }
        if (message.serverContent?.outputTranscription) {
          const text = message.serverContent.outputTranscription.text;
           setTranscript(prev => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'model') {
                  const updatedLast = { ...last, content: last.content + text };
                  return [...prev.slice(0, -1), updatedLast];
              } else {
                  return [...prev, { role: 'model', content: text, feedback: undefined }];
              }
          });
        }
        if (message.serverContent?.turnComplete) {
            isNewTurn = true;
            const audioBlob = createWavBlob(currentUserAudioChunks, inputAudioContext.sampleRate);
            currentUserAudioChunks = []; // Reset chunks for the next turn

            setTranscript(prev => {
                // Fix: Replace findLastIndex with a compatible method to support older JS environments.
                const lastModelMessageIndex = prev.map(m => m.role).lastIndexOf('model');
                let newTranscript = [...prev];
                // Finalize model feedback
                if (lastModelMessageIndex !== -1) {
                    const last = newTranscript[lastModelMessageIndex];
                     if (last.content && !last.feedback) {
                        const [content, feedback] = last.content.split('Feedback:');
                        const updatedLast = {
                            ...last,
                            content: content.trim(),
                            feedback: feedback ? feedback.trim() : undefined
                        };
                        newTranscript[lastModelMessageIndex] = updatedLast;
                    }
                }
                
                // Add recorded audio to the last user message
                if (audioBlob) {
                  // Fix: Replace findLastIndex with a compatible method to support older JS environments.
                  const lastUserMessageIndex = newTranscript.map(m => m.role).lastIndexOf('user');
                  if (lastUserMessageIndex !== -1) {
                    const updatedUserMessage = {
                      ...newTranscript[lastUserMessageIndex],
                      audio: audioBlob,
                    };
                    newTranscript[lastUserMessageIndex] = updatedUserMessage;
                  }
                }

                return newTranscript;
            });
        }
        
        // --- Audio Output Handling ---
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio) {
            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            source.addEventListener('ended', () => { sources.delete(source); });
            source.start(nextStartTime);
            nextStartTime += audioBuffer.duration;
            sources.add(source);
        }

        if (message.serverContent?.interrupted) {
            for (const source of sources.values()) {
                source.stop();
                sources.delete(source);
            }
            nextStartTime = 0;
        }
      },
      onerror: (e: ErrorEvent) => {
        console.error('Gemini session error:', e);
        onError();
      },
      onclose: (e: CloseEvent) => {
        console.log('Gemini session closed.');
      },
    },
  });

  // --- Audio Input Handling ---
  const source = inputAudioContext.createMediaStreamSource(stream);
  const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (audioProcessingEvent) => {
    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
    currentUserAudioChunks.push(new Float32Array(inputData)); // Store a copy
    const pcmBlob = createBlob(inputData);
    sessionPromise.then((session) => {
      session.sendRealtimeInput({ media: pcmBlob });
    });
  };
  source.connect(processor);
  processor.connect(inputAudioContext.destination);

  const session = await sessionPromise;
  return { session, stream, context: inputAudioContext, processor, source };
};