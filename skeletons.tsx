import React from 'react';
import { motion } from 'framer-motion';

const BaseSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-slate-200/50 animate-pulse rounded-2xl ${className}`} />
);

export const LandingSkeleton = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-8">
    <div className="w-64 h-64 rounded-full bg-slate-200/50 animate-pulse" />
    <div className="space-y-4 w-full flex flex-col items-center">
      <BaseSkeleton className="h-12 w-48" />
      <BaseSkeleton className="h-8 w-64" />
    </div>
    <BaseSkeleton className="h-14 w-full mt-8 rounded-[24px]" />
  </div>
);

export const OnboardingSkeleton = () => (
    <div className="h-full w-full flex flex-col p-8 space-y-8">
        <div className="flex flex-col space-y-4 mt-10">
            <BaseSkeleton className="h-10 w-40" />
            <BaseSkeleton className="h-4 w-60" />
        </div>
        <div className="space-y-6">
            <BaseSkeleton className="h-14 w-full rounded-[24px]" />
            <div className="flex gap-4">
                <BaseSkeleton className="h-40 flex-1 rounded-[32px]" />
                <BaseSkeleton className="h-40 flex-1 rounded-[32px]" />
            </div>
        </div>
        <div className="mt-auto">
             <BaseSkeleton className="h-14 w-full rounded-[24px]" />
        </div>
    </div>
);

export const DashboardSkeleton = () => (
  <div className="h-full flex flex-col space-y-6 pt-24 px-6 pb-24 overflow-hidden">
    {/* Welcome */}
    <div className="space-y-2">
        <BaseSkeleton className="h-6 w-24 rounded-full" />
        <BaseSkeleton className="h-10 w-64" />
    </div>
    
    {/* Fortune Card */}
    <BaseSkeleton className="h-64 w-full rounded-3xl" />

    {/* Items */}
    <div className="flex space-x-4 overflow-hidden">
        <BaseSkeleton className="h-32 w-28 rounded-3xl flex-shrink-0" />
        <BaseSkeleton className="h-32 w-28 rounded-3xl flex-shrink-0" />
        <BaseSkeleton className="h-32 w-28 rounded-3xl flex-shrink-0" />
    </div>

    {/* Saju Grid */}
    <div className="grid grid-cols-4 gap-3">
        <BaseSkeleton className="h-24 w-full rounded-2xl" />
        <BaseSkeleton className="h-24 w-full rounded-2xl" />
        <BaseSkeleton className="h-24 w-full rounded-2xl" />
        <BaseSkeleton className="h-24 w-full rounded-2xl" />
    </div>
  </div>
);

export const ChatSkeleton = () => (
    <div className="h-full flex flex-col relative pt-20">
        <div className="flex-1 px-6 space-y-4 overflow-hidden">
             <div className="flex justify-start">
                 <BaseSkeleton className="h-16 w-3/4 rounded-[28px] rounded-bl-none" />
             </div>
             <div className="flex justify-end">
                 <BaseSkeleton className="h-12 w-1/2 rounded-[24px] rounded-br-none" />
             </div>
        </div>
        <div className="p-4 pb-24 space-y-3">
             <div className="flex gap-2 overflow-hidden">
                 <BaseSkeleton className="h-8 w-24 rounded-full" />
                 <BaseSkeleton className="h-8 w-24 rounded-full" />
             </div>
             <BaseSkeleton className="h-14 w-full rounded-[28px]" />
        </div>
    </div>
);

export const ListSkeleton = () => (
    <div className="p-6 pt-24 space-y-6">
        <BaseSkeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-4">
             <BaseSkeleton className="h-24 w-full rounded-[28px]" />
             <BaseSkeleton className="h-24 w-full rounded-[28px]" />
             <BaseSkeleton className="h-24 w-full rounded-[28px]" />
        </div>
    </div>
);