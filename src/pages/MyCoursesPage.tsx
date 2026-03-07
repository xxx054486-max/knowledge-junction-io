import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Video } from "@/types";
import { useAppSettings } from "@/contexts/AppSettingsContext";

export default function MyCoursesPage() {
  const { user, userDoc } = useAuth();
  const navigate = useNavigate();
  const settings = useAppSettings();
  const [videos, setVideos] = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [activeSubject, setActiveSubject] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth?mode=login");
      return;
    }
    if (userDoc?.status !== "approved") {
      setLoading(false);
      return;
    }

    const courseId = userDoc.activeCourseId;
    if (!courseId) {
      setLoading(false);
      return;
    }

    const fetchVideos = async () => {
      try {
        // Use simple query without orderBy to avoid composite index requirement
        const q = query(
          collection(db, "videos"),
          where("courseId", "==", courseId)
        );
        const snap = await getDocs(q);
        const vids = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Video));
        // Sort client-side
        vids.sort((a, b) => (a.order || 0) - (b.order || 0));
        setVideos(vids);

        const subs = [...new Set(vids.map((v) => v.subjectName).filter(Boolean))];
        setSubjects(subs);
      } catch (err) {
        console.error("Error fetching videos:", err);
      }
      setLoading(false);
    };
    fetchVideos();
  }, [user, userDoc]);

  if (!user) return null;

  if (userDoc?.status === "pending") {
    return (
      <div className="p-4 text-center mt-8">
        <div className="p-6 bg-warning/10 rounded-lg border border-warning/20">
          <p className="text-foreground font-medium">Enrollment Pending</p>
          <p className="text-sm text-muted-foreground mt-1">Your enrollment is being reviewed. Please wait for approval.</p>
        </div>
      </div>
    );
  }

  if (userDoc?.status === "rejected") {
    return (
      <div className="p-4 text-center mt-8">
        <div className="p-6 bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-foreground font-medium">Enrollment Rejected</p>
          <p className="text-sm text-muted-foreground mt-1">Your enrollment was rejected. Please contact support.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const filtered = activeSubject === "All" ? videos : videos.filter((v) => v.subjectName === activeSubject);

  return (
    <div className="p-4 animate-fade-in">
      {/* Subject Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
        <button
          onClick={() => setActiveSubject("All")}
          className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-medium ${
            activeSubject === "All"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground"
          }`}
        >
          All
        </button>
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setActiveSubject(sub)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-medium ${
              activeSubject === sub
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No videos found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((video) => (
            <button
              key={video.id}
              onClick={() => navigate(`/video/${video.id}`)}
              className="bg-card rounded-lg shadow-card overflow-hidden border border-border text-left"
            >
              {video.thumbnail ? (
                <img src={video.thumbnail} alt={video.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-muted flex items-center justify-center text-muted-foreground text-sm">
                  No Thumbnail
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium text-foreground line-clamp-2">{video.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{settings.appName || "LMS"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
