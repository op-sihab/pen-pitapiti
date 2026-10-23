import React from "react";

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * 3D Golden Crown Icon (for Host / Create Room)
 */
export function CrownIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* 3D Drop Lip */}
      <path
        d="M4 22 L6 9 L12 16 L16 7 L20 16 L26 9 L28 22 Z"
        fill="#b45309"
        stroke="#2F3B4B"
        strokeWidth="3"
        strokeLinejoin="round"
        transform="translate(0, 2)"
      />
      {/* Main Crown Body */}
      <path
        d="M4 21 L6 8 L12 15 L16 6 L20 15 L26 8 L28 21 Z"
        fill="#f59e0b"
        stroke="#2F3B4B"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Crown Rim Highlight */}
      <path
        d="M5 21 H27 V23 H5 Z"
        fill="#fbbf24"
        stroke="#2F3B4B"
        strokeWidth="2"
      />
      {/* Jewels */}
      <circle cx="6" cy="8" r="2" fill="#ef4444" stroke="#2F3B4B" strokeWidth="1.5" />
      <circle cx="16" cy="6" r="2.2" fill="#38bdf8" stroke="#2F3B4B" strokeWidth="1.5" />
      <circle cx="26" cy="8" r="2" fill="#ef4444" stroke="#2F3B4B" strokeWidth="1.5" />
      <circle cx="16" cy="18" r="1.5" fill="#fef08a" />
    </svg>
  );
}

/**
 * 3D Retro Gamepad Controller (for Join with Code)
 */
export function GamepadIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* 3D Bottom Lip */}
      <rect
        x="3"
        y="10"
        width="26"
        height="14"
        rx="7"
        fill="#0284c7"
        stroke="#2F3B4B"
        strokeWidth="3"
        transform="translate(0, 2)"
      />
      {/* Body */}
      <rect
        x="3"
        y="9"
        width="26"
        height="14"
        rx="7"
        fill="#38bdf8"
        stroke="#2F3B4B"
        strokeWidth="2.5"
      />
      {/* Grip Highlights */}
      <path d="M6 13 Q7 18 10 19" stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round" />
      {/* D-Pad (Plus) */}
      <path
        d="M8 16 H14 M11 13 V19"
        stroke="#1e293b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Action Buttons */}
      <circle cx="21" cy="14" r="1.6" fill="#ef4444" stroke="#2F3B4B" strokeWidth="1.2" />
      <circle cx="24" cy="17" r="1.6" fill="#f59e0b" stroke="#2F3B4B" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * Tactical Pencil / Edit Icon
 */
export function PencilIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g transform="rotate(45 16 16)">
        {/* Eraser */}
        <rect x="13" y="4" width="6" height="5" rx="2" fill="#fb7185" stroke="#2F3B4B" strokeWidth="2" />
        {/* Ferrule (Metal ring) */}
        <rect x="13" y="8" width="6" height="3" fill="#cbd5e1" stroke="#2F3B4B" strokeWidth="2" />
        {/* Pencil Barrel */}
        <rect x="13" y="11" width="6" height="12" fill="#f59e0b" stroke="#2F3B4B" strokeWidth="2" />
        {/* Wood Nib */}
        <polygon points="13,23 19,23 16,28" fill="#fef08a" stroke="#2F3B4B" strokeWidth="2" strokeLinejoin="round" />
        {/* Graphite Tip */}
        <polygon points="15,26.5 17,26.5 16,28" fill="#1e293b" />
      </g>
    </svg>
  );
}

/**
 * 3D Tactile Clipboard Document Icon (Copy Code)
 */
