import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { PaymentMethod, SocialLink, UsefulLink } from "@/types";
import { uploadToImgBB } from "@/lib/imgbb";
import { toast } from "sonner";
import { X, Plus, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const settings = useAppSettings();
  const [appName, setAppName] = useState(settings.appName);
  const [appLogo, setAppLogo] = useState(settings.appLogo);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [youtubeChannel, setYoutubeChannel] = useState(settings.youtubeChannel);
  const [googleDrive, setGoogleDrive] = useState(settings.googleDrive);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(settings.paymentMethods?.length ? settings.paymentMethods : [{ name: "", number: "" }]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(settings.socialLinks?.length ? settings.socialLinks : [{ name: "", link: "" }]);
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>(settings.usefulLinks?.length ? settings.usefulLinks : [{ name: "", link: "" }]);
  const [saving, setSaving] = useState(false);

  // Sync when settings load
  useState(() => {
    setAppName(settings.appName);
    setAppLogo(settings.appLogo);
    setYoutubeChannel(settings.youtubeChannel);
    setGoogleDrive(settings.googleDrive);
    if (settings.paymentMethods?.length) setPaymentMethods(settings.paymentMethods);
    if (settings.socialLinks?.length) setSocialLinks(settings.socialLinks);
    if (settings.usefulLinks?.length) setUsefulLinks(settings.usefulLinks);
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      let logo = appLogo;
      if (logoFile) logo = await uploadToImgBB(logoFile);

      await setDoc(doc(db, "settings", "app"), {
        appName, appLogo: logo, youtubeChannel, googleDrive,
        paymentMethods: paymentMethods.filter((p) => p.name && p.number),
        socialLinks: socialLinks.filter((s) => s.name && s.link),
        usefulLinks: usefulLinks.filter((u) => u.name && u.link),
      });
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <h2 className="text-xl font-semibold text-foreground mb-4">App Settings</h2>

      <div className="space-y-4">
        <input type="text" placeholder="App Name" value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />

        <div>
          <label className="text-xs text-muted-foreground">App Logo</label>
          {appLogo && <img src={appLogo} alt="" className="w-12 h-12 rounded-md object-contain mt-1" />}
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="w-full text-sm mt-1" />
        </div>

        <input type="text" placeholder="YouTube Channel Link" value={youtubeChannel} onChange={(e) => setYoutubeChannel(e.target.value)} className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
        <input type="text" placeholder="Google Drive Link" value={googleDrive} onChange={(e) => setGoogleDrive(e.target.value)} className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />

        {/* Payment Methods */}
        <div>
          <label className="text-xs text-muted-foreground font-medium">Payment Methods</label>
          {paymentMethods.map((pm, i) => (
            <div key={i} className="flex gap-1 mt-1">
              <input value={pm.name} onChange={(e) => { const a = [...paymentMethods]; a[i] = { ...a[i], name: e.target.value }; setPaymentMethods(a); }} placeholder="Method Name" className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
              <input value={pm.number} onChange={(e) => { const a = [...paymentMethods]; a[i] = { ...a[i], number: e.target.value }; setPaymentMethods(a); }} placeholder="Number" className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
              {paymentMethods.length > 1 && <button type="button" onClick={() => setPaymentMethods(paymentMethods.filter((_, j) => j !== i))} className="p-2 text-destructive"><X className="h-4 w-4" /></button>}
            </div>
          ))}
          <button type="button" onClick={() => setPaymentMethods([...paymentMethods, { name: "", number: "" }])} className="text-xs text-primary mt-1">+ Add</button>
        </div>

        {/* Social Links */}
        <div>
          <label className="text-xs text-muted-foreground font-medium">Social Media Links</label>
          {socialLinks.map((sl, i) => (
            <div key={i} className="flex gap-1 mt-1">
              <input value={sl.name} onChange={(e) => { const a = [...socialLinks]; a[i] = { ...a[i], name: e.target.value }; setSocialLinks(a); }} placeholder="Name" className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
              <input value={sl.link} onChange={(e) => { const a = [...socialLinks]; a[i] = { ...a[i], link: e.target.value }; setSocialLinks(a); }} placeholder="Link" className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
              {socialLinks.length > 1 && <button type="button" onClick={() => setSocialLinks(socialLinks.filter((_, j) => j !== i))} className="p-2 text-destructive"><X className="h-4 w-4" /></button>}
            </div>
          ))}
          <button type="button" onClick={() => setSocialLinks([...socialLinks, { name: "", link: "" }])} className="text-xs text-primary mt-1">+ Add</button>
        </div>

        {/* Useful Links */}
        <div>
          <label className="text-xs text-muted-foreground font-medium">Useful Links</label>
          {usefulLinks.map((ul, i) => (
            <div key={i} className="flex gap-1 mt-1">
              <input value={ul.name} onChange={(e) => { const a = [...usefulLinks]; a[i] = { ...a[i], name: e.target.value }; setUsefulLinks(a); }} placeholder="Name" className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
              <input value={ul.link} onChange={(e) => { const a = [...usefulLinks]; a[i] = { ...a[i], link: e.target.value }; setUsefulLinks(a); }} placeholder="Link" className="flex-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" />
              {usefulLinks.length > 1 && <button type="button" onClick={() => setUsefulLinks(usefulLinks.filter((_, j) => j !== i))} className="p-2 text-destructive"><X className="h-4 w-4" /></button>}
            </div>
          ))}
          <button type="button" onClick={() => setUsefulLinks([...usefulLinks, { name: "", link: "" }])} className="text-xs text-primary mt-1">+ Add</button>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
