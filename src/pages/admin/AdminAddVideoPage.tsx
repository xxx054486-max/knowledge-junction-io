import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course } from "@/types";
import { toast } from "sonner";

export default function AdminAddVideoPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [pdfURL, setPdfURL] = useState("");
  const [order, setOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "courses")).then((snap) => {
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));
    });
  }, []);

  const selectedCourse = courses.find((c) => c.id === courseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const course = courses.find((c) => c.id === courseId);
      const subject = course?.subjects?.find((s) => s.subjectId === subjectId);
      await addDoc(collection(db, "videos"), {
        courseId, courseName: course?.courseName || "", subjectId, subjectName: subject?.subjectName || "",
        title, thumbnail, videoURL, pdfURL, order, createdAt: Timestamp.now(),
      });
      toast.success("Video added");
      setTitle(""); setThumbnail(""); setVideoURL(""); setPdfURL(""); setOrder(0);
    } catch (err: any) { toast.error(err.message); }
    setSubmitting(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <h2 className="text-xl font-semibold text-foreground mb-4">Add Video</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setSubjectId(""); }} required className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm">
          <option value="">Select Course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
        </select>
        {selectedCourse?.subjects?.length ? (
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm">
            <option value="">Select Subject</option>
            {selectedCourse.subjects.map((s) => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
          </select>
        ) : null}
        <input type="text" placeholder="Video Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
        <input type="text" placeholder="Thumbnail URL" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
        <input type="text" placeholder="YouTube Video URL" value={videoURL} onChange={(e) => setVideoURL(e.target.value)} required className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
        <input type="text" placeholder="PDF URL" value={pdfURL} onChange={(e) => setPdfURL(e.target.value)} className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
        <input type="number" placeholder="Order" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
        <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
          {submitting ? "Adding..." : "Add Video"}
        </button>
      </form>
    </div>
  );
}
