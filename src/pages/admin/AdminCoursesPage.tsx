import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course, Subject, Instructor, DiscussionGroup } from "@/types";
import { uploadToImgBB } from "@/lib/imgbb";
import { toast } from "sonner";
import { Plus, Edit, Trash2, X, Upload } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);

  const [courseName, setCourseName] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [price, setPrice] = useState(0);
  const [overview, setOverview] = useState<string[]>([""]);
  const [subjects, setSubjects] = useState<Subject[]>([{ subjectId: crypto.randomUUID(), subjectName: "" }]);
  const [instructors, setInstructors] = useState<Instructor[]>([{ name: "", subject: "", image: "" }]);
  const [instructorImageFiles, setInstructorImageFiles] = useState<(File | null)[]>([null]);
  const [discussionGroups, setDiscussionGroups] = useState<DiscussionGroup[]>([{ name: "", link: "" }]);
  const [routinePDF, setRoutinePDF] = useState("");
  const [allMaterialsLink, setAllMaterialsLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    const snap = await getDocs(collection(db, "courses"));
    setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const resetForm = () => {
    setCourseName(""); setThumbnailFile(null); setThumbnailUrl(""); setPrice(0);
    setOverview([""]); setSubjects([{ subjectId: crypto.randomUUID(), subjectName: "" }]);
    setInstructors([{ name: "", subject: "", image: "" }]); setInstructorImageFiles([null]);
    setDiscussionGroups([{ name: "", link: "" }]); setRoutinePDF(""); setAllMaterialsLink(""); setEditCourse(null);
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (c: Course) => {
    setEditCourse(c); setCourseName(c.courseName); setThumbnailUrl(c.thumbnail); setPrice(c.price);
    setOverview(c.overview?.length ? c.overview : [""]); setSubjects(c.subjects?.length ? c.subjects : [{ subjectId: crypto.randomUUID(), subjectName: "" }]);
    setInstructors(c.instructors?.length ? c.instructors : [{ name: "", subject: "", image: "" }]);
    setInstructorImageFiles(c.instructors?.length ? c.instructors.map(() => null) : [null]);
    setDiscussionGroups(c.discussionGroups?.length ? c.discussionGroups : [{ name: "", link: "" }]);
    setRoutinePDF(c.routinePDF || ""); setAllMaterialsLink(c.allMaterialsLink || ""); setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let thumb = thumbnailUrl;
      if (thumbnailFile) thumb = await uploadToImgBB(thumbnailFile);

      // Upload instructor images
      const updatedInstructors = await Promise.all(
        instructors.map(async (inst, i) => {
          let img = inst.image;
          if (instructorImageFiles[i]) {
            img = await uploadToImgBB(instructorImageFiles[i]!);
          }
          return { ...inst, image: img };
        })
      );

      const data = {
        courseName, thumbnail: thumb, price, overview: overview.filter(Boolean),
        subjects: subjects.filter((s) => s.subjectName),
        instructors: updatedInstructors.filter((i) => i.name),
        discussionGroups: discussionGroups.filter((g) => g.name && g.link),
        routinePDF, allMaterialsLink, createdAt: Timestamp.now(),
      };

      if (editCourse) {
        await updateDoc(doc(db, "courses", editCourse.id), data);
        toast.success("Course updated");
      } else {
        await addDoc(collection(db, "courses"), data);
        toast.success("Course added");
      }
      setDialogOpen(false); resetForm(); fetchCourses();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "courses", id));
    toast.success("Course deleted");
    fetchCourses();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-4 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Courses ({courses.length})</h2>
        <button onClick={openAdd} className="flex items-center gap-1 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="space-y-3">
        {courses.map((c) => (
          <div key={c.id} className="p-3 bg-card rounded-lg border border-border flex gap-3 items-center">
            {c.thumbnail ? <img src={c.thumbnail} alt="" className="w-16 h-16 rounded-md object-cover flex-shrink-0" /> : <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">{c.courseName}</p>
              <p className="text-xs text-muted-foreground">৳{c.price} • {c.subjects?.length || 0} subjects</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-accent"><Edit className="h-4 w-4 text-muted-foreground" /></button>
              <AlertDialog>
                <AlertDialogTrigger asChild><button className="p-1.5 rounded-md hover:bg-accent"><Trash2 className="h-4 w-4 text-destructive" /></button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Delete Course</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{c.courseName}".</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(c.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editCourse ? "Edit Course" : "Add Course"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Course Name</label>
                <input type="text" placeholder="Course Name" value={courseName} onChange={(e) => setCourseName(e.target.value)} required className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm mt-1" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Thumbnail</label>
                {thumbnailUrl && <img src={thumbnailUrl} alt="" className="w-20 h-14 rounded-md object-cover mt-1" />}
                <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="w-full text-sm mt-1" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Price (৳)</label>
                <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm mt-1" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Overview Points</label>
              {overview.map((p, i) => (
                <div key={i} className="flex gap-1 mt-1">
                  <input value={p} onChange={(e) => { const o = [...overview]; o[i] = e.target.value; setOverview(o); }} placeholder={`Point ${i + 1}`} className="flex-1 px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm" />
                  {overview.length > 1 && <button type="button" onClick={() => setOverview(overview.filter((_, j) => j !== i))} className="p-2 text-destructive"><X className="h-4 w-4" /></button>}
                </div>
              ))}
              <button type="button" onClick={() => setOverview([...overview, ""])} className="text-xs text-primary mt-1">+ Add Point</button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Subjects</label>
              {subjects.map((s, i) => (
                <div key={i} className="flex gap-1 mt-1">
                  <input value={s.subjectName} onChange={(e) => { const a = [...subjects]; a[i] = { ...a[i], subjectName: e.target.value }; setSubjects(a); }} placeholder="Subject Name" className="flex-1 px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm" />
                  {subjects.length > 1 && <button type="button" onClick={() => setSubjects(subjects.filter((_, j) => j !== i))} className="p-2 text-destructive"><X className="h-4 w-4" /></button>}
                </div>
              ))}
              <button type="button" onClick={() => setSubjects([...subjects, { subjectId: crypto.randomUUID(), subjectName: "" }])} className="text-xs text-primary mt-1">+ Add Subject</button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Instructors</label>
              {instructors.map((inst, i) => (
                <div key={i} className="flex flex-col gap-2 mt-2 p-3 bg-accent/50 rounded-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input value={inst.name} onChange={(e) => { const a = [...instructors]; a[i] = { ...a[i], name: e.target.value }; setInstructors(a); }} placeholder="Name" className="px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm" />
                    <input value={inst.subject} onChange={(e) => { const a = [...instructors]; a[i] = { ...a[i], subject: e.target.value }; setInstructors(a); }} placeholder="Subject" className="px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    {inst.image && <img src={inst.image} alt="" className="w-8 h-8 rounded-full object-cover" />}
                    <input type="file" accept="image/*" onChange={(e) => {
                      const files = [...instructorImageFiles]; files[i] = e.target.files?.[0] || null; setInstructorImageFiles(files);
                    }} className="text-sm flex-1" />
                  </div>
                  {instructors.length > 1 && <button type="button" onClick={() => {
                    setInstructors(instructors.filter((_, j) => j !== i));
                    setInstructorImageFiles(instructorImageFiles.filter((_, j) => j !== i));
                  }} className="text-xs text-destructive self-end">Remove</button>}
                </div>
              ))}
              <button type="button" onClick={() => {
                setInstructors([...instructors, { name: "", subject: "", image: "" }]);
                setInstructorImageFiles([...instructorImageFiles, null]);
              }} className="text-xs text-primary mt-1">+ Add Instructor</button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Discussion Groups</label>
              {discussionGroups.map((g, i) => (
                <div key={i} className="flex gap-1 mt-1 flex-wrap sm:flex-nowrap">
                  <input value={g.name} onChange={(e) => { const a = [...discussionGroups]; a[i] = { ...a[i], name: e.target.value }; setDiscussionGroups(a); }} placeholder="Group Name" className="flex-1 min-w-[120px] px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm" />
                  <input value={g.link} onChange={(e) => { const a = [...discussionGroups]; a[i] = { ...a[i], link: e.target.value }; setDiscussionGroups(a); }} placeholder="Link" className="flex-1 min-w-[120px] px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm" />
                  {discussionGroups.length > 1 && <button type="button" onClick={() => setDiscussionGroups(discussionGroups.filter((_, j) => j !== i))} className="p-2 text-destructive"><X className="h-4 w-4" /></button>}
                </div>
              ))}
              <button type="button" onClick={() => setDiscussionGroups([...discussionGroups, { name: "", link: "" }])} className="text-xs text-primary mt-1">+ Add Group</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Routine PDF URL</label>
                <input type="text" placeholder="Routine PDF URL" value={routinePDF} onChange={(e) => setRoutinePDF(e.target.value)} className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">All Materials Link</label>
                <input type="text" placeholder="All Materials Link" value={allMaterialsLink} onChange={(e) => setAllMaterialsLink(e.target.value)} className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm mt-1" />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
              {submitting ? "Saving..." : editCourse ? "Update Course" : "Add Course"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
