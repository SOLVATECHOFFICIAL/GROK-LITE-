/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AspectRatio,
  ChatConversation,
  ChatMessage,
  VideoProject,
} from './types/video';
import {
  processGrokRequest,
  isGenerateCommand,
  extractMeaningfulChatTitle,
} from './utils/grokAgent';
import { exportToMp4 } from './utils/mp4Export';
import { GrokSidebar } from './components/GrokSidebar';
import { GrokChatArea } from './components/GrokChatArea';
import { MergenStudio } from './components/MergenStudio';

export default function App() {
  // Starter video for default initial session
  const starterVideo: VideoProject = {
    id: 'vid_starter_1',
    title: 'Neon Odyssey: Act I',
    prompt:
      'Opening cinematic scene of a rain-slicked futuristic skyline, 35mm anamorphic, slow dolly push, atmospheric fog, and cinematic bars',
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
        cinematicSubtitle:
          'Autonomous transit glides through the rain. Surveillance drones sweep the perimeter.',
        narrationText:
          'Autonomous transit glides through the rain. Surveillance drones sweep the perimeter.',
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

  const initialConversation: ChatConversation = {
    id: 'conv_starter_neon',
    title: 'Neon Odyssey',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    messages: [
      {
        id: 'msg_starter_ai',
        role: 'assistant',
        content:
          'Welcome to Grok Cinema. I have directed "Neon Odyssey: Act I" with 3 cinematic shots, camera motion, and voice acting. You can direct up to 100 videos in this chat session, continue the sequence, or download as MP4!',
        timestamp: Date.now() - 3600000,
        generatedVideo: starterVideo,
      },
    ],
  };

  // Saved Conversations state with localStorage persistence
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    try {
      const saved = localStorage.getItem('grok_cinema_saved_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load conversations from storage:', e);
    }
    return [initialConversation];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    return conversations[0]?.id || initialConversation.id;
  });

  // Keep conversations saved permanently
  useEffect(() => {
    try {
      localStorage.setItem('grok_cinema_saved_conversations', JSON.stringify(conversations));
    } catch (e) {
      console.warn('Failed to persist conversations to storage:', e);
    }
  }, [conversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || initialConversation;

  const messages = activeConversation.messages;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isMergenOpen, setIsMergenOpen] = useState<boolean>(false);

  // Single MP4 Download state for batch & single in chat
  const [isDownloadingMp4, setIsDownloadingMp4] = useState<boolean>(false);
  const [mp4Progress, setMp4Progress] = useState<number>(0);
  const [mp4Status, setMp4Status] = useState<string>('');

  // Collect all generated videos from the CURRENT active conversation only (supports up to 100)
  const currentChatVideos: VideoProject[] = messages
    .map((m) => m.generatedVideo)
    .filter((v): v is VideoProject => Boolean(v));

  const allEligibleVideos: VideoProject[] = currentChatVideos;
  const MAX_VIDEOS_PER_CHAT = 100;

  // Start fresh chat session without deleting previous chats ("don't ever delet a conversation you grab")
  const handleNewChat = () => {
    const newChatId = `chat_${Date.now()}`;
    const newConv: ChatConversation = {
      id: newChatId,
      title: 'New Film Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newChatId);
  };

  // Switch to / grab a conversation (never deletes anything)
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  // Select video from history
  const handleSelectVideo = (video: VideoProject) => {
    const selectMsg: ChatMessage = {
      id: `view_${Date.now()}`,
      role: 'assistant',
      content: `Loaded "${video.title}" (${video.scenes.length} shots, ${video.aspectRatio})`,
      timestamp: Date.now(),
      generatedVideo: video,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, selectMsg],
          };
        }
        return c;
      })
    );
  };

  // Trigger continuation of an existing video as a discrete consecutive video
  const handleContinueScene = async (parentVideo: VideoProject) => {
    if (currentChatVideos.length >= MAX_VIDEOS_PER_CHAT) {
      alert(`This chat has reached the maximum reel capacity of 100 videos! You can download the complete movie as MP4.`);
      return;
    }

    const nextPart = (parentVideo.partNumber || 1) + 1;
    const prompt = `GENERATE continuation from "${parentVideo.title}" where it ended at ${parentVideo.totalDuration}s. Direct Part ${nextPart}.`;

    const userMsgId = `user_cont_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: `+ Continue Scene: Direct Part ${nextPart} picking up from ${parentVideo.totalDuration.toFixed(1)}s`,
      timestamp: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? { ...c, updatedAt: Date.now(), messages: [...c.messages, userMsg] }
          : c
      )
    );

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

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, updatedAt: Date.now(), messages: [...c.messages, assistantMsg] }
            : c
        )
      );
    } finally {
      setIsProcessing(false);
      setIsGeneratingVideo(false);
    }
  };

  // Send message & generate video (automatically names chat by first word meaning, never containing 'clear')
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

    // Auto-name chat by the first prompt's meaningful concept (not just an isolated single word)
    const shouldRenameChat =
      activeConversation.title === 'New Film Session' || activeConversation.messages.length === 0;

    const newMeaningfulTitle = shouldRenameChat
      ? extractMeaningfulChatTitle(prompt)
      : activeConversation.title;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              title: newMeaningfulTitle,
              updatedAt: Date.now(),
              messages: [...c.messages, userMsg],
            }
          : c
      )
    );

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

    if (willGenerate && currentChatVideos.length >= MAX_VIDEOS_PER_CHAT) {
      const limitMsg: ChatMessage = {
        id: `assistant_limit_${Date.now()}`,
        role: 'assistant',
        content: `This chat session has reached its full capacity of 100 videos! You can download all 100 clips as an MP4 movie using the Download MP4 button, or start a new film project.`,
        timestamp: Date.now(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, updatedAt: Date.now(), messages: [...c.messages, limitMsg] }
            : c
        )
      );
      return;
    }

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

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, updatedAt: Date.now(), messages: [...c.messages, assistantMsg] }
            : c
        )
      );
    } finally {
      setIsProcessing(false);
      setIsGeneratingVideo(false);
    }
  };

  // JUST ONE DOWNLOAD BUTTON FOR BATCH AND NORMAL SINGLE IN CHAT (STRICTLY MP4)
  const handleUnifiedDownloadMp4 = async () => {
    if (allEligibleVideos.length === 0 || isDownloadingMp4) return;

    setIsDownloadingMp4(true);
    setMp4Progress(5);
    setMp4Status('Setting up MP4 video encoder...');

    try {
      if (allEligibleVideos.length === 1) {
        // Single video in chat -> direct MP4 export
        await exportToMp4({
          project: allEligibleVideos[0],
          aspectRatio: allEligibleVideos[0].aspectRatio,
          onProgress: (percent, status) => {
            setMp4Progress(percent);
            setMp4Status(status);
          },
        });
      } else {
        // Batch videos in chat (2 to 100 clips) -> unified batch MP4 export
        await exportToMp4({
          projects: allEligibleVideos,
          aspectRatio: allEligibleVideos[0]?.aspectRatio || '16:9',
          onProgress: (percent, status) => {
            setMp4Progress(percent);
            setMp4Status(status);
          },
        });
      }

      setMp4Progress(100);
      setMp4Status('MP4 downloaded successfully!');
      setTimeout(() => {
        setIsDownloadingMp4(false);
        setMp4Progress(0);
      }, 1800);
    } catch (err: any) {
      console.error('MP4 download error:', err);
      setMp4Status(err.message || 'MP4 download error. Please try again.');
      setIsDownloadingMp4(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Sidebar: Saved Chats & 100 Reel Clips (No clear, No delete, preserves all chats) */}
      <GrokSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        activeChatVideos={allEligibleVideos}
        onSelectVideo={handleSelectVideo}
        isOpenOnMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat Workspace with up to 100 videos, auto meaningful naming & ONE MP4 download button */}
      <GrokChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing}
        isGeneratingVideo={isGeneratingVideo}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onContinueScene={handleContinueScene}
        onOpenMergen={() => setIsMergenOpen(true)}
        videoCountInChat={allEligibleVideos.length}
        conversationTitle={activeConversation.title}
        onDownloadMp4={handleUnifiedDownloadMp4}
        isDownloadingMp4={isDownloadingMp4}
        mp4Progress={mp4Progress}
        mp4Status={mp4Status}
      />

      {/* Mergen Multi-Clip Stitching Studio (Export MP4 only) */}
      {isMergenOpen && (
        <MergenStudio
          availableVideos={allEligibleVideos}
          onClose={() => setIsMergenOpen(false)}
        />
      )}
    </div>
  );
}
