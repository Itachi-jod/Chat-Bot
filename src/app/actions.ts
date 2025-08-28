"use server";

import { config } from "dotenv";
config();

import { unrecognizedCommandAssistance } from "@/ai/flows/unrecognized-command-assistant";
import { askGemini as askGeminiFlow } from "@/ai/flows/ask-gemini-flow";
import axios from "axios";
import { parse } from "url";


const SEARCH_API = "https://ytbr-azure.vercel.app/api/yt?type=search&q=";
const DOWNLOAD_API = "https://dens-yt-dl0-cf47.onrender.com/api/download?url=";
const MP3_DOWNLOAD_API = "https://kaiz-apis.gleeze.com/api/ytmp3-v2";
const KAIZJI_API_KEY = "ed9ad8f5-3f66-4178-aec2-d3ab4f43ad0d";
const PINTEREST_API = "https://www.bhandarimilan.info.np/api/pinterest?query=";
const XVIDEOS_API = "https://kaiz-apis.gleeze.com/api/xvideos";
const FLUX_API = "https://kaiz-apis.gleeze.com/api/flux";
const GEMINI_API = "https://kaiz-apis.gleeze.com/api/gemini";


type VideoStream = {
  quality: string;
  download_url: string;
  size?: string;
  key: string;
};

type VideoSearchResult = {
  title?: string;
  streams?: VideoStream[];
  error?: string;
};

