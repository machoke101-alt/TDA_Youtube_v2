import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

interface VeoVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export const VeoStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [history, setHistory] = useState<VeoVideo[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setStatusMessage('Initializing Veo 3 engine...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: resolution,
          aspectRatio: aspectRatio
        }
      });

      setStatusMessage('Dreaming up your pixels... (this can take 2-3 minutes)');
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
        
        const progress = Math.floor(Math.random() * 10) + 1; // Fake progress updates
        setStatusMessage(`Refining textures and motion... ${operation.done ? '100%' : 'Processing'}`);
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error('Video URI not found in response');

      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const videoBlob = await videoResponse.blob();
      const videoUrl = URL.createObjectURL(videoBlob);

      const newVideo: VeoVideo = {
        id: crypto.randomUUID(),
        url: videoUrl,
        prompt: prompt,
        timestamp: Date.now()
      };

      setHistory(prev => [newVideo, ...prev]);
      setPrompt('');
      setStatusMessage('Video generated successfully!');
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('Requested entity was not found')) {
        setHasApiKey(false);
        setStatusMessage('API Key invalid or not found. Please re-select.');
      } else {
        setStatusMessage('Error: ' + error.message);
      }
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20">
          <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Google Veo 3 Studio</h2>
        <p className="text-gray-400 max-w-md mb-8">
          To generate high-quality AI videos, you must use a paid API Key from a Google Cloud Project with billing enabled.
        </p>
        <button 
          onClick={handleSelectKey}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          Select Paid API Key
        </button>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="mt-4 text-xs text-indigo-400 hover:underline">
          Learn more about billing
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 animate-fade-in pb-20">
      <div className="bg-gray-800/20 border border-gray-700/50 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-600/10 rounded-2xl">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Automated Video Creation</h2>
            <p className="text-sm text-gray-400">Powered by Google Veo 3.1 Fast</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to generate (e.g., 'A cinematic shot of a cyberpunk city at night with neon lights reflecting on wet streets...')"
              className="w-full h-40 bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none"
              disabled={isGenerating}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              <div className="flex bg-black/40 rounded-xl border border-gray-700 p-1">
                <button onClick={() => setAspectRatio('16:9')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${aspectRatio === '16:9' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>16:9</button>
                <button onClick={() => setAspectRatio('9:16')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${aspectRatio === '9:16' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>9:16</button>
              </div>
              <div className="flex bg-black/40 rounded-xl border border-gray-700 p-1">
                <button onClick={() => setResolution('720p')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${resolution === '720p' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>720p</button>
                <button onClick={() => setResolution('1080p')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${resolution === '1080p' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>1080p</button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-xs font-medium transition-opacity ${statusMessage ? 'opacity-100' : 'opacity-0'} ${statusMessage.startsWith('Error') ? 'text-red-400' : 'text-indigo-400'}`}>
              {statusMessage}
            </p>
            <button
              onClick={generateVideo}
              disabled={isGenerating || !prompt.trim()}
              className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-10 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Create Video
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Generations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {history.map(video => (
              <div key={video.id} className="bg-gray-800/40 border border-gray-700/50 rounded-3xl overflow-hidden group hover:border-indigo-500/50 transition-all shadow-lg">
                <video src={video.url} controls className="w-full aspect-video bg-black" />
                <div className="p-4">
                  <p className="text-sm text-gray-200 line-clamp-2 italic">"{video.prompt}"</p>
                  <p className="text-[10px] text-gray-500 mt-2 font-mono tabular-nums">
                    Generated on {new Date(video.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};