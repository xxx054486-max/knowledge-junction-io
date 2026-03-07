import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserDoc } from "@/types";
import { toast } from "sonner";
import { Check, X, Trash2, Eye } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface UserWithId extends UserDoc { id: string; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null);

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserWithId)));
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleApprove = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), { status: "approved" });
    toast.success("User approved");
    fetchUsers();
  };

  const handleReject = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), { status: "rejected" });
    toast.success("User rejected");
    fetchUsers();
  };

  const handleDelete = async (userId: string) => {
    await deleteDoc(doc(db, "users", userId));
    toast.success("User deleted");
    fetchUsers();
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.enrolledCourses?.some((c) => c.courseName.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-4 animate-fade-in">
      <h2 className="text-xl font-semibold text-foreground mb-4">Users ({users.length})</h2>
      <input
        type="text"
        placeholder="Search by name, email, or course..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-md bg-card border border-border text-foreground text-sm mb-4"
      />

      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="p-3 bg-card rounded-lg border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                  u.status === "approved" ? "bg-success/10 text-success" :
                  u.status === "pending" ? "bg-warning/10 text-warning" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {u.status}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setSelectedUser(u)} className="p-1.5 rounded-md hover:bg-accent"><Eye className="h-4 w-4 text-muted-foreground" /></button>
                {u.status !== "approved" && (
                  <button onClick={() => handleApprove(u.id)} className="p-1.5 rounded-md hover:bg-accent"><Check className="h-4 w-4 text-success" /></button>
                )}
                {u.status !== "rejected" && (
                  <button onClick={() => handleReject(u.id)} className="p-1.5 rounded-md hover:bg-accent"><X className="h-4 w-4 text-warning" /></button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-1.5 rounded-md hover:bg-accent"><Trash2 className="h-4 w-4 text-destructive" /></button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete {u.name}. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(u.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-3 text-sm">
              <Detail label="Name" value={selectedUser.name} />
              <Detail label="Email" value={selectedUser.email} />
              <Detail label="Status" value={selectedUser.status} />
              <Detail label="Role" value={selectedUser.role} />
              {selectedUser.enrolledCourses?.map((c, i) => (
                <Detail key={i} label={`Course ${i + 1}`} value={c.courseName} />
              ))}
              {selectedUser.paymentInfo && (
                <>
                  <Detail label="Payment Method" value={selectedUser.paymentInfo.method} />
                  <Detail label="Payment Number" value={selectedUser.paymentInfo.paymentNumber} />
                  <Detail label="Transaction ID" value={selectedUser.paymentInfo.transactionId} />
                  {selectedUser.paymentInfo.screenshot && (
                    <div>
                      <p className="text-muted-foreground text-xs">Screenshot</p>
                      <img src={selectedUser.paymentInfo.screenshot} alt="Payment" className="w-full rounded-md mt-1" />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-foreground">{value || "—"}</p>
    </div>
  );
}
