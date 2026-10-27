/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AspectRatio,
  ChatMessage,
  VideoHistoryItem,
  VideoProject,
} from './types/video';
import { processGrokRequest, isGenerateCommand } from './utils/grokAgent';
import { GrokSidebar } from './components/GrokSidebar';
import { GrokChatArea } from './components/GrokChatArea';
import { MergenStudio } from './components/MergenStudio';

export default function App() {
  // Starter video in history
  const starterVideo: VideoProject = {
    id: 'vid_starter_1',
    title: 'Neon Odyssey: Act I',
    prompt: 'Opening cinematic scene of a rain-slicked futuristic skyline, 35mm anamorphic, slow dolly push, atmospheric fog, and cinematic bars',
    aspectRatio: '16:9',
    totalDuration: 12.0,
    musicGenre: 'cinematic-orchestra',
    createdAt: Date.now() - 3600000,
    partNumber: 1,
    characterType: 'female',
    scenes: [
      {
        id: 'scene_init_1',
        title: 'Shot 1: Wide Establishing Cityscape',
        duration: 4.0,
        backgroundColor: '#050814',
        characterType: 'female',
        speakerName: 'Female Recon Lead',
        shotDirection: {
          shotType: 'Wide Establishing',
          lensDescription: '35mm Anamorphic T1.5',
          lighting: 'Moody low-key with cyan practicals',
        },
        motionType: 'dolly-push',
        effects: ['anamorphic-flare', 'cinematic-bars'],
        cinematicSubtitle: '2089. The orbital spire towers above the low-altitude storm clouds.',
        narrationText: '2089. The orbital spire towers above the low-altitude storm clouds.',
        sfxAtStart: 'cinematic-boom',
      },
      {
        id: 'scene_init_2',
        title: 'Shot 2: Crane Pan Down Boulevard',
        duration: 4.0,
        backgroundColor: '#0a0d1d',
        characterType: 'female',
        speakerName: 'Female Recon Lead',
        shotDirection: {
          shotType: 'Medium Track',
          lensDescription: '50mm Prime T1.8',
          lighting: 'Reflective wet asphalt with amber streetlights',
        },
        motionType: 'crane-pan',
        effects: ['film-grain', 'cinematic-fog', 'cinematic-bars'],
        cinematicSubtitle: 'Autonomous transit glides through the rain. Surveillance drones sweep the perimeter.',
        narrationText: 'Autonomous transit glides through the rain. Surveillance drones sweep the perimeter.',
        sfxAtStart: 'whoosh',
      },
      {
        id: 'scene_init_3',
        title: 'Shot 3: Dutch Tilt Reveal',
        duration: 4.0,
        backgroundColor: '#030712',
        characterType: 'female',
        speakerName: 'Female Recon Lead',
        shotDirection: {
          shotType: 'Close-Up',
          lensDescription: '85mm Anamorphic Macro',
          lighting: 'High contrast neon rim light',
        },
        motionType: 'dutch-tilt',
        effects: ['teal-orange', 'film-grain', 'cinematic-bars'],
        cinematicSubtitle: 'Every transmission is monitored. The silent rebellion begins tonight.',
        narrationText: 'Every transmission is monitored. The silent rebellion begins tonight.',
        sfxAtStart: 'cinematic-boom',
      },
    ],
  };

  // Initial clean chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>([
    {
      id: 'hist_1',
      title: starterVideo.title,
      prompt: starterVideo.prompt,
      thumbnail: '',
      duration: starterVideo.totalDuration,
      aspectRatio: starterVideo.aspectRatio,
      createdAt: starterVideo.createdAt,
      video: starterVideo,
      partNumber: 1,
    },
  ]);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isMergenOpen, setIsMergenOpen] = useState<boolean>(false);

  // Collect all generated videos from the CURRENT active conversation only
  const currentChatVideos: VideoProject[] = messages
    .map((m) => m.generatedVideo)
    .filter((v): v is VideoProject => Boolean(v));

  // Strictly per conversation - never carry over clips from another chat!
  const allEligibleVideos: VideoProject[] = currentChatVideos;

  // Trigger continuation of an existing video as a discrete consecutive video
  const handleContinueScene = async (parentVideo: VideoProject) => {
    const nextPart = (parentVideo.partNumber || 1) + 1;
    const prompt = `GENERATE continuation from "${parentVideo.title}" where it ended at ${parentVideo.totalDuration}s. Direct Part ${nextPart}.`;

    const userMsgId = `user_cont_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: `+ Continue Scene: Direct Part ${nextPart} picking up from ${parentVideo.totalDuration.toFixed(1)}s`,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGeneratingVideo(true);
    setIsProcessing(true);

    try {
      const result = await processGrokRequest({
        prompt,
        images: [],
        aspectRatio: parentVideo.aspectRatio,
        history: messages,
        parentVideo,
        isContinuation: true,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant_cont_${Date.now()}`,
        role: 'assistant',
        content: result.replyText,
        generatedVideo: result.video,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (result.video) {
        const historyItem: VideoHistoryItem = {
          id: `hist_${result.video.id}`,
          title: result.video.title,
          prompt: result.video.prompt,
          thumbnail: '',
          duration: result.video.totalDuration,
          aspectRatio: result.video.aspectRatio,
          createdAt: result.video.createdAt,
          video: result.video,
          partNumber: nextPart,
        };
        setVideoHistory((prev) => [historyItem, ...prev]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Send message & generate video
  const handleSendMessage = async (
    prompt: string,
    images: string[],
    aspectRatio: AspectRatio
  ) => {
    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: prompt,
      uploadedImages: images,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);

    const lower = prompt.toLowerCase();
    const isContinuationWord =
      lower.includes('continue') ||
      lower.includes('next part') ||
      lower.includes('part 2') ||
      lower.includes('part 3') ||
      lower.includes('next scene');

    const parentVideo = isContinuationWord
      ? [...messages].reverse().find((m) => m.generatedVideo)?.generatedVideo
      : undefined;

    const willGenerate = isGenerateCommand(prompt, images, messages, parentVideo, Boolean(parentVideo));
    setIsGeneratingVideo(willGenerate);
    setIsProcessing(true);

    try {
      const result = await processGrokRequest({
        prompt,
        images,
        aspectRatio,
        history: messages,
        parentVideo,
        isContinuation: Boolean(parentVideo),
      });

      const assistantMsgId = `assistant_${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: result.replyText,
        generatedVideo: result.video,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (result.video) {
        const historyItem: VideoHistoryItem = {
          id: `hist_${result.video.id}`,
          title: result.video.title,
          prompt: result.video.prompt,
          thumbnail: '',
          duration: result.video.totalDuration,
          aspectRatio: result.video.aspectRatio,
          createdAt: result.video.createdAt,
          video: result.video,
          partNumber: result.video.partNumber,
        };

        setVideoHistory((prev) => [historyItem, ...prev]);
      }
    } finally {
      setIsProcessing(false);
      setIsGeneratingVideo(false);
    }
  };

  // Select video from history
  const handleSelectVideo = (video: VideoProject) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `view_${Date.now()}`,
        role: 'assistant',
        content: `Loaded "${video.title}" (${video.scenes.length} shots, ${video.aspectRatio})`,
        timestamp: Date.now(),
        generatedVideo: video,
      },
    ]);
  };

  // Start fresh chat session with no video
  const handleNewChat = () => {
    setMessages([]);
  };

  // Clear history
  const handleClearHistory = () => {
    setVideoHistory([]);
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string) => {
    setVideoHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Sidebar with Video History & Pixazo AI Gateway */}
      <GrokSidebar
        history={videoHistory}
        onSelectVideo={handleSelectVideo}
        onNewChat={handleNewChat}
        onClearHistory={handleClearHistory}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        isOpenOnMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat and Video Generation Workspace */}
      <GrokChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing}
        isGeneratingVideo={isGeneratingVideo}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onContinueScene={handleContinueScene}
        onOpenMergen={() => setIsMergenOpen(true)}
        videoCountInChat={allEligibleVideos.length}
      />

      {/* Mergen Multi-Clip Stitching Studio */}
      {isMergenOpen && (
        <MergenStudio
          availableVideos={allEligibleVideos}
          onClose={() => setIsMergenOpen(false)}
        />
      )}
    </div>
  );
}
