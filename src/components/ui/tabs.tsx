"use client";

import { createContext, useContext, useId, useState } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  readonly activeTab: string;
  readonly setActiveTab: (value: string) => void;
  readonly baseId: string;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs compound components must be rendered within a Tabs container");
  }
  return context;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly children: ReactNode;
}

export function Tabs({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
  className,
  ...props
}: Readonly<TabsProps>) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const baseId = useId();

  const isControlled = controlledValue !== undefined;
  const activeTab = isControlled ? controlledValue : internalValue;

  const handleTabChange = (nextTab: string) => {
    if (!isControlled) {
      setInternalValue(nextTab);
    }
    onValueChange?.(nextTab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange, baseId }}>
      <div className={cn("w-full flex flex-col gap-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  readonly "aria-label"?: string;
}

export function TabsList({ className, children, "aria-label": ariaLabel = "Tabs", ...props }: Readonly<TabsListProps>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-[#1F242F] bg-[#0A0D12] p-1 text-sm text-[#A4A7AE]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly value: string;
}

export function TabsTrigger({ value, className, children, ...props }: Readonly<TabsTriggerProps>) {
  const { activeTab, setActiveTab, baseId } = useTabsContext();
  const isSelected = activeTab === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg px-3.5 text-sm font-medium transition-all select-none min-h-[36px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]",
        isSelected
          ? "bg-[#6936F2] text-[#FDFDFD] shadow-sm"
          : "text-[#A4A7AE] hover:text-[#FDFDFD] hover:bg-[#141820]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  readonly value: string;
}

export function TabsContent({ value, className, children, ...props }: Readonly<TabsContentProps>) {
  const { activeTab, baseId } = useTabsContext();
  const isSelected = activeTab === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  if (!isSelected) {
    return <></>;
  }

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      tabIndex={0}
      className={cn("outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9] rounded-lg", className)}
      {...props}
    >
      {children}
    </div>
  );
}
