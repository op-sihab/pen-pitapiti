"use client";

import React, { useState, useEffect } from "react";
import { multiplayer } from "@/lib/multiplayer";
import {
  ReactionThumbsUp,
  ReactionFire,
  ReactionLaugh,
  ReactionTarget,
  ReactionShock,
} from "./OnlineIcons";

interface OnlineHUDProps {
  roomCode: string;
  isMyTurn: boolean;
  myPlayerIndex: 0 | 1;
  myName: string;
  opponentName: string;
  onLeave: () => void;
}

type ReactionType = "thumb" | "fire" | "laugh" | "target" | "shock";

const REACTIONS: { id: ReactionType; label: string; component: React.ComponentType<{ size?: number }> }[] = [
  { id: "thumb", label: "Good Shot", component: ReactionThumbsUp },
  { id: "fire", label: "Fire Shot", component: ReactionFire },
  { id: "laugh", label: "Laugh", component: ReactionLaugh },
  { id: "target", label: "Target", component: ReactionTarget },
  { id: "shock", label: "Mindblown", component: ReactionShock },
];

export default function OnlineHUD({
  roomCode,
  isMyTurn,
  myPlayerIndex,
  myName,
  opponentName,
  onLeave,
}: OnlineHUDProps) {
  const [floatingReactions, setFloatingReactions] = useState<
    { id: number; type: ReactionType; x: number }[]
  >([]);

  useEffect(() => {
    multiplayer.onRemoteReaction = (reactionId: string) => {
      let type: ReactionType = "thumb";
      if (reactionId === "fire" || reactionId === "🔥") type = "fire";
      else if (reactionId === "laugh" || reactionId === "😂") type = "laugh";
      else if (reactionId === "target" || reactionId === "🎯") type = "target";
      else if (reactionId === "shock" || reactionId === "😱") type = "shock";

      triggerFloatingReaction(type);
    };

    return () => {
      multiplayer.onRemoteReaction = undefined;
    };
  }, []);

  const triggerFloatingReaction = (type: ReactionType) => {
    const id = Date.now() + Math.random();
    const x = 25 + Math.random() * 50; // 25% to 75% width
    setFloatingReactions((prev) => [...prev, { id, type, x }]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((item) => item.id !== id));
    }, 2200);
  };

  const sendReaction = (type: ReactionType) => {
    multiplayer.sendReaction(type);
    triggerFloatingReaction(type);
  };

  const renderReactionComponent = (type: ReactionType, size = 26) => {
    switch (type) {
      case "thumb":
        return <ReactionThumbsUp size={size} />;
      case "fire":
        return <ReactionFire size={size} />;
      case "laugh":
        return <ReactionLaugh size={size} />;
      case "target":
        return <ReactionTarget size={size} />;
      case "shock":
        return <ReactionShock size={size} />;
      default:
        return <ReactionThumbsUp size={size} />;
    }
  };

  return (
    <>
      {/* Floating Animated Cartoon Stickers on Desk */}
      <div className="floating-emojis-container" aria-hidden="true">
        {floatingReactions.map((item) => (
          <div
            key={item.id}
            className="floating-reaction-sticker"
            style={{ left: `${item.x}%` }}
          >
            {renderReactionComponent(item.type, 56)}
          </div>
        ))}
      </div>

      {/* 1. TOP STATUS BAR (Unified Tactile Capsule, Single Line, Never Wraps) */}
      <header className="online-top-bar" role="banner">
        {/* Left: Live Room Code Badge */}
        <div className="top-live-box">
          <span className="live-dot" aria-hidden="true"></span>
          <span className="live-text">LIVE</span>
          {roomCode && <span className="live-code">{roomCode}</span>}
        </div>

        {/* Center: Prominent Turn Indicator */}
        <div className="top-turn-box">
          {isMyTurn ? (
            <div className="top-turn-pill my-turn">
              <span className="turn-bullet">🎯</span>
              <span className="turn-label">YOUR TURN</span>
            </div>
          ) : (
            <div className="top-turn-pill opp-turn">
              <span className="turn-bullet">⏳</span>
              <span className="turn-label">
                {opponentName ? `${opponentName.toUpperCase()}'S TURN` : "WAITING..."}
              </span>
            </div>
          )}
        </div>

        {/* Right: Chunky Red Leave Match Button */}
        <div className="top-leave-box">
          <button
            type="button"
            className="top-leave-btn"
            onClick={onLeave}
            title="Leave Match"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span className="leave-text">LEAVE</span>
          </button>
        </div>
      </header>

      {/* 2. BOTTOM FLOATING REACTION DOCK (Ergonomic, No Desk Blockage) */}
      <aside className="online-reaction-dock" aria-label="Reactions">
        <div className="reaction-dock-pill">
          {REACTIONS.map(({ id, label, component: Comp }) => (
            <button
              key={id}
              type="button"
              className="online-dock-reaction-btn"
              onClick={() => sendReaction(id)}
              title={label}
            >
              <Comp size={24} />
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
