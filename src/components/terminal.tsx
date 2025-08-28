"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getUnrecognizedCommandSuggestion, searchVideo, getWaikoImage, getSong, askGemini, getPinterestImages, getQuote, getTikTokUserInfo, getRoast, downloadFromUrl, getXVideo, getFluxImage, searchTikTokVideo, getShotiVideo, getPickUpLine, getAnimeInfo } from '@/app/actions';
import TypingAnimation from './typing-animation';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { useAuth } from './auth-provider';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';

type HistoryItem = {
  id: number;
  content: React.ReactNode;
};

const UserPrompt = ({ user }: { user: string | null }) => (
  <span className="text-accent">
    [{user || 'user'}@cyberstream]~${' '}
  </span>
);

const HelpComponent = () => (
  <div>
    <p className="text-primary font-bold mb-2">CyberStream Command List</p>
    <ul className="list-disc list-inside">
      <li><span className="text-accent font-bold">gemini [question]</span> - Ask a question to Gemini AI.</li>
      <li><span className="text-accent font-bold">flux [prompt]</span> - Generate an image with Flux.</li>
      <li><span className="text-accent font-bold">video [search|url]</span> - Search for a video and play it.</li>
      <li><span className="text-accent font-bold">sing [song name]</span> - Search for a song and play the audio.</li>
      <li><span className="text-accent font-bold">dl [URL]</span> - Download video from a URL (IG, FB, YT, etc.).</li>
      <li><span className="text-accent font-bold">waiko [waifu|neko]</span> - Display a random waifu or neko image.</li>
      <li><span className="text-accent font-bold">pinterest [query] [amount]</span> - Get images from Pinterest.</li>
      <li><span className="text-accent font-bold">tikstalk [username]</span> - Stalk a TikTok user's profile.</li>
      <li><span className="text-accent font-bold">tiksearch [query]</span> - Search for a TikTok video.</li>
      <li><span className="text-accent font-bold">xv [query]</span> - Search for a video. Use `xv` for random.</li>
      <li><span className="text-accent font-bold">shoti</span> - Get a random short video.</li>
      <li><span className="text-accent font-bold">anime [title] [episode]</span> - Get info about an anime episode.</li>
      <li><span className="text-accent font-bold">quote</span> - Get a random motivational quote.</li>
      <li><span className="text-accent font-bold">pickupline</span> - Get a random pick-up line.</li>
      <li><span className="text-accent font-bold">attack [name]</span> - Get a roast for someone.</li>
      <li><span className="text-accent font-bold">theme [purple|green|blue|red]</span> - Changes the terminal color scheme.</li>
      <li><span className="text-accent font-bold">status</span> - Display system and session status.</li>
      <li><span className="text-accent font-bold">clock</span> - Toggle the live digital clock.</li>
      <li><span className="text-accent font-bold">contact</span> - Show owner's contact information.</li>
      <li><span className="text-accent font-bold">logout</span> - Logs out the current user.</li>
      <li><span className="text-accent font-bold">help</span> - Displays this list of commands.</li>
      <li><span className="text-accent font-bold">clear</span> - Clears the terminal history.</li>
      <li><p><span className="text-accent font-bold">welcome</span> - Shows the welcome message again.</p></li>
    </ul>
  </div>
);

const WelcomeComponent = () => (
    <div className="font-mono">
    <pre className="text-primary text-glow text-xs md:text-sm">
      {`
   _____      _            _      _                  
  / ____|    | |          | |    (_)                 
 | |    _   _| |__   ___  | |_    _  _ __ ___   __ _ 
 | |   | | | | '_ \\ / _ \\ | __|  | || '_ \` _ \\ / _\` |
 | |___| |_| | |_) |  __/ | |_   | || | | | | | (_| |
  \\_____\\__,_|_.__/ \\___|  \\__|  |_||_| |_| |_|\\__,_|
      `}
    </pre>
    <p className="mt-2">A futuristic hacker-style web bot interface.</p>
    <p>Type <span className="text-accent font-bold">'help'</span> to see a list of available commands.</p>
  </div>
);


