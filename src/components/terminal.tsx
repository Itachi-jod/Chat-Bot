"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getUnrecognizedCommandSuggestion, searchVideo } from '@/app/actions';
import TypingAnimation from './typing-animation';
import { useToast } from "@/hooks/use-toast";

type HistoryItem = {
  id: number;
  content: React.ReactNode;
};

const UserPrompt = () => (
  <span className="text-accent">
    [user@cyberstream]~${' '}
  </span>
);

const HelpComponent = () => (
  <div>
    <p className="text-primary font-bold mb-2">CyberStream Command List</p>
    <ul className="list-disc list-inside">
      <li><span className="text-accent font-bold">video [search|url]</span> - Search and play a YouTube video.</li>
      <li><span className="text-accent font-bold">theme [purple|green|blue|red]</span> - Changes the terminal color scheme.</li>
      <li><span className="text-accent font-bold">help</span> - Displays this list of commands.</li>
      <li><span className="text-accent font-bold">clear</span> - Clears the terminal history.</li>
      <li><span className="text-accent font-bold">welcome</span> - Shows the welcome message again.</li>
    </ul>
  </div>
);

const WelcomeComponent = () => (
  <div>
    <h1 className="text-2xl text-primary font-bold mb-2 text-glow">Welcome to CyberStream</h1>
    <p>A futuristic hacker-style web bot interface.</p>
    <p>Type <span className="text-accent">'help'</span> to see a list of available commands.</p>
  </div>
);

export default function Terminal() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const endOfHistoryRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const addHistory = useCallback((item: React.ReactNode) => {
    setHistory(prev => [...prev, { id: Date.now() + Math.random(), content: item }]);
  }, []);

  useEffect(() => {
    addHistory(<TypingAnimation text="Initializing CyberStream..." onComplete={() => addHistory(<WelcomeComponent />)} />);
  }, [addHistory]);

  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSetTheme = (theme: string) => {
    const root = document.documentElement;
    switch(theme) {
      case 'green':
        root.style.setProperty('--primary', '128 100% 51%');
        root.style.setProperty('--accent', '128 100% 51%');
        break;
      case 'blue':
        root.style.setProperty('--primary', '217 91% 60%');
        root.style.setProperty('--accent', '217 91% 60%');
        break;
      case 'red':
          root.style.setProperty('--primary', '0 84% 60%');
          root.style.setProperty('--accent', '0 84% 60%');
        break;
      default: // purple
        root.style.setProperty('--primary', '288 83% 55%');
        root.style.setProperty('--accent', '128 100% 51%');
    }
  };

  const handleCommand = async (command: string) => {
    const [cmd, ...args] = command.trim().split(' ');
    const query = args.join(' ');
    
    addHistory(
      <p>
        <UserPrompt />
        <span className="text-foreground">{command}</span>
      </p>
    );

    setIsProcessing(true);

    switch (cmd.toLowerCase()) {
      case 'help':
        addHistory(<HelpComponent />);
        break;
      case 'clear':
        setHistory([]);
        break;
      case 'welcome':
        addHistory(<WelcomeComponent />);
        break;
      case 'theme':
        const theme = (args[0] || 'purple').toLowerCase();
        if (['purple', 'green', 'blue', 'red'].includes(theme)) {
          handleSetTheme(theme);
          addHistory(<p>Theme changed to <span className="text-primary">{theme}</span>.</p>);
        } else {
          addHistory(<p className="text-red-500">Error: Invalid theme. Available themes: purple, green, blue, red.</p>);
        }
        break;
      case 'video':
        if (!query) {
          addHistory(<p className="text-red-500">Error: Please provide a search term or a YouTube URL.</p>);
          break;
        }
        addHistory(<p>Searching for video: <span className="text-primary">{query}</span>...</p>);
        const result = await searchVideo(query);
        if (result.error) {
          addHistory(<p className="text-red-500">Error: {result.error}</p>);
        } else if (result.streams && result.streams.length > 0) {
            const videoStream = result.streams.find(s => s.quality?.includes('720p')) || result.streams.find(s => s.quality?.includes('360p')) || result.streams[0];
            addHistory(
              <div>
                <p>Now playing: <span className="font-bold text-primary">{result.title}</span> ({videoStream.quality})</p>
                <video controls className="w-full max-w-2xl mt-2 rounded border-glow">
                  <source src={videoStream.download_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                 <p className="mt-2">Other downloads:</p>
                 <ul className="list-disc list-inside ml-4">
                  {result.streams?.map((stream) => (
                    <li key={stream.key}>
                      <a 
                        href={stream.download_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        download
                        className="text-accent hover:text-glow hover:underline"
                        onClick={() => toast({ title: "Download Started", description: `Downloading ${result.title} (${stream.quality})`})}
                      >
                        {stream.quality} ({stream.size})
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
        } else {
          addHistory(<p className="text-red-500">Error: No video streams found.</p>);
        }
        break;
      default:
        const suggestion = await getUnrecognizedCommandSuggestion(command);
        addHistory(
          <div>
            <p>Command not recognized: <span className="text-red-500">{command}</span></p>
            <p className="text-primary">Suggestion: {suggestion.suggestion}</p>
          </div>
        );
        break;
    }
    setIsProcessing(false);
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    handleCommand(input);
    setInput('');
  };

  return (
    <div className="h-full w-full bg-black/75 backdrop-blur-sm flex flex-col p-4 font-mono text-sm md:text-base">
      <div className="flex-grow overflow-y-auto pr-2">
        {history.map(item => (
          <div key={item.id} className="mb-2">
            {item.content}
          </div>
        ))}
        {isProcessing && <div className="text-accent">Processing...</div>}
        <div ref={endOfHistoryRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
        <label htmlFor="command-input" className="text-accent flex-shrink-0">
          [user@cyberstream]~$
        </label>
        <input
          id="command-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 outline-none text-accent placeholder-gray-500 text-glow"
          placeholder="Type a command..."
          autoFocus
          disabled={isProcessing}
        />
        <div className={`w-2 h-4 bg-accent animate-blink ${isProcessing ? 'hidden' : ''}`} />
      </form>
    </div>
  );
}
