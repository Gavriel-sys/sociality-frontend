import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

const heartPath = "M11.37 18.46C11.03 18.58 10.47 18.58 10.13 18.46C7.23 17.47 0.75 13.34 0.75 6.34C0.75 3.25 3.24 0.75 6.31 0.75C8.13 0.75 9.74 1.63 10.75 2.99C11.76 1.63 13.38 0.75 15.19 0.75C18.26 0.75 20.75 3.25 20.75 6.34C20.75 13.34 14.27 17.47 11.37 18.46Z";
const bookmarkPath = "M14.25 0.75H4.61C2.48 0.75 0.75 2.49 0.75 4.61V18.7C0.75 20.5 2.04 21.26 3.62 20.39L8.5 17.68C9.02 17.39 9.86 17.39 10.37 17.68L15.25 20.39C16.83 21.27 18.12 20.51 18.12 18.7V4.61C18.11 2.49 16.38 0.75 14.25 0.75Z";

export const SpinnerIcon = ({ className = "h-4 w-4 animate-spin", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" {...props}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export const CloseIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const CheckCircleIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const AlertCircleIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const SearchIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const HomeIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 21 20" fill="none" className={className} aria-hidden="true" {...props}>
    <path d="M18.05 4.81774L12.29 0.78774C10.72 -0.31226 8.31 -0.252259 6.8 0.917741L1.79 4.82774C0.79 5.60774 0 7.20774 0 8.46774V15.3677C0 17.9177 2.07 19.9977 4.62 19.9977H15.4C17.95 19.9977 20.02 17.9277 20.02 15.3777V8.59774C20.02 7.24774 19.15 5.58774 18.05 4.81774ZM10.76 15.9977C10.76 16.4077 10.42 16.7477 10.01 16.7477C9.6 16.7477 9.26 16.4077 9.26 15.9977V12.9977C9.26 12.5877 9.6 12.2477 10.01 12.2477C10.42 12.2477 10.76 12.5877 10.76 12.9977V15.9977Z" fill="currentColor" />
  </svg>
);

export const PlusIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const UserIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true" {...props}>
    <ellipse cx="10" cy="5.25" rx="4.75" ry="4.745" fill="currentColor" />
    <ellipse cx="10" cy="15.1" rx="7.04" ry="4.625" fill="currentColor" />
  </svg>
);

export const RefreshIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export const EmptyBoxIcon = ({ className = "h-12 w-12", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
  </svg>
);

export const EyeIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export const HeartIcon = ({ className, ...props }: Readonly<IconProps>) => (
  <svg width="22" height="20" viewBox="0 0 22 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <path d={heartPath} />
  </svg>
);

export const HeartFilledIcon = (props: Readonly<IconProps>) => (
  <HeartIcon fill="currentColor" {...props} />
);

export const MessageCircleIcon = ({ className, ...props }: Readonly<IconProps>) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <path d="M7.25 17.75H6.75C2.75 17.75 0.75 16.75 0.75 11.75V6.75C0.75 2.75 2.75 0.75 6.75 0.75H14.75C18.75 0.75 20.75 2.75 20.75 6.75V11.75C20.75 15.75 18.75 17.75 14.75 17.75H14.25C13.94 17.75 13.64 17.9 13.45 18.15L11.95 20.15C11.29 21.03 10.21 21.03 9.55 20.15L8.05 18.15C7.89 17.93 7.52 17.75 7.25 17.75Z" />
  </svg>
);

export const ShareIcon = ({ className, ...props }: Readonly<IconProps>) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <path d="M5.0325 3.95199L13.5225 1.12199C17.3325 -0.14801 19.4025 1.93199 18.1425 5.74199L15.3125 14.232C13.4125 19.942 10.2925 19.942 8.3925 14.232L7.5525 11.712L5.0325 10.872C-0.6775 8.97199 -0.6775 5.86199 5.0325 3.95199Z" />
  </svg>
);

export const BookmarkIcon = ({ className, ...props }: Readonly<IconProps>) => (
  <svg width="19" height="22" viewBox="0 0 19 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <path d={bookmarkPath} />
  </svg>
);

export const BookmarkFilledIcon = (props: Readonly<IconProps>) => (
  <BookmarkIcon fill="currentColor" {...props} />
);

export const MoreHorizontalIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
  </svg>
);

export const ImageIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

export const TrashIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export const UploadIcon = ({ className = "h-5 w-5", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const SmileIcon = ({ className = "h-6 w-6", ...props }: Readonly<IconProps>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="10" /><path d="M8 14a4.5 4.5 0 0 0 8 0" /><circle cx="8.5" cy="9" r=".5" fill="currentColor" /><circle cx="15.5" cy="9" r=".5" fill="currentColor" />
  </svg>
);

export const Eye = EyeIcon;
export const EyeOff = EyeOffIcon;
export const MoreHorizontal = MoreHorizontalIcon;
export const Trash = TrashIcon;
