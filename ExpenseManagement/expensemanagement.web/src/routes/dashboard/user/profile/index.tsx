import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, Mail, Save, Trash2, UserRound } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { SessionInfo } from "@/components/auth/SessionInfo";
import { deleteProfileImageApi, getProfileApi, updateProfileApi, uploadProfileImageApi } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { resolveAvatarUrl } from "@/lib/avatar";
import type { UserProfile } from "@/Types";

export const Route = createFileRoute("/dashboard/user/profile/")({ component: ProfilePage });

function ProfilePage() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(user?.firstName ?? user?.userName?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? user?.userName?.split(" ").slice(1).join(" ") ?? "");

  const applyProfile = (profile: UserProfile) => {
    if (user) setUser({ ...user, ...profile });
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
  };

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfileApi,
    select: (response) => response.data,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (profile) applyProfile(profile);
    // applyProfile intentionally depends on the current authenticated user only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: (response) => { applyProfile(response.data); toast.success(response.message); },
    onError: (error: any) => toast.error(error.response?.data?.message ?? "Could not update profile."),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadProfileImageApi,
    onSuccess: (response) => { applyProfile(response.data); toast.success(response.message); },
    onError: (error: any) => toast.error(error.response?.data?.message ?? "Could not upload profile image."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfileImageApi,
    onSuccess: (response) => { applyProfile(response.data); toast.success(response.message); },
    onError: (error: any) => toast.error(error.response?.data?.message ?? "Could not remove profile image."),
  });

  const handleImage = (file?: File) => {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) return toast.error("Choose a JPG, PNG or WEBP image.");
    if (file.size > 2 * 1024 * 1024) return toast.error("Image must be 2 MB or smaller.");
    uploadMutation.mutate(file);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your identity, profile image and active sessions.</p>
      </div>

      <section className="grid gap-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:grid-cols-[260px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-muted/60 p-5 text-center">
          <div className="relative">
            <img src={resolveAvatarUrl(user?.profileImageUrl)} alt={user?.userName || "Profile"} className="h-32 w-32 rounded-full border-4 border-background object-cover shadow-lg" />
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:brightness-95" aria-label="Upload profile image">
              <Camera className="h-5 w-5" />
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => handleImage(event.target.files?.[0])} />
          <p className="mt-4 font-bold">{user?.userName}</p>
          <p className="text-xs text-muted-foreground">JPG, PNG or WEBP · maximum 2 MB</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {uploadMutation.isPending ? "Uploading..." : "Change photo"}
            </button>
            {user?.profileImageUrl && (
              <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10 disabled:opacity-50">
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            updateMutation.mutate({ firstName, lastName });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">
              <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" /> First name</span>
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} minLength={2} maxLength={50} required className="w-full rounded-xl border border-input bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-primary/30" />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" /> Last name</span>
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} minLength={2} maxLength={50} required className="w-full rounded-xl border border-input bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-primary/30" />
            </label>
          </div>
          <label className="block space-y-2 text-sm font-semibold">
            <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Email</span>
            <input value={user?.email ?? ""} disabled className="w-full cursor-not-allowed rounded-xl border border-input bg-muted px-4 py-3 font-normal text-muted-foreground" />
          </label>
          <button type="submit" disabled={updateMutation.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground hover:brightness-95 disabled:opacity-50 sm:w-auto">
            <Save className="h-4 w-4" /> {updateMutation.isPending ? "Saving..." : "Save profile"}
          </button>
        </form>
      </section>

      <SessionInfo />
    </div>
  );
}
