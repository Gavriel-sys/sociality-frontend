"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { dismissPostSuccess } from "@/lib/store/ui-slice";
import styles from "./post-success-notice.module.css";

const NOTICE_DURATION_MS = 5000;

export function PostSuccessNotice() {
  const noticeId = useAppSelector((state) => state.ui.postSuccessNoticeId);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!noticeId) return;
    const timeoutId = window.setTimeout(() => dispatch(dismissPostSuccess()), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [noticeId, dispatch]);

  if (!noticeId) return <></>;

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={styles.notice}>
      <span>Success Post</span>
      <button type="button" onClick={() => dispatch(dismissPostSuccess())}
        aria-label="Dismiss post success notification" className={styles.closeButton}>
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
