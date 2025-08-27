"use server";

import { config } from "dotenv";
config();

import { unrecognizedCommandAssistance } from "@/ai/flows/unrecognized-command-assistant";
import { askGemini as askGeminiFlow } from "@/ai/flows/ask-gemini-flow";
import axios from "axios";

const SEARCH_API = "https://ytbr-azure.vercel.app/api/yt?type=search&q=";
const DOWNLOAD_API = "https://dens-yt-dl0-cf47.onrender.com/api/download?url=";
const MP3_DOWNLOAD_API = "https://kaiz-apis.gleeze.com/api/ytmp3-v2";
const KAIZJI_API_KEY = "ed9ad8f5-3f66-4178-aec2-d3ab4f43ad0d";
const PINTEREST_API = "https://www.bhandarimilan.info.np/api/pinterest?query=";


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
        
        if (downloadData.status !== true || !downloadData.result?.url) {
          console.error("Audio API response error:", downloadData);
          return { error: "Could not fetch MP3 URL from API." };
        }

        return { title: downloadData.result.title || video.title, download_url: downloadData.result.url };
    } catch (err: any) {
        console.error("Sing command error:", err);
        return { error: err.message || "An unexpected error occurred." };
    }
}

export async function askGemini(question: string) {
    try {
        const result = await askGeminiFlow({ question });
        return { response: result.answer };
    } catch (err: any) {
        console.error("Gemini API error:", err);
        return { error: err.message || "An unexpected error occurred while contacting Gemini API." };
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
