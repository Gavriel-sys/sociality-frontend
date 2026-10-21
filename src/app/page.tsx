"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FloatingNav, type NavItemKey } from "@/components/layout/floating-nav";
import { Header } from "@/components/layout/header";

export default function ShowcasePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<NavItemKey>("home");
  const [searchVal, setSearchVal] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  return (
    <div className="min-h-screen bg-black text-[#FDFDFD] pb-32">
      <Header searchValue={searchVal} onSearchChange={setSearchVal} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        <section className="space-y-2 border-b border-[#1F242F] pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FDFDFD]">
            Sociality Design System Showcase
          </h1>
          <p className="text-sm text-[#A4A7AE]">
            Sociality Design System Showcase — Stage 1C completed. Feature API integration and authentication remain pending Stage 2+.
          </p>
        </section>

        <section aria-labelledby="buttons-heading" className="space-y-4">
          <h2 id="buttons-heading" className="text-lg font-semibold text-[#FDFDFD]">Buttons</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="primary" isLoading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </section>

        <section aria-labelledby="inputs-heading" className="space-y-4">
          <h2 id="inputs-heading" className="text-lg font-semibold text-[#FDFDFD]">Form Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <Input label="Username" placeholder="Enter username..." helperText="Your unique identifier." />
            <Input label="Email address" placeholder="Enter email..." defaultValue="invalid-email" error="Please enter a valid email address." />
            <Input label="Disabled input" value="read-only content" disabled />
            <div className="md:col-span-2">
              <Textarea label="Post caption" placeholder="Write something inspiring..." helperText="Max 500 characters." />
            </div>
          </div>
        </section>

        <section aria-labelledby="alerts-heading" className="space-y-4 max-w-2xl">
          <h2 id="alerts-heading" className="text-lg font-semibold text-[#FDFDFD]">Alerts</h2>
          <Alert variant="success" title="Profile updated">Your profile information was saved successfully.</Alert>
          <Alert variant="danger" title="Connection error">Unable to reach the server. Please try again.</Alert>
        </section>

        <section aria-labelledby="tabs-heading" className="space-y-4 max-w-2xl">
          <h2 id="tabs-heading" className="text-lg font-semibold text-[#FDFDFD]">Tabs Navigation</h2>
          <Tabs defaultValue="feed">
            <TabsList aria-label="Showcase preview tabs">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="explore">Explore</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="feed" className="p-4 rounded-xl border border-[#1F242F] bg-[#0A0D12] text-sm text-[#A4A7AE]">Feed tab panel active.</TabsContent>
            <TabsContent value="explore" className="p-4 rounded-xl border border-[#1F242F] bg-[#0A0D12] text-sm text-[#A4A7AE]">Explore tab panel active.</TabsContent>
            <TabsContent value="notifications" className="p-4 rounded-xl border border-[#1F242F] bg-[#0A0D12] text-sm text-[#A4A7AE]">Notifications tab panel active.</TabsContent>
          </Tabs>
        </section>

        <section aria-labelledby="avatars-heading" className="space-y-4">
          <h2 id="avatars-heading" className="text-lg font-semibold text-[#FDFDFD]">Avatars & Skeletons</h2>
          <div className="flex items-center gap-4">
            <Avatar size="sm" fallback="SM" />
            <Avatar size="md" fallback="MD" />
            <Avatar size="lg" fallback="LG" />
            <Avatar size="xl" fallback="XL" />
          </div>
          <div className="space-y-2 max-w-md pt-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </section>

        <section aria-labelledby="feedback-heading" className="space-y-4">
          <h2 id="feedback-heading" className="text-lg font-semibold text-[#FDFDFD]">Feedback States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LoadingState message="Loading feed..." description="Fetching latest posts" />
            <EmptyState title="No posts yet" description="Follow creators to see their content." action={{ label: "Discover", onClick: () => {} }} />
            <ErrorState title="Failed to load" message="Network error occurred." onRetry={() => setRetryCount((c) => c + 1)} retryLabel={`Retry (${retryCount})`} />
          </div>
        </section>

        <section aria-labelledby="overlays-heading" className="space-y-4">
          <h2 id="overlays-heading" className="text-lg font-semibold text-[#FDFDFD]">Overlay Containers</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => setIsDialogOpen(true)}>Open Desktop Dialog</Button>
            <Button variant="outline" onClick={() => setIsSheetOpen(true)}>Open Mobile Sheet</Button>
          </div>
        </section>
      </main>

      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Desktop Dialog Modal" description="Modal container with backdrop scrim and keyboard trap.">
        <p className="text-sm text-[#A4A7AE]">This modal container supports keyboard Escape and focus management.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => setIsDialogOpen(false)}>Confirm</Button>
        </div>
      </Dialog>

      <Sheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Mobile Bottom Sheet" description="Pinned bottom sheet container with handle indicator.">
        <p className="text-sm text-[#A4A7AE]">This bottom sheet provides touch-friendly mobile drawer experience.</p>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setIsSheetOpen(false)}>Done</Button>
        </div>
      </Sheet>

      <FloatingNav activeKey={activeNav} onSelectKey={setActiveNav} />
    </div>
  );
}
