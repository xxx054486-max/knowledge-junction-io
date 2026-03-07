import { useState } from "react";
import { collection, getDocs, doc, setDoc, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

export default function AdminDataPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const collections = ["users", "courses", "videos", "settings", "enrollRequests"];
      const data: Record<string, any[]> = {};

      await Promise.all(
        collections.map(async (col) => {
          const snap = await getDocs(collection(db, col));
          data[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        })
      );

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lms-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
    setExporting(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      for (const [colName, docs] of Object.entries(data) as [string, any[]][]) {
        for (const docData of docs) {
          const { id, ...rest } = docData;
          if (id) {
            // Merge: use setDoc with merge to avoid overwriting
            await setDoc(doc(db, colName, id), rest, { merge: true });
          }
        }
      }

      toast.success("Data imported successfully (merged with existing)");
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    }
    setImporting(false);
    e.target.value = "";
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <h2 className="text-xl font-semibold text-foreground mb-6">Import / Export Data</h2>

      <div className="space-y-4">
        <div className="p-4 bg-card rounded-lg border border-border">
          <h3 className="font-medium text-foreground mb-2">Export All Data</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Download all users, courses, videos, and settings as a JSON file.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export Data"}
          </button>
        </div>

        <div className="p-4 bg-card rounded-lg border border-border">
          <h3 className="font-medium text-foreground mb-2">Import Data</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Import a JSON backup file. Data will be merged with existing records.
          </p>
          <label className={`flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium cursor-pointer inline-flex ${importing ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload className="h-4 w-4" />
            {importing ? "Importing..." : "Import Data"}
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