export async function searchVideo(query: string): Promise<VideoSearchResult> {
  try {
    let videoUrl = "";
    let videoTitle = "";

    const ytMatch = query.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      videoUrl = query;
    } else {
      const searchRes = await fetch(SEARCH_API + encodeURIComponent(query));
      if (!searchRes.ok) throw new Error("Failed to search for video.");
      
      const searchData = await searchRes.json();
      const videos = searchData.data?.items;
      if (!videos || videos.length === 0) {
        return { error: "No video found." };
      }
      videoUrl = videos[0].url;
      videoTitle = videos[0].title;
    }

    const downloadRes = await fetch(DOWNLOAD_API + encodeURIComponent(videoUrl));
    if (!downloadRes.ok) {
        throw new Error(`Failed to fetch download links. ${DOWNLOAD_API}${encodeURIComponent(videoUrl)}`);
    }

    const downloadData = await downloadRes.json();
    const streamsData = downloadData.response;
    
    if (!streamsData || typeof streamsData !== 'object' || Object.keys(streamsData).length === 0) {
      return { error: "No downloadable video found." };
    }
    
    if (!videoTitle) {
      // Fallback for direct URL pastes where search didn't happen
      const firstStreamKey = Object.keys(streamsData)[0];
      const firstStream = streamsData[firstStreamKey];
      // a bit of a hack to get a title if possible
      videoTitle = firstStream.title ? firstStream.title.replace(/\s*\([^)]+\)\.mp4$/, '') : "Untitled Video";
    }

    const streams = Object.keys(streamsData).map(key => ({
      key,
      quality: key,
      download_url: streamsData[key].download_url,
      size: streamsData[key].size || 'N/A',
    }));

    return {
      title: videoTitle,
      streams,
    };
  } catch (err: any) {
    console.error(err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function getUnrecognizedCommandSuggestion(command: string) {
  return await unrecognizedCommandAssistance({ command });
}

export async function getWaikoImage(type: 'waifu' | 'neko' | 'random') {
    try {
        let apiUrl;
        if (type === "waifu") {
          apiUrl = "https://dens-waifu.vercel.app/api/waifu";
        } else if (type === "neko") {
          apiUrl = "https://dens-waifu.vercel.app/api/neko";
        } else {
          apiUrl = Math.random() < 0.5
            ? "https://dens-waifu.vercel.app/api/waifu"
            : "https://dens-waifu.vercel.app/api/neko";
        }
        const res = await axios.get(apiUrl);
        return res.data; // { image, category }
    } catch (error) {
        console.error("Waiko API error:", error);
        return { error: "Failed to fetch waifu/neko image." };
    }
}


export async function getSong(query: string) {
    try {
        const searchRes = await axios.get(SEARCH_API + encodeURIComponent(query));
        const results = searchRes.data;
        const videos = results.data?.items;

        if (!videos || videos.length === 0) {
          return { error: "No songs found for this query." };
        }
        const video = videos[0];
        const videoUrl = video.url;

        const downloadRes = await axios.get(`${MP3_DOWNLOAD_API}?url=${encodeURIComponent(videoUrl)}&apikey=${KAIZJI_API_KEY}`);
        const downloadData = downloadRes.data;
        
        if (!downloadData || !downloadData.download_url) {
          console.error("Audio API response error:", downloadData);
          return { error: "Could not fetch MP3 URL from API." };
        }

        return { title: downloadData.title || video.title, download_url: downloadData.download_url };
    } catch (err: any) {
        console.error("Sing command error:", err);
        return { error: err.message || "An unexpected error occurred." };
    }
}

export async function askGemini(question: string) {
    try {
      const url = `${GEMINI_API}?prompt=${encodeURIComponent(question)}&apikey=${KAIZJI_API_KEY}`;
      const res = await axios.get(url);
      if (res.data?.response) {
        return { response: res.data.response };
      } else {
        return { error: "Could not get a response from Gemini." };
      }
    } catch (err: any) {
        console.error("Gemini API error:", err);
        return { error: err.message || "An unexpected error occurred while contacting Gemini API." };
    }
}

export async function getFluxImage(prompt: string) {
  if (!prompt) {
    return { error: "Please provide a prompt for the image." };
  }
  try {
    const url = `${FLUX_API}?prompt=${encodeURIComponent(prompt)}&apikey=${KAIZJI_API_KEY}`;
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const imageUrl = `data:image/jpeg;base64,${Buffer.from(res.data, 'binary').toString('base64')}`;
    return { imageUrl };
  } catch (err: any) {
    console.error("Flux API error:", err);
    return { error: err.message || "Failed to generate image." };
  }
}

export async function getPinterestImages(query: string, amount: number) {
  try {
    const res = await axios.get(`${PINTEREST_API}${encodeURIComponent(query)}`);
    const data = res.data?.data || [];
    if (!data.length) {
      return { error: `No results found for: ${query}` };
    }
    return { images: data.slice(0, amount) };
  } catch (error) {
    console.error("Pinterest API error:", error);
    return { error: "Failed to fetch Pinterest images." };
  }
}

export async function getQuote() {
  try {
    const res = await axios.get("https://motivational-api-theta.vercel.app/random");
    return { quote: res.data.quote || "Stay motivated!" };
  } catch (err) {
    console.error("Quote API error:", err);
    return { error: "Failed to fetch a quote. Stay motivated!" };
  }
}

export async function getTikTokUserInfo(username: string) {
  if (!username) {
    return { error: "Please provide a TikTok username." };
  }
  const url = `https://kaiz-apis.gleeze.com/api/tikstalk?username=${username}&apikey=${KAIZJI_API_KEY}`;
  try {
    const res = await axios.get(url);
    if (res.data) {
      return { data: res.data };
    } else {
      return { error: "Failed to fetch TikTok user info."}
    }
  } catch (err: any) {
    console.error("TikTok Stalk API error:", err);
    return { error: err.response?.data?.message || "Failed to fetch TikTok user info." };
  }
}

export async function getRoast(name?: string) {
  const roastName = name || 'buddy';
  try {
    const res = await axios.get(`https://fyuk.vercel.app/roast?name=${encodeURIComponent(roastName)}`);
    const roast = res.data?.roast?.trim();
    if (!roast) throw new Error("Empty roast response");
    return { roast };
  } catch (err) {
    console.error("Roast API error:", err);
    try {
      // Fallback API
      const fallbackRes = await axios.get("https://evilinsult.com/generate_insult.php?lang=en&type=json");
      const insult = fallbackRes.data.insult;
      return { roast: `${roastName}, ${insult}` };
    } catch (fallbackErr) {
      console.error("Fallback Roast API error:", fallbackErr);
      return { error: "Failed to fetch a roast. You're safe... for now." };
    }
  }
}

const PLATFORM_API_MAP = {
    "instagram": "/api/meta/download",
    "facebook": "/api/meta/download",
    "tiktok": "/api/tiktok/download",
    "youtube": "/api/youtube/download",
    "reddit": "/api/reddit/download",
    "pinterest": "/api/pinterest/download",
    "threads": "/api/threads/download",
    "linkedin": "/api/linkedin/download",
    "twitter": "/api/twitter/download",
    "x.com": "/api/twitter/download"
};

async function expandTikTokUrl(shortUrl: string) {
    try {
        const res = await axios.get(shortUrl, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });
        if (res.status === 301 || res.status === 302) {
            return res.headers.location;
        }
        return shortUrl;
    } catch (err: any) {
        if (err.response && (err.response.status === 301 || err.response.status === 302)) {
            return err.response.headers.location;
        }
        return shortUrl;
    }
}

export async function downloadFromUrl(url: string) {
    try {
        let finalUrl = url.replace(/\?$/, "");
        let hostname = parse(finalUrl).hostname?.toLowerCase() || '';

        if (hostname.includes("tiktok") && finalUrl.includes("vt.tiktok.com")) {
            const expandedUrl = await expandTikTokUrl(finalUrl);
            if (expandedUrl) {
                finalUrl = expandedUrl;
                hostname = parse(finalUrl).hostname?.toLowerCase() || '';
            }
        }

        let apiEndpoint: string | null = null;
        for (const key in PLATFORM_API_MAP) {
            if (hostname.includes(key)) {
                apiEndpoint = (PLATFORM_API_MAP as any)[key];
                break;
            }
        }

        if (!apiEndpoint) {
            return { error: `Unsupported platform: ${hostname}` };
        }

        const apiUrl = `https://universaldownloaderapi.vercel.app${apiEndpoint}?url=${encodeURIComponent(finalUrl)}`;
        const res = await axios.get(apiUrl, { timeout: 30000 });
        const data = res.data;

        let videoUrl = null;
        let title = "Downloaded Video";

        if (hostname.includes("instagram") || hostname.includes("facebook")) {
            videoUrl = data?.data?.data?.[0]?.url;
            title = data?.data?.data?.[0]?.title || `Instagram/Facebook Video`;
        } else if (hostname.includes("tiktok")) {
            videoUrl = data?.data?.video_no_watermark?.url || data?.data?.video_watermark?.url;
            title = data?.data?.title || "TikTok Video";
        } else if (hostname.includes("youtube")) {
            videoUrl = data?.download_url;
            title = data?.title || "YouTube Video";
        } else if (hostname.includes("reddit") || hostname.includes("twitter") || hostname.includes("x.com")) {
            videoUrl = data?.data?.[0]?.video_url;
            title = data?.data?.[0]?.title || `Video from ${hostname}`;
        }

        if (!videoUrl || !videoUrl.startsWith("http")) {
            console.error("API response missing video URL:", data);
            return { error: "Failed to get a downloadable video URL from the API." };
        }

        return { title, videoUrl };

    } catch (err: any) {
        console.error("Universal Downloader Error:", err.message || err);
        return { error: "Failed to download video from the provided link." };
    }
}

export async function getXVideo(query?: string) {
    try {
        let url;
        if (query) {
            url = `${XVIDEOS_API}/search?q=${encodeURIComponent(query)}&apikey=${KAIZJI_API_KEY}`;
        } else {
            const randomPage = Math.floor(Math.random() * 50) + 1;
            url = `${XVIDEOS_API}?page=${randomPage}&limit=30&apikey=${KAIZJI_API_KEY}`;
        }

        const res = await axios.get(url);
        const data = res.data;

        if (!data.videos || data.videos.length === 0) {
            return { error: "No videos found." };
        }

        const randomVideo = data.videos[Math.floor(Math.random() * data.videos.length)];

        return {
            title: randomVideo.title,
            videoUrl: randomVideo.mp4url,
        };
    } catch (err: any) {
        console.error("XVideo API error:", err);
        return { error: err.message || "An unexpected error occurred while fetching video." };
    }
}
