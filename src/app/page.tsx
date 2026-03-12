"use client";

import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionSnapshot } from "@/lib/use-session";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

export default function HomePage() {
  const router = useRouter();
  const session = useSessionSnapshot();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (session.mounted && session.isLoggedIn) {
      router.replace("/feed");
    }
  }, [router, session.isLoggedIn, session.mounted]);

  if (session.mounted && session.isLoggedIn) {
    return <div className="p-6 text-white">Loading...</div>;
  }

  const caption =
    "Creating unforgettable moments with my favorite person! Let's cherish every second together and keep smiling through every scene.";
  const shortCaption = `${caption.slice(0, 86).trimEnd()}...`;

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-28 pt-8 sm:px-6">
      <article className="mx-auto w-full max-w-[472px] border-b border-white/10 pb-8">
        <div className="flex items-center gap-4">
          <img src={DEFAULT_AVATAR} alt="Johndoe" className="h-14 w-14 rounded-full object-cover" />
          <div>
            <p className="text-xl font-semibold text-white">Johndoe</p>
            <p className="mt-1 text-sm text-white/55">1 Minutes Ago</p>
          </div>
        </div>

        <div className="relative mt-4 aspect-square overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#1e3a8a_0%,#60a5fa_24%,#fde68a_48%,#fb7185_72%,#7c3aed_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.85),transparent_10%),radial-gradient(circle_at_79%_16%,rgba(255,255,255,0.72),transparent_11%),radial-gradient(circle_at_86%_36%,rgba(255,255,255,0.58),transparent_10%),radial-gradient(circle_at_18%_38%,rgba(255,255,255,0.46),transparent_9%),radial-gradient(circle_at_62%_20%,rgba(255,255,255,0.56),transparent_12%)] opacity-90" />

          <AvatarBubble className="left-[7%] top-[32%] h-[22%] w-[22%]" />
          <AvatarBubble className="left-[18%] top-[9%] h-[17%] w-[17%]" />
          <AvatarBubble className="left-[56%] top-[5%] h-[18%] w-[18%]" />
          <AvatarBubble className="left-[74%] top-[12%] h-[17%] w-[17%]" />
          <AvatarBubble className="left-[74%] top-[42%] h-[18%] w-[18%]" />
          <AvatarBubble className="left-[6%] top-[63%] h-[15%] w-[15%]" />

          <div className="absolute left-1/2 top-[58%] h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[10px] border-white/20 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
            <img src={DEFAULT_AVATAR} alt="Main preview" className="h-full w-full object-cover scale-[1.12]" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-5 text-sm text-white">
            <button type="button" className="inline-flex items-center gap-2 text-white">
              <Heart className="h-5 w-5 fill-[#ff4d93] text-[#ff4d93]" />
              <span>20</span>
            </button>

            <button type="button" className="inline-flex items-center gap-2 text-white">
              <MessageCircle className="h-5 w-5" />
              <span>20</span>
            </button>

            <button type="button" className="inline-flex items-center gap-2 text-white">
              <Send className="h-5 w-5" />
              <span>20</span>
            </button>
          </div>

          <button type="button" className="text-white" aria-label="Save post preview">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-lg font-semibold text-white">Johndoe</p>
          <p className="text-sm leading-8 text-white/78">{expanded ? caption : shortCaption}</p>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="text-sm font-medium text-violet-400 transition hover:text-violet-300"
          >
            {expanded ? "Show Less" : "Show More"}
          </button>
        </div>
      </article>
    </div>
  );
}

function AvatarBubble({ className }: { className: string }) {
  return (
    <div className={`absolute overflow-hidden rounded-full border-4 border-white/20 shadow-[0_14px_30px_rgba(0,0,0,0.18)] ${className}`}>
      <img src={DEFAULT_AVATAR} alt="Preview avatar" className="h-full w-full object-cover" />
    </div>
  );
}
