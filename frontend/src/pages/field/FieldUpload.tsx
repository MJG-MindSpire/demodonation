import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiForm, apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import fieldIllustration from "@/assets/field-illustration.png";
import {
  Camera,
  Upload,
  MapPin,
  Clock,
  X,
  Image,
  FileVideo,
  Loader2,
} from "lucide-react";

type WorkStatus = "pending" | "ongoing" | "completed";

type ProjectStep = {
  key: string;
  title: string;
  order: number;
};

type Project = {
  _id: string;
  title: string;
  progressPercent?: number;
  receiverDetails?: { city?: string };
  steps?: ProjectStep[];
};

export default function FieldUpload() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [capturedAt] = useState(() => new Date());

  const filePickerRef = useRef<HTMLInputElement | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["field", "projects"],
    queryFn: async () => {
      const res = await apiRequest<{ projects: Project[] }>("/api/field/projects");
      return res.projects;
    },
  });

  const defaultProjectId = searchParams.get("projectId") ?? "";
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId);

  useEffect(() => {
    if (defaultProjectId && defaultProjectId !== selectedProjectId) {
      setSelectedProjectId(defaultProjectId);
    }
  }, [defaultProjectId, selectedProjectId]);

  const selectedProject = useMemo(() => {
    const list = projectsQuery.data ?? [];
    if (selectedProjectId) return list.find((p) => p._id === selectedProjectId) ?? null;
    return list[0] ?? null;
  }, [projectsQuery.data, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId && selectedProject?._id) {
      setSelectedProjectId(selectedProject._id);
    }
  }, [selectedProject?._id, selectedProjectId]);

  const steps = useMemo(() => {
    const list = selectedProject?.steps ?? [];
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [selectedProject?.steps]);

  const [stepKey, setStepKey] = useState<string>("");
  useEffect(() => {
    if (!stepKey && steps.length > 0) setStepKey(steps[0].key);
  }, [stepKey, steps]);

  const [workStatus, setWorkStatus] = useState<WorkStatus>("ongoing");
  const [percentComplete, setPercentComplete] = useState<string>("");
  const [amountUsed, setAmountUsed] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [files, setFiles] = useState<{ name: string; type: "image" | "video"; preview?: string; file?: File }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileAdd = () => {
    // Simulate adding a file
    filePickerRef.current?.click();
  };

  useEffect(() => {
    return () => {
      for (const f of files) {
        if (f.preview) URL.revokeObjectURL(f.preview);
      }
    };
  }, [files]);

  const handleRemoveFile = (index: number) => {
    const toRemove = files[index];
    if (toRemove?.preview) URL.revokeObjectURL(toRemove.preview);
    setFiles(files.filter((_, i) => i !== index));
  };

  const onFilesSelected = (selected: FileList | null) => {
    const list = Array.from(selected ?? []);
    if (list.length === 0) return;

    const mapped = list.map((f) => {
      const type = f.type.startsWith("video/") ? ("video" as const) : ("image" as const);
      return {
        name: f.name,
        type,
        preview: URL.createObjectURL(f),
        file: f,
      };
    });

    setFiles((prev) => [...prev, ...mapped]);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) throw new Error("Select a project");
      if (!stepKey) throw new Error("Select a step");
      const pct = Number(percentComplete);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new Error("Percent complete must be 0-100");
      const amt = amountUsed.trim() ? Number(amountUsed) : 0;
      if (!Number.isFinite(amt) || amt < 0) throw new Error("Amount used must be >= 0");
      const mediaFiles = files.map((f) => f.file).filter(Boolean) as File[];
      if (mediaFiles.length === 0) throw new Error("At least one proof file is required");

      const form = new FormData();
      form.append("stepKey", stepKey);
      form.append("workStatus", workStatus);
      form.append("percentComplete", String(pct));
      form.append("amountUsed", String(amt));
      if (notes.trim()) form.append("notes", notes.trim());
      for (const f of mediaFiles) form.append("media", f);

      setUploading(true);
      setUploadProgress(30);
      const res = await apiForm<{ update: any }>(`/api/field/projects/${selectedProjectId}/progress`, form);
      setUploadProgress(100);
      return res;
    },
    onSuccess: async () => {
      setNotes("");
      setPercentComplete("");
      setAmountUsed("");
      setFiles([]);
      setUploadProgress(0);
      setUploading(false);
      await queryClient.invalidateQueries({ queryKey: ["field", "projects"] });
      toast({ title: "Submitted", description: "Progress update submitted for admin review." });
    },
    onError: (err: any) => {
      setUploading(false);
      setUploadProgress(0);
      toast({ title: "Error", description: err?.message ?? "Upload failed", variant: "destructive" });
    },
  });

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-white/50 shadow-[var(--shadow-elevated)] backdrop-blur-md">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-accent/15 via-secondary/15 to-primary/15 bg-[length:200%_200%] animate-gradient"
        />
        <div aria-hidden className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div aria-hidden className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Proof Upload
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Upload Proof</h1>
            <p className="text-muted-foreground">Submit photos and videos of your field work</p>
          </div>

          <img
            src={fieldIllustration}
            alt="Upload"
            className="hidden h-24 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
          />
        </div>
      </div>

      {/* Project Selection */}
      <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Select Project</CardTitle>
          <CardDescription>Choose the project you're uploading proof for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {(projectsQuery.data ?? []).slice(0, 6).map((p) => {
              const isSelected = (selectedProject?._id ?? "") === p._id;
              const progress = p.progressPercent ?? 0;
              const statusVariant = progress >= 100 ? "success" : progress > 0 ? "info" : "warning";
              const statusLabel = progress >= 100 ? "Completed" : progress > 0 ? "In Progress" : "Pending";
              return (
                <div
                  key={p._id}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-white/30 bg-white/50 hover:border-border"
                  }`}
                  onClick={() => setSelectedProjectId(p._id)}
                >
                  <h4 className="font-medium">{p.title}</h4>
                  <p className="text-sm text-muted-foreground">{p.receiverDetails?.city ?? "-"}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Badge variant={statusVariant as any} className="h-5">{statusLabel}</Badge>
                    <span className="text-muted-foreground">{progress}% complete</span>
                  </div>
                </div>
              );
            })}

            {!projectsQuery.isLoading && !projectsQuery.isError && (projectsQuery.data ?? []).length === 0 ? (
              <div className="sm:col-span-2 rounded-lg border border-white/30 bg-white/50 p-4 backdrop-blur">
                <p className="text-sm text-muted-foreground">No assigned projects.</p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Step</Label>
              <Select value={stepKey} onValueChange={setStepKey}>
                <SelectTrigger>
                  <SelectValue placeholder={steps.length > 0 ? "Select a step" : "No steps available"} />
                </SelectTrigger>
                <SelectContent>
                  {steps.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Work Status</Label>
              <Select value={workStatus} onValueChange={(v) => setWorkStatus(v as WorkStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Percent Complete (0-100)</Label>
              <Input value={percentComplete} onChange={(e) => setPercentComplete(e.target.value)} placeholder="e.g. 40" />
            </div>

            <div className="space-y-2">
              <Label>Amount Used (optional)</Label>
              <Input value={amountUsed} onChange={(e) => setAmountUsed(e.target.value)} placeholder="e.g. 500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Upload Files</CardTitle>
          <CardDescription>Add photos or videos as proof of work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            ref={(el) => {
              filePickerRef.current = el;
            }}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => onFilesSelected(e.target.files)}
          />

          {/* Drop Zone */}
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center backdrop-blur-md transition-colors hover:border-primary/50 hover:bg-primary/10"
            onClick={handleFileAdd}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <h4 className="font-medium">Click to upload or drag & drop</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Supports JPG, PNG, MP4 (max 50MB)
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); handleFileAdd(); }}>
                <Camera className="h-4 w-4" />
                Add Media
              </Button>
            </div>
          </div>

          {/* File Preview */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Files to upload ({files.length})</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-lg border border-white/30 bg-white/50 backdrop-blur-md"
                  >
                    <div className="aspect-video">
                      {file.type === "video" ? (
                        <video src={file.preview} className="h-full w-full object-cover" controls />
                      ) : (
                        <img src={file.preview} alt={file.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-3">
                      <div className="flex items-center gap-2">
                        {file.type === "image" ? (
                          <Image className="h-4 w-4 text-card" />
                        ) : (
                          <FileVideo className="h-4 w-4 text-card" />
                        )}
                        <span className="text-xs text-card truncate">{file.name}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location & Notes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Location (Auto-detected)</Label>
              <div className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/50 p-3 text-sm backdrop-blur">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{selectedProject?.receiverDetails?.city ?? "-"}</span>
                <Badge variant="success" className="ml-auto h-5">GPS</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Timestamp</Label>
              <div className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/50 p-3 text-sm backdrop-blur">
                <Clock className="h-4 w-4 text-primary" />
                <span>{capturedAt.toLocaleString()}</span>
                <Badge variant="success" className="ml-auto h-5">Auto</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Describe the work completed..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Submit Button */}
          <Button
            variant="accent"
            size="lg"
            className="w-full gap-2"
            disabled={files.length === 0 || uploading || !selectedProjectId || !stepKey}
            onClick={handleUpload}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Submit Proof ({files.length} files)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
