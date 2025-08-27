"use server";

import { unrecognizedCommandAssistance } from "@/ai/flows/unrecognized-command-assistant";
import axios from "axios";

const SEARCH_API = "https://dns-pxx0.onrender.com/search?query=";
const DOWNLOAD_API = "https://dens-yt-dl0.onrender.com/api/download?url=";
const KAIZJI_API_KEY = "ed9ad8f5-3f66-4178-aec2-d3ab4f43ad0d";


type VideoStream = {
  quality: string;
  download_url: string;
  size: string;
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

    const ytMatch = query.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      videoUrl = query;
    } else {
      const searchRes = await fetch(SEARCH_API + encodeURIComponent(query));
      if (!searchRes.ok) throw new Error("Failed to search for video.");
      
      const searchData = await searchRes.json();
      if (!searchData || searchData.length === 0) {
        return { error: "No video found." };
      }
      videoUrl = searchData[0].url;
    }

    const downloadRes = await fetch(DOWNLOAD_API + encodeURIComponent(videoUrl));
    if (!downloadRes.ok) throw new Error("Failed to fetch download links.");

    const downloadData = await downloadRes.json();
    const streamsData = downloadData.response;

    if (!streamsData) {
      return { error: "No downloadable video found." };
    }

    const streams = Object.keys(streamsData).map(key => ({
      key,
      quality: streamsData[key].quality,
      download_url: streamsData[key].download_url,
      size: streamsData[key].size,
    }));

    return {
      title: downloadData.title,
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
        if (!results || results.length === 0) {
          return { error: "No videos found for this query." };
        }
        const video = results[0];
        const videoUrl = `https://youtu.be/${video.videoId}`;

        const apiUrl = `https://kaiz-apis.gleeze.com/api/ytdown-mp3?url=${encodeURIComponent(videoUrl)}&apikey=${KAIZJI_API_KEY}`;
        const mp3Res = await axios.get(apiUrl);
        
        if (!mp3Res.data?.download_url) {
          return { error: "Could not fetch MP3 URL." };
        }
        return mp3Res.data; // { title, download_url }
    } catch (err: any) {
        console.error("Sing command error:", err);
        return { error: err.message || "An unexpected error occurred." };
    }
}
