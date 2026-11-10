import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Upload,
  Repeat,
  Shuffle,
  Music,
  Video,
  List,
  Disc,
} from 'lucide-react';

interface MediaTrack {
  id: string;
  title: string;
  artist: string;
  type: 'audio' | 'video';
  url: string;
  duration?: number;
}

const DEFAULT_TRACKS: MediaTrack[] = [
  {
    id: 'track_1',
    title: 'Sinfonía Fluent Chillwave',
    artist: 'Windows Studio Synthesizer',
    type: 'audio',
    url: 'https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3',
    duration: 120,
  },
  {
    id: 'track_2',
    title: 'Acústica de Cristal & Brisa',
    artist: 'Ambient Soundscape',
    type: 'audio',
    url: 'https://cdn.freesound.org/previews/530/530415_11861866-lq.mp3',
    duration: 154,
  },
  {
    id: 'track_3',
    title: 'Pulso Retro Eléctrico',
    artist: 'Cyber Beats',
    type: 'audio',
    url: 'https://cdn.freesound.org/previews/369/369952_634166-lq.mp3',
    duration: 98,
  },
];

interface MediaPlayerProps {
  meta?: {
    fileUrl?: string;
    fileName?: string;
  };
}

export const MediaPlayerApp: React.FC<MediaPlayerProps> = ({ meta }) => {
  const [playlist, setPlaylist] = useState<MediaTrack[]>(() => {
    if (meta?.fileUrl) {
      const isVideo = ['mp4', 'webm', 'mov'].some(ext => (meta.fileName || '').toLowerCase().endsWith(ext));
      const initial: MediaTrack = {
        id: 'initial_file',
        title: meta.fileName || 'Archivo multimedia',
        artist: 'Archivo local',
        type: isVideo ? 'video' : 'audio',
        url: meta.fileUrl,
      };
      return [initial, ...DEFAULT_TRACKS];
    }
    return DEFAULT_TRACKS;
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(true);

  const mediaRef = useRef<HTMLMediaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.warn('Playback error or user gesture required:', e);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!mediaRef.current) return;
    setCurrentTime(mediaRef.current.currentTime);
    setDuration(mediaRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video');

    const newTrack: MediaTrack = {
      id: `custom_${Date.now()}`,
      title: file.name,
      artist: 'Archivo subido',
      type: isVideo ? 'video' : 'audio',
      url,
    };

    setPlaylist(prev => [newTrack, ...prev]);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-white overflow-hidden font-sans select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main player area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Media display viewport */}
        <div className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden">
          {currentTrack?.type === 'video' ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={currentTrack.url}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleNext}
              className="w-full h-full object-contain"
              loop={isLooping}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={currentTrack?.url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleNext}
                loop={isLooping}
              />

              {/* Animated Vinyl Disc Art */}
              <div
                className={`w-36 h-36 rounded-full bg-gradient-to-tr from-slate-800 via-slate-700 to-slate-900 border-4 border-slate-700/60 shadow-2xl flex items-center justify-center relative mb-6 transition-transform duration-700 ${
                  isPlaying ? 'rotate-180 animate-spin [animation-duration:8s]' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center">
                  <Disc size={20} className="text-rose-400" />
                </div>
              </div>

              <h3 className="text-base font-semibold text-white tracking-wide truncate max-w-sm mb-1">
                {currentTrack?.title}
              </h3>
              <p className="text-xs text-slate-400">{currentTrack?.artist}</p>
            </div>
          )}

          {/* Quick Upload CTA Overlay button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-xs font-medium text-white transition-colors"
          >
            <Upload size={14} />
            <span>Abrir archivo</span>
          </button>
        </div>

        {/* Playlist sidebar */}
        {showPlaylist && (
          <div className="w-56 bg-slate-950/80 border-l border-white/10 p-3 flex flex-col overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-slate-400 font-medium">
              <span>Lista de reproducción</span>
              <span className="text-[10px]">{playlist.length} pistas</span>
            </div>

            <div className="space-y-1">
              {playlist.map((track, idx) => {
                const isSelected = idx === currentTrackIndex;
                return (
                  <button
                    key={track.id}
                    onClick={() => {
                      setCurrentTrackIndex(idx);
                      setIsPlaying(true);
                      setTimeout(() => mediaRef.current?.play(), 50);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex items-center gap-2 ${
                      isSelected
                        ? 'bg-rose-600 text-white font-medium'
                        : 'hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {track.type === 'video' ? <Video size={14} /> : <Music size={14} />}
                    <div className="truncate flex-1">
                      <div className="truncate font-medium">{track.title}</div>
                      <div className="text-[10px] opacity-70 truncate">{track.artist}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Playback Controls Footer */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-white/10 flex flex-col gap-1.5">
        {/* Progress seekbar */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <span>{formatTime(duration)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded transition-colors ${
                isLooping ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white'
              }`}
              title="Repetir pista"
            >
              <Repeat size={15} />
            </button>
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`p-1.5 rounded transition-colors ${
                showPlaylist ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white'
              }`}
              title="Mostrar/ocultar lista"
            >
              <List size={15} />
            </button>
          </div>

          {/* Central Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              title="Anterior"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              title="Siguiente"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