const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-accent text-glow">
      <Clock size={16} />
      <span>{time.toLocaleTimeString()}</span>
    </div>
  );
};


export default function Terminal() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [theme, setTheme] = useState('purple');
  const [showClock, setShowClock] = useState(true);
  const [startTime] = useState(Date.now());
  const endOfHistoryRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const router = useRouter();


  const addHistory = useCallback((item: React.ReactNode) => {
    setHistory(prev => [...prev, { id: Date.now() + Math.random(), content: item }]);
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      addHistory(<TypingAnimation text="Initializing CyberStream..." onComplete={() => addHistory(<WelcomeComponent />)} />);
    }
  }, [addHistory]);

  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSetTheme = (newTheme: string) => {
    const root = document.documentElement;
    setTheme(newTheme);
    let primaryColor, accentColor;

    switch(newTheme) {
      case 'purple':
        primaryColor = '290 82% 65%'; 
        accentColor = '128 100% 51%';
        break;
      case 'blue':
        primaryColor = '217 91% 60%';
        accentColor = '190 91% 60%';
        break;
      case 'red':
        primaryColor = '0 84% 60%';
        accentColor = '30 100% 50%';
        break;
      default: // green
        primaryColor = '128 100% 51%';
        accentColor = '100 100% 51%';
    }
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--accent', accentColor);
  };

  const getUptime = () => {
    const now = Date.now();
    const uptimeMs = now - startTime;
    const seconds = Math.floor((uptimeMs / 1000) % 60);
    const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  const handleCommand = async (command: string) => {
    const [cmd, ...args] = command.trim().split(' ');
    const query = args.join(' ');
    
    addHistory(
      <p>
        <UserPrompt user={user} />
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
      case 'contact':
        addHistory(
          <div>
            <p className="text-primary font-bold">Owner Contact Information:</p>
            <p>Phone: 9815598649</p>
          </div>
        );
        break;
      case 'logout':
        addHistory(<p>Logging out...</p>);
        setTimeout(() => logout(), 1000);
        break;
      case 'status':
        addHistory(
          <div>
            <p><span className="text-primary">User:</span> {user}</p>
            <p><span className="text-primary">Theme:</span> {theme}</p>
            <p><span className="text-primary">Uptime:</span> {getUptime()}</p>
          </div>
        );
        break;
      case 'theme':
        const newTheme = (args[0] || 'purple').toLowerCase();
        if (['purple', 'green', 'blue', 'red'].includes(newTheme)) {
          handleSetTheme(newTheme);
          addHistory(<p>Theme changed to <span className="text-primary">{newTheme}</span>.</p>);
        } else {
          addHistory(<p className="text-red-500">Error: Invalid theme. Available themes: purple, green, blue, red.</p>);
        }
        break;
      case 'clock':
        setShowClock(prev => !prev);
        addHistory(<p>Digital clock {showClock ? 'hidden' : 'shown'}.</p>);
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
                        {stream.quality || 'Unknown quality'} ({stream.size})
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
      case 'waiko':
      case 'w':
        const type = (args[0]?.toLowerCase() as any) || 'random';
        if (['waifu', 'neko', 'random'].includes(type)) {
            addHistory(<p>Fetching {type} image...</p>);
            const imgData = await getWaikoImage(type);
            if (imgData.error) {
                addHistory(<p className="text-red-500">Error: {imgData.error}</p>);
            } else {
                addHistory(
                    <div>
                        <p>Category: <span className="text-primary">{imgData.category}</span></p>
                        <Image src={imgData.image} alt={imgData.category} width={300} height={400} className="rounded-lg border-glow mt-2" />
                    </div>
                )
            }
        } else {
             addHistory(<p className="text-red-500">Error: Invalid type. Available types: waifu, neko.</p>);
        }
        break;
      case 'sing':
        if (!query) {
          addHistory(<p className="text-red-500">Error: Please provide a song name to search for.</p>);
          break;
        }
        addHistory(<p>Searching for song: <span className="text-primary">{query}</span>...</p>);
        const songResult = await getSong(query);
        if (songResult.error) {
            addHistory(<p className="text-red-500">Error: {songResult.error}</p>);
        } else {
            addHistory(
                <div>
                    <p>Now playing: <span className="font-bold text-primary">{songResult.title}</span></p>
                    <audio controls className="w-full max-w-2xl mt-2">
                        <source src={songResult.download_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )
        }
        break;
      case 'ask':
      case 'gemini':
        if (!query) {
          addHistory(<p className="text-red-500">Error: Please provide a question.</p>);
          break;
        }
        addHistory(<p>Asking Gemini: <span className="text-primary">{query}</span>...</p>);
        const geminiResult = await askGemini(query, user || 'guest');
        if (geminiResult.error) {
            addHistory(<p className="text-red-500">Error: {geminiResult.error}</p>);
        } else {
            addHistory(
                <div>
                    <p className="text-primary font-bold">Gemini says:</p>
                    <p>{geminiResult.response}</p>
                </div>
            )
        }
        break;
       case 'flux':
        if (!query) {
          addHistory(<p className="text-red-500">Error: Please provide a prompt for the image.</p>);
          break;
        }
        addHistory(<p>Generating image with Flux for: <span className="text-primary">{query}</span>...</p>);
        const fluxResult = await getFluxImage(query);
        if (fluxResult.error) {
          addHistory(<p className="text-red-500">Error: {fluxResult.error}</p>);
        } else if (fluxResult.imageUrl) {
          addHistory(
            <Image src={fluxResult.imageUrl} alt={`Flux image for: ${query}`} width={512} height={512} className="rounded-lg border-glow mt-2" />
          );
        }
        break;
      case 'pinterest':
      case 'pin':
        const searchKeyword = args[0];
        if (!searchKeyword) {
          addHistory(<p className="text-red-500">Error: Please provide a search keyword.</p>);
          break;
        }
        let amount = parseInt(args[1]) || 5;
        if (isNaN(amount) || amount < 1) amount = 5;
        if (amount > 70) amount = 70;
        
        addHistory(<p>Searching Pinterest for <span className="text-primary">{searchKeyword}</span>...</p>);
        const pinResult = await getPinterestImages(searchKeyword, amount);

        if (pinResult.error) {
          addHistory(<p className="text-red-500">Error: {pinResult.error}</p>);
        } else if (pinResult.images && pinResult.images.length > 0) {
          addHistory(
            <div>
              <p>Pinterest results for: <span className="font-bold text-primary">{searchKeyword}</span></p>
              <div className="flex flex-wrap gap-2 mt-2">
                {pinResult.images.map((url, index) => (
                  <a href={url} target="_blank" rel="noopener noreferrer" key={index}>
                    <Image src={url} alt={`Pinterest image ${index + 1}`} width={150} height={200} className="rounded-lg border-glow object-cover" />
                  </a>
                ))}
              </div>
            </div>
          );
        } else {
          addHistory(<p className="text-red-500">Error: No images found.</p>);
        }
        break;
      case 'quote':
        addHistory(<p>Fetching a quote...</p>);
        const quoteResult = await getQuote();
        if (quoteResult.error) {
          addHistory(<p className="text-red-500">Error: {quoteResult.error}</p>);
        } else {
          addHistory(<p className="text-primary italic">"{quoteResult.quote}"</p>);
        }
        break;
      case 'pickupline':
        addHistory(<p>Fetching a pick-up line...</p>);
        const pickuplineResult = await getPickUpLine();
        if (pickuplineResult.error) {
          addHistory(<p className="text-red-500">Error: {pickuplineResult.error}</p>);
        } else {
          addHistory(<p className="text-primary italic">"{pickuplineResult.pickupline}"</p>);
        }
        break;
      case 'tikstalk':
        const username = args[0];
        if (!username) {
            addHistory(<p className="text-red-500">Error: Please provide a TikTok username.</p>);
            break;
        }
        addHistory(<p>Stalking TikTok user: <span className="text-primary">{username}</span>...</p>);
        const tiktokResult = await getTikTokUserInfo(username);

        if (tiktokResult.error) {
            addHistory(<p className="text-red-500">Error: {tiktokResult.error}</p>);
        } else if (tiktokResult.data) {
            const info = tiktokResult.data;
            addHistory(
                <div className="flex items-start gap-4">
                    <Image src={info.avatarLarger} alt={info.nickname} width={80} height={80} className="rounded-full border-glow" />
                    <div className="text-sm">
                        <p><span className="text-primary font-bold">Nickname:</span> {info.nickname}</p>
                        <p><span className="text-primary font-bold">Username:</span> @{info.username}</p>
                        <p><span className="text-primary font-bold">Bio:</span> {info.signature || "No bio"}</p>
                        <p><span className="text-primary font-bold">Followers:</span> {info.followerCount}</p>
                        <p><span className="text-primary font-bold">Following:</span> {info.followingCount}</p>
                        <p><span className="text-primary font-bold">Likes:</span> {info.heartCount}</p>
                        <p><span className="text-primary font-bold">Videos:</span> {info.videoCount}</p>
                    </div>
                </div>
            )
        }
        break;
      case 'attack':
        const targetName = args.join(' ') || undefined;
        addHistory(<p>Generating roast for <span className="text-primary">{targetName || '...an unnamed victim'}</span>...</p>);
        const roastResult = await getRoast(targetName);
        if (roastResult.error) {
          addHistory(<p className="text-red-500">Error: {roastResult.error}</p>);
        } else {
          addHistory(<p className="text-red-400 select-all">{roastResult.roast}</p>);
        }
        break;
      case 'dl':
        const url = args[0];
        if (!url) {
            addHistory(<p className="text-red-500">Error: Please provide a URL to download from.</p>);
            break;
        }
        addHistory(<p>Fetching video from <span className="text-primary">{url}</span>...</p>);
        const dlResult = await downloadFromUrl(url);

        if (dlResult.error) {
            addHistory(<p className="text-red-500">Error: {dlResult.error}</p>);
        } else if (dlResult.videoUrl) {
            addHistory(
                <div>
                    <p>Now playing: <span className="font-bold text-primary">{dlResult.title}</span></p>
                    <video controls className="w-full max-w-2xl mt-2 rounded border-glow">
                        <source src={dlResult.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )
        }
        break;
        case 'xv':
            addHistory(<p>Searching for a special video...</p>);
            const xvResult = await getXVideo(query);
            if (xvResult.error) {
                addHistory(<p className="text-red-500">Error: {xvResult.error}</p>);
            } else if (xvResult.streams && xvResult.streams.length > 0) {
                const videoStream = xvResult.streams.find(s => s.quality?.includes('High')) || xvResult.streams[0];
                 addHistory(
                  <div>
                    <p>Now playing: <span className="font-bold text-primary">{xvResult.title}</span> ({videoStream.quality})</p>
                    <video controls className="w-full max-w-2xl mt-2 rounded border-glow">
                      <source src={videoStream.download_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                     <p className="mt-2">Other downloads:</p>
                     <ul className="list-disc list-inside ml-4">
                      {xvResult.streams?.map((stream) => (
                        <li key={stream.key}>
                          <a 
                            href={stream.download_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            download
                            className="text-accent hover:text-glow hover:underline"
                            onClick={() => toast({ title: "Download Started", description: `Downloading ${xvResult.title} (${stream.quality})`})}
                          >
                            {stream.quality || 'Unknown quality'} ({stream.size})
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
    case 'tiksearch':
        if (!query) {
          addHistory(<p className="text-red-500">Error: Please provide a search query.</p>);
          break;
        }
        addHistory(<p>Searching TikTok for: <span className="text-primary">{query}</span>...</p>);
        const tikSearchResult = await searchTikTokVideo(query);
        if (tikSearchResult.error) {
          addHistory(<p className="text-red-500">Error: {tikSearchResult.error}</p>);
        } else if (tikSearchResult.videoUrl) {
          addHistory(
            <div>
              <p>Now playing: <span className="font-bold text-primary">{tikSearchResult.title}</span></p>
              <video controls className="w-full max-w-2xl mt-2 rounded border-glow">
                <source src={tikSearchResult.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          );
        }
        break;
    case 'shoti':
        addHistory(<p>Fetching a random shoti video...</p>);
        const shotiResult = await getShotiVideo();
        if (shotiResult.error) {
            addHistory(<p className="text-red-500">Error: {shotiResult.error}</p>);
        } else if (shotiResult.videoUrl) {
            addHistory(
                <div>
                    <p>Video from: <span className="font-bold text-primary">{shotiResult.nickname}</span></p>
                    <video controls className="w-full max-w-2xl mt-2 rounded border-glow">
                        <source src={shotiResult.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )
        }
        break;
    case 'anime':
        const animeTitle = args[0];
        const animeEpisode = args[1] || '1';
        if (!animeTitle) {
            addHistory(<p className="text-red-500">Error: Please provide an anime title.</p>);
            break;
        }
        addHistory(<p>Fetching anime info for <span className="text-primary">{animeTitle} episode {animeEpisode}</span>...</p>);
        const animeResult = await getAnimeInfo(animeTitle, animeEpisode);
        if (animeResult.error) {
            addHistory(<p className="text-red-500">Error: {animeResult.error}</p>);
        } else if (animeResult.data) {
            const anime = animeResult.data;
            const episodeInfo = anime.episodeList?.[0];
            
            addHistory(
                <div>
                    <p className="text-primary font-bold text-lg">{anime.title} - Episode {episodeInfo?.episode || animeEpisode}</p>
                    <div className="flex gap-4 mt-2">
                        <Image src={anime.thumbnail} alt={anime.title} width={150} height={225} className="rounded-lg border-glow"/>
                        <div>
                            <p><span className="text-accent font-bold">Year:</span> {anime.year}</p>
                            <p><span className="text-accent font-bold">Score:</span> {anime.score}</p>
                            <p><span className="text-accent font-bold">Episodes:</span> {anime.episodes}</p>
                            <p className="mt-2 text-sm italic">{anime.description}</p>
                        </div>
                    </div>
                </div>
            );

            if (episodeInfo?.download_url) {
                addHistory(<p>Attempting to find a playable stream for the episode...</p>);
                const animeDlResult = await downloadFromUrl(episodeInfo.download_url);

                if (animeDlResult.error) {
                    addHistory(<p className="text-red-500">Could not find a playable stream. Here is the download link:</p>);
                    addHistory(
                        <a 
                            href={episodeInfo.download_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-accent hover:text-glow hover:underline"
                        >
                            Download Episode {episodeInfo.episode}
                        </a>
                    );
                } else if (animeDlResult.videoUrl) {
                    addHistory(
                        <div>
                            <p>Now playing: <span className="font-bold text-primary">{animeDlResult.title}</span></p>
                            <video controls className="w-full max-w-2xl mt-2 rounded border-glow">
                                <source src={animeDlResult.videoUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )
                }
            } else {
                 addHistory(<p className="text-red-500">No download link found for this episode.</p>);
            }
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
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg text-primary text-glow">CyberStream</h1>
        {showClock && <DigitalClock />}
      </div>
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
         <UserPrompt user={user} />
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

    