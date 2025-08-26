"use server";

import { unrecognizedCommandAssistance } from "@/ai/flows/unrecognized-command-assistant";

const SEARCH_API = "https://dns-pxx0.onrender.com/search?query=";
const DOWNLOAD_API = "https://dens-yt-dl0.onrender.com/api/download?url=";

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
