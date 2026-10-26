"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile } from "../types";
import { useEditProfile } from "../use-edit-profile";

export interface EditProfileDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly profile: UserProfile;
}

const MAX_BYTES = 5 * 1024 * 1024;
const VALID_MIMES = ["image/png", "image/jpeg", "image/webp"];
const revokeUrl = (url: string | null) => {
  if (url && typeof URL !== "undefined") URL.revokeObjectURL(url);
};

function EditProfileForm({
  profile,
  onClose,
}: {
  readonly profile: UserProfile;
  readonly onClose: () => void;
}) {
  const [name, setName] = useState(profile.name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { editProfile, isLoading, error: apiError } = useEditProfile();

  useEffect(() => () => revokeUrl(avatarPreviewUrl), [avatarPreviewUrl]);

  const handleClose = () => {
    revokeUrl(avatarPreviewUrl);
    onClose();
  };

  const handleAvatarSelect = (file: File) => {
    if (!VALID_MIMES.includes(file.type)) {
      setAvatarError("Please upload a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setAvatarError("Avatar image must not exceed 5MB.");
      return;
    }
    revokeUrl(avatarPreviewUrl);
    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(typeof URL !== "undefined" ? URL.createObjectURL(file) : "");
    setAvatarError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setNameError("Name is required");
      return;
    }
    const result = await editProfile({
      name: trimmed,
      bio: bio.trim(),
      avatar: selectedAvatarFile ?? undefined,
    });
    if (result) handleClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {apiError && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {apiError.message}
        </div>
      )}
      <input
        ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        data-testid="avatar-file-input" aria-label="Upload avatar image"
        onChange={(e) => {
          const next = e.target.files?.[0];
          if (next) handleAvatarSelect(next);
          e.target.value = "";
        }}
      />
      <div className="flex items-center gap-4">
        <Avatar
          src={avatarPreviewUrl ?? profile.avatarUrl}
          fallback={name || profile.username}
          alt="Avatar preview"
          size="xl"
          className="h-16 w-16 md:h-20 md:w-20 ring-2 ring-[#1F242F]"
        />
        <div className="space-y-1">
          <button
            type="button" onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-[#1F242F] bg-[#141820] px-3.5 py-2 text-xs font-medium text-[#FDFDFD] hover:bg-[#1F242F] transition-colors"
          >
            Change avatar
          </button>
          {avatarError && <p role="alert" className="text-xs text-[#B41759]">{avatarError}</p>}
        </div>
      </div>
      <Input
        label="Full Name" value={name} placeholder="Enter full name" disabled={isLoading}
        onChange={(e) => {
          setName(e.target.value);
          if (nameError && e.target.value.trim().length > 0) setNameError(null);
        }}
        error={nameError ?? undefined}
      />
      <div className="space-y-1">
        <Textarea
          label="Bio" value={bio} placeholder="Write a bio..." rows={3} maxLength={200} disabled={isLoading}
          onChange={(e) => setBio(e.target.value.slice(0, 200))}
        />
        <div className="flex justify-end text-xs text-[#A4A7AE]"><span>{bio.length}/200</span></div>
      </div>
      <Input label="Email" value={profile.email ?? ""} readOnly disabled helperText="Email cannot be changed" />
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>Save changes</Button>
      </div>
    </form>
  );
}

export function EditProfileDialog({
  isOpen,
  onClose,
  profile,
}: Readonly<EditProfileDialogProps>) {
  if (!isOpen) return <></>;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Edit profile">
      <EditProfileForm profile={profile} onClose={onClose} />
    </Dialog>
  );
}
