"use client";

import { BookmarkIcon } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfilePostCollection } from "./profile-post-collection";
import styles from "./profile-gallery-tabs.module.css";

function GalleryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M5 0h3v8H0V5a5 5 0 0 1 5-5Zm5 0h5a5 5 0 0 1 5 5v15h-5a5 5 0 0 1-5-5V0ZM0 10h8v10H5a5 5 0 0 1-5-5v-5Z" />
    </svg>
  );
}

export function ProfileGalleryTabs() {
  return (
    <Tabs defaultValue="gallery" className={styles.tabs}>
      <TabsList aria-label="Profile navigation tabs" className={styles.list}>
        <TabsTrigger value="gallery" className={styles.tab}><GalleryIcon />Gallery</TabsTrigger>
        <TabsTrigger value="saved" className={styles.tab}><BookmarkIcon />Saved</TabsTrigger>
      </TabsList>
      <TabsContent value="gallery"><ProfilePostCollection collection="posts" /></TabsContent>
      <TabsContent value="saved"><ProfilePostCollection collection="saved" /></TabsContent>
    </Tabs>
  );
}
