import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Video } from "@/types";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

export default function VideoPlayerPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useAppSettings();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth?mode=login");
      return;
    }
    const fetch = async () => {
      if (!videoId) return;
      const snap = await getDoc(doc(db, "videos", videoId));
      if (!snap.exists()) {
        setLoading(false);
        return;
      }
      const v = { id: snap.id, ...snap.data() } as Video;
      setVideo(v);

      // Fetch related videos (same course + subject)
      const q = query(
        collection(db, "videos"),
        where("courseId", "==", v.courseId),
        where("subjectId", "==", v.subjectId),
        orderBy("order", "asc")
      );
      const relSnap = await getDocs(q);
      setRelatedVideos(relSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Video)));
      setLoading(false);
    };
    fetch();
  }, [videoId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!video) {
    return <div className="p-4 text-center text-muted-foreground">Video not found.</div>;
  }

  const currentIndex = relatedVideos.findIndex((v) => v.id === videoId);
  const prevVideo = currentIndex > 0 ? relatedVideos[currentIndex - 1] : null;
  const nextVideo = currentIndex < relatedVideos.length - 1 ? relatedVideos[currentIndex + 1] : null;

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&]+)/);
    return match?.[1] || "";
  };

  const ytId = getYouTubeId(video.videoURL);

  return (
    <div className="animate-fade-in lg:flex lg:gap-4 lg:p-4">
      {/* Sticky Video Player */}
      <div className="lg:flex-1">
        <div className="sticky top-14 z-30 bg-background">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?rel=0`}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <h2 className="font-semibold text-foreground">{video.title}</h2>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => prevVideo && navigate(`/video/${prevVideo.id}`)}
                disabled={!prevVideo}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-card border border-border text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => nextVideo && navigate(`/video/${nextVideo.id}`)}
                disabled={!nextVideo}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-card border border-border text-foreground disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
              {video.pdfURL && (
                <a
                  href={video.pdfURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground"
                >
                  <FileText className="h-4 w-4" />
                  PDF
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
              <button
                key={v.id}
                onClick={() => navigate(`/video/${v.id}`)}
                className="flex gap-3 w-full text-left p-2 rounded-md hover:bg-accent"
              >
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
