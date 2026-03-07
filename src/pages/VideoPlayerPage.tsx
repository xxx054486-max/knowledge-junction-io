import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Video } from "@/types";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { ChevronLeft, ChevronRight, FileText, Play, Pause, Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
import { useCallback, useRef } from "react";

// YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const SPEEDS = [1, 1.25, 1.5, 1.75, 2];

export default function VideoPlayerPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useAppSettings();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Player state
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [seekFeedback, setSeekFeedback] = useState<{ side: "left" | "right"; visible: boolean }>({ side: "left", visible: false });
  const seekFeedbackTimeout = useRef<NodeJS.Timeout | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const lastTap = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  useEffect(() => {
    if (!user) { navigate("/auth?mode=login"); return; }
    const fetchData = async () => {
      if (!videoId) return;
      const snap = await getDoc(doc(db, "videos", videoId));
      if (!snap.exists()) { setLoading(false); return; }
      const v = { id: snap.id, ...snap.data() } as Video;
      setVideo(v);

      try {
        const q = query(
          collection(db, "videos"),
          where("courseId", "==", v.courseId),
          where("subjectId", "==", v.subjectId)
        );
        const relSnap = await getDocs(q);
        const vids = relSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Video));
        vids.sort((a, b) => (a.order || 0) - (b.order || 0));
        setRelatedVideos(vids);
      } catch {
        setRelatedVideos([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [videoId, user]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!video) return;
    setPlayerReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setSpeedIndex(0);

    const ytId = getYouTubeId(video.videoURL);
    if (!ytId) return;

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      playerRef.current = new window.YT.Player("yt-player", {
        videoId: ytId,
        playerVars: {
          autoplay: 1, controls: 0, modestbranding: 1, rel: 0,
          showinfo: 0, iv_load_policy: 3, fs: 0, disablekb: 1,
          playsinline: 1, origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            setPlayerReady(true);
            setDuration(e.target.getDuration());
            e.target.playVideo();
          },
          onStateChange: (e: any) => {
            setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [video?.id]);

  // Progress tracking
  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (playerReady && isPlaying) {
      progressInterval.current = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          setCurrentTime(playerRef.current.getCurrentTime());
          setDuration(playerRef.current.getDuration());
        }
      }, 500);
    }
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [playerReady, isPlaying]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [showControls, isPlaying]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [isPlaying]);

  const seek = useCallback((seconds: number) => {
    if (!playerRef.current) return;
    const t = playerRef.current.getCurrentTime() + seconds;
    playerRef.current.seekTo(Math.max(0, Math.min(t, duration)), true);
  }, [duration]);

  const cycleSpeed = useCallback(() => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    if (playerRef.current) playerRef.current.setPlaybackRate(SPEEDS[next]);
  }, [speedIndex]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      // Lock to landscape if available
      try { (screen.orientation as any)?.lock?.("landscape").catch(() => {}); } catch {}
    } else {
      document.exitFullscreen();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) playerRef.current.unMute();
    else playerRef.current.mute();
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!playerReady) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowLeft": case "j": e.preventDefault(); seek(-10); break;
        case "ArrowRight": case "l": e.preventDefault(); seek(10); break;
        case "ArrowUp": e.preventDefault(); playerRef.current?.setVolume(Math.min(100, (playerRef.current?.getVolume() || 0) + 10)); break;
        case "ArrowDown": e.preventDefault(); playerRef.current?.setVolume(Math.max(0, (playerRef.current?.getVolume() || 0) - 10)); break;
        case "f": e.preventDefault(); toggleFullscreen(); break;
        case "m": e.preventDefault(); toggleMute(); break;
        case ">": e.preventDefault(); cycleSpeed(); break;
        case "<": e.preventDefault(); { const prev = (speedIndex - 1 + SPEEDS.length) % SPEEDS.length; setSpeedIndex(prev); playerRef.current?.setPlaybackRate(SPEEDS[prev]); } break;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [playerReady, togglePlay, seek, toggleFullscreen, toggleMute, cycleSpeed, speedIndex]);

  // Double tap to seek (mobile)
  const handlePlayerTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setShowControls(true);
    const now = Date.now();
    const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const half = rect.width / 2;

    if (now - lastTap.current.time < 300) {
      // Double tap
      const side = x < half ? "left" : "right";
      seek(side === "left" ? -10 : 10);
      setSeekFeedback({ side, visible: true });
      if (seekFeedbackTimeout.current) clearTimeout(seekFeedbackTimeout.current);
      seekFeedbackTimeout.current = setTimeout(() => setSeekFeedback(p => ({ ...p, visible: false })), 600);
    }
    lastTap.current = { time: now, x };
  }, [seek]);

  const handleSeekBar = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setCurrentTime(t);
    playerRef.current?.seekTo(t, true);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&]+)/);
    return match?.[1] || "";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!video) {
    return <div className="p-4 text-center text-muted-foreground">Video not found.</div>;
  }

  const currentIndex = relatedVideos.findIndex((v) => v.id === videoId);
  const prevVideo = currentIndex > 0 ? relatedVideos[currentIndex - 1] : null;
  const nextVideo = currentIndex < relatedVideos.length - 1 ? relatedVideos[currentIndex + 1] : null;

  return (
    <div className="animate-fade-in lg:flex lg:gap-4 lg:p-4" onContextMenu={(e) => e.preventDefault()}>
      <div className="lg:flex-1">
        <div className="sticky top-14 z-30 bg-background">
          {/* Video Player Container */}
          <div
            ref={containerRef}
            className="relative aspect-video bg-black overflow-hidden select-none"
            onClick={handlePlayerTap}
            onMouseMove={() => setShowControls(true)}
          >
            {/* YouTube Player */}
            <div id="yt-player" className="absolute inset-0 w-full h-full pointer-events-none" />

            {/* Overlay to block YouTube interactions */}
            <div className="absolute inset-0 z-10" style={{ pointerEvents: "auto" }} />

            {/* Seek feedback */}
            {seekFeedback.visible && (
              <div className={`absolute top-1/2 -translate-y-1/2 z-20 bg-foreground/20 rounded-full w-16 h-16 flex items-center justify-center animate-fade-in ${seekFeedback.side === "left" ? "left-8" : "right-8"}`}>
                <span className="text-white text-sm font-medium">{seekFeedback.side === "left" ? "-10s" : "+10s"}</span>
              </div>
            )}

            {/* Custom Controls */}
            <div className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-3 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              {/* Seek bar */}
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeekBar}
                className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                onClick={(e) => e.stopPropagation()}
              />

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white p-1">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white p-1">
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <span className="text-white text-xs">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); cycleSpeed(); }} className="text-white text-xs font-medium px-2 py-0.5 bg-white/20 rounded">
                    {SPEEDS[speedIndex]}x
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="text-white p-1">
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h2 className="font-semibold text-foreground">{video.title}</h2>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                onClick={() => prevVideo && navigate(`/video/${prevVideo.id}`)}
                disabled={!prevVideo}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-card border border-border text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                onClick={() => nextVideo && navigate(`/video/${nextVideo.id}`)}
                disabled={!nextVideo}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-card border border-border text-foreground disabled:opacity-30"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
              {video.pdfURL && (
                <a href={video.pdfURL} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground">
                  <FileText className="h-4 w-4" /> PDF
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Videos */}
      <div className="p-4 lg:w-80 lg:p-0">
        <h3 className="font-semibold text-foreground mb-3">More Videos</h3>
        <div className="space-y-2">
          {relatedVideos
            .filter((v) => v.id !== videoId)
            .map((v) => (
              <button key={v.id} onClick={() => navigate(`/video/${v.id}`)} className="flex gap-3 w-full text-left p-2 rounded-md hover:bg-accent">
                {v.thumbnail ? (
                  <img src={v.thumbnail} alt="" className="w-28 h-16 object-cover rounded-md flex-shrink-0" />
                ) : (
                  <div className="w-28 h-16 bg-muted rounded-md flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{v.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{settings.appName || "LMS"}</p>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