export function CopyCodeIcon({ size = 18, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* 3D Lip */}
      <rect x="5" y="5" width="14" height="16" rx="3" fill="#b45309" transform="translate(0, 1.5)" />
      {/* Board */}
      <rect x="5" y="4" width="14" height="16" rx="3" fill="#f59e0b" stroke="#2F3B4B" strokeWidth="2" />
      {/* Paper Sheet */}
      <rect x="7" y="7" width="10" height="11" rx="1.5" fill="#FAF3E0" stroke="#2F3B4B" strokeWidth="1.5" />
      {/* Lines */}
      <line x1="9" y1="10" x2="15" y2="10" stroke="#2F3B4B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="13" x2="13" y2="13" stroke="#2F3B4B" strokeWidth="1.5" strokeLinecap="round" />
      {/* Top Clip */}
      <rect x="9" y="2.5" width="6" height="3" rx="1" fill="#cbd5e1" stroke="#2F3B4B" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * 3D Tactile Hyperlink Chain Icon (Copy Link)
 */
export function CopyLinkIcon({ size = 18, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g stroke="#2F3B4B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Left Link */}
        <path d="M10 14 L7 17 C5.5 18.5 3 18.5 1.5 17 C0 15.5 0 13 1.5 11.5 L4.5 8.5 C6 7 8.5 7 10 8.5" fill="none" />
        {/* Right Link */}
        <path d="M14 10 L17 7 C18.5 5.5 21 5.5 22.5 7 C24 8.5 24 11 22.5 12.5 L19.5 15.5 C18 17 15.5 17 14 15.5" fill="none" />
        {/* Connection Bar */}
        <line x1="8" y1="12" x2="16" y2="12" stroke="#f59e0b" strokeWidth="3" />
      </g>
    </svg>
  );
}

/**
 * Checkmark Icon (for copied feedback)
 */
export function CheckIcon({ size = 18, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="#10b981" stroke="#2F3B4B" strokeWidth="2" />
      <path d="M7 12 L10 15 L17 8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * -------------------------------------------------------------
 * IN-GAME TACTILE REACTION STICKERS (Replacing generic emojis)
 * -------------------------------------------------------------
 */

/**
 * Thumbs Up Sticker (Playful cartoon hand)
 */
export function ReactionThumbsUp({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* 3D Lip */}
      <path
        d="M8 15 V30 H14 V15 Z M14 19 C14 19 18 19 20 17 C22 15 22 10 22 8 C22 6 20 6 19 7 C17 9 17 14 14 15 M14 20 H28 C30 20 31 22 30 24 L28 29 C27.5 30 26 31 24 31 H14"
        fill="#b45309"
        transform="translate(0, 2)"
      />
      {/* Main Hand */}
      <rect x="7" y="14" width="7" height="16" rx="2" fill="#38bdf8" stroke="#2F3B4B" strokeWidth="2.5" />
      <path
        d="M14 19 C15 19 19 19 21 16.5 C22.5 14.5 22.5 9.5 22.5 7.5 C22.5 5.5 20.5 5.5 19.5 6.5 C17.5 8.5 17 13.5 14 15 M14 20 H27 C29 20 30 21.5 29.5 23.5 L27.5 28.5 C27 29.5 25.5 30.5 23.5 30.5 H14"
        fill="#f59e0b"
        stroke="#2F3B4B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Knuckle accents */}
      <line x1="16" y1="23.5" x2="25" y2="23.5" stroke="#2F3B4B" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="27" x2="23" y2="27" stroke="#2F3B4B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Fire Flame Sticker (Vibrant Comic Flame)
 */
export function ReactionFire({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* Outer Flame (Orange) */}
      <path
        d="M18 4 C18 4 11 12 11 20 C11 26.5 14.5 30 18 30 C21.5 30 25 26.5 25 20 C25 15 22 13 22 13 C22 13 22 18 19 19 C18 19 18 15 18 15 C18 15 15 19 15 22 C15 24 16.5 26 18 26 C19.5 26 21 24 21 22 C21 19 20 18 20 18 C20 18 22 21 21 24 C20 27 16 28 15 23 C14 18 18 10 18 4 Z"
        fill="#ea580c"
        stroke="#2F3B4B"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner Flame (Bright Yellow) */}
      <path
        d="M18 15 C18 15 14 20 14 24 C14 27 16 29 18 29 C20 29 22 27 22 24 C22 20 18 15 18 15 Z"
        fill="#fef08a"
        stroke="#2F3B4B"
        strokeWidth="1.8"
      />
      {/* Sparkles */}
      <circle cx="8" cy="18" r="1.5" fill="#f59e0b" />
      <circle cx="28" cy="14" r="1.8" fill="#f59e0b" />
    </svg>
  );
}

/**
 * Laugh / Troll Face Sticker
 */
export function ReactionLaugh({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* Face circle */}
      <circle cx="18" cy="18" r="14" fill="#fef08a" stroke="#2F3B4B" strokeWidth="2.5" />
      {/* Squint Eyes (XD style) */}
      <path d="M10 14 L14 16 L10 18" stroke="#2F3B4B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 14 L22 16 L26 18" stroke="#2F3B4B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Huge laughing mouth */}
      <path
        d="M11 20 C11 26 14 29 18 29 C22 29 25 26 25 20 Z"
        fill="#ef4444"
        stroke="#2F3B4B"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Tongue */}
      <path d="M15 25 C15 28 17 29 18 29 C19 29 21 28 21 25 Z" fill="#fb7185" />
      {/* Tears of joy */}
      <path d="M6 19 C5 21 7 24 8 23 C9 22 8 20 6 19 Z" fill="#38bdf8" stroke="#2F3B4B" strokeWidth="1.5" />
      <path d="M30 19 C31 21 29 24 28 23 C27 22 28 20 30 19 Z" fill="#38bdf8" stroke="#2F3B4B" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Target / Bullseye Sticker
 */
export function ReactionTarget({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* Outer red ring */}
      <circle cx="18" cy="18" r="14" fill="#ef4444" stroke="#2F3B4B" strokeWidth="2.5" />
      {/* Middle white ring */}
      <circle cx="18" cy="18" r="10" fill="#FAF3E0" stroke="#2F3B4B" strokeWidth="2" />
      {/* Inner red ring */}
      <circle cx="18" cy="18" r="6" fill="#ef4444" stroke="#2F3B4B" strokeWidth="2" />
      {/* Center Bullseye Gold */}
      <circle cx="18" cy="18" r="2.5" fill="#fef08a" stroke="#2F3B4B" strokeWidth="1.5" />
      {/* Arrow hitting */}
      <line x1="28" y1="8" x2="19" y2="17" stroke="#2F3B4B" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="26,6 30,10 27,10" fill="#38bdf8" stroke="#2F3B4B" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Shock / Mindblown Face Sticker
 */
export function ReactionShock({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* Face circle with blue panic gradient top */}
      <circle cx="18" cy="18" r="14" fill="#fef08a" stroke="#2F3B4B" strokeWidth="2.5" />
      <path d="M5 14 Q18 9 31 14" fill="none" stroke="#38bdf8" strokeWidth="6" opacity="0.6" strokeLinecap="round" />
      {/* Huge Round Eyes */}
      <circle cx="13" cy="15" r="4.5" fill="#ffffff" stroke="#2F3B4B" strokeWidth="2" />
      <circle cx="13" cy="15" r="2" fill="#1e293b" />
      <circle cx="23" cy="15" r="4.5" fill="#ffffff" stroke="#2F3B4B" strokeWidth="2" />
      <circle cx="23" cy="15" r="2" fill="#1e293b" />
      {/* O-Mouth */}
      <ellipse cx="18" cy="24" rx="4.5" ry="6" fill="#1e293b" stroke="#2F3B4B" strokeWidth="2" />
      {/* Sweat Drop */}
      <path d="M28 10 C27 12 29 14 30 13.5 C31 13 30 11 28 10 Z" fill="#38bdf8" stroke="#2F3B4B" strokeWidth="1.2" />
    </svg>
  );
}
