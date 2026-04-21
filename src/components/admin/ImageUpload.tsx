import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

interface ImageUploadProps {
  currentImage: string;
  onImageChange: (imageUrl: string) => void;
  prefix?: string;
  label?: string;
}

const ImageUpload = ({ currentImage, onImageChange, prefix = 'uploads', label = 'Image' }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setUploading(true);
    try {
      const token = localStorage.getItem('cf_session');
      const form = new FormData();
      form.append('file', file);
      form.append('prefix', prefix);
      const res = await fetch(`${API_URL}/admin/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json() as any;
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      onImageChange(data.url);
      toast.success("Image uploaded");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {currentImage ? (
        <div className="relative inline-block">
          <img src={currentImage} alt="Preview" className="w-32 h-32 object-cover rounded-lg border" />
          <Button
            type="button" variant="destructive" size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={() => onImageChange("")}
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drop an image here or click to upload</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 5MB</p>
            </div>
          )}
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
          <Upload size={14} />
          {currentImage ? "Replace" : "Upload"}
        </Button>
        <span className="text-sm text-muted-foreground">or</span>
        <Input
          placeholder="Paste image URL..."
          value={currentImage.startsWith("http") ? currentImage : ""}
          onChange={(e) => onImageChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  );
};

export default ImageUpload;
