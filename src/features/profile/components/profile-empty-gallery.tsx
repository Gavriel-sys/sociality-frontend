"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreatePostDialog } from "@/features/posts/components/create-post-dialog";
import styles from "./profile-empty-gallery.module.css";

function EmptyGalleryMessage({ onCreatePost }: { readonly onCreatePost: () => void }) {
  return (
    <section aria-label="Your story starts here" className={styles.empty}>
      <h2 className={styles.title}>Your story starts here</h2>
      <p className={styles.description}>
        Share your first post and let the world see your moments, passions, and memories. Make this space truly yours.
      </p>
      <Button variant="primary" onClick={onCreatePost} className={styles.action}>Upload My First Post</Button>
    </section>
  );
}

export function ProfileEmptyGallery() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  return (
    <>
      <EmptyGalleryMessage onCreatePost={() => setIsCreateOpen(true)} />
      <CreatePostDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
