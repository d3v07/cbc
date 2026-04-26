"use client";

import { useMemo, useState } from "react";
import { AppStoreProvider, useAppStore } from "@/lib/store";
import { Chrome } from "./Chrome";
import { PickMoment } from "./screens/PickMoment";
import { GuidePicker } from "./screens/GuidePicker";
import { Spine } from "./screens/Spine";
import { Render } from "./screens/Render";
import { ReelViewer } from "./screens/ReelViewer";
import { Download, type DownloadArtifact, type DownloadArtifacts } from "./modals/Download";
import ImageCard from "./modals/ImageCard";
import Save from "./modals/Save";
import ShareTrace from "./modals/ShareTrace";
import StartOver from "./modals/StartOver";
import { SCRIPT } from "@/lib/demo";
import type { Guide } from "@/lib/guides/schema";

export function App({ guides }: { guides: Guide[] }) {
  return (
    <AppStoreProvider>
      <AppContent guides={guides} />
    </AppStoreProvider>
  );
}

function posterArtifact(): DownloadArtifact {
  const lines = SCRIPT.draft
    .filter((line) => line.verified)
    .map((line) => line.text)
    .join("\\A ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#f5ecd9"/><circle cx="930" cy="150" r="86" fill="none" stroke="#8b2418" stroke-width="8"/><text x="930" y="162" text-anchor="middle" font-family="serif" font-size="34" fill="#8b2418">100%</text><text x="540" y="310" text-anchor="middle" font-family="serif" font-size="42" fill="#1d150c">${lines.replace(/[<&>]/g, "")}</text><text x="540" y="1160" text-anchor="middle" font-family="monospace" font-size="26" fill="#4a3a26">verified yours</text></svg>`;
  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    filename: "mean-it-poster.svg",
  };
}

function AppContent({ guides }: { guides: Guide[] }) {
  const [{ step }] = useAppStore();
  const [mp4, setMp4] = useState<DownloadArtifact | null>(null);
  const artifacts = useMemo<DownloadArtifacts>(
    () => ({
      poster: posterArtifact(),
      ...(mp4 ? { mp4 } : {}),
    }),
    [mp4],
  );

  return (
    <div className="app">
      <div className="grain" />
      <Chrome />
      <main>
        {step === "moment" && <PickMoment />}
        {step === "guide" && <GuidePicker guides={guides} />}
        {step === "interview" && <div className="stage text-center">Interview screen coming soon...</div>}
        {step === "spine" && <Spine />}
        {step === "drafting" && <div className="stage text-center">Drafting screen coming soon...</div>}
        {step === "render" && <Render />}
        {step === "reel" && <ReelViewer onMp4Ready={setMp4} />}
      </main>
      <Download artifacts={artifacts} />
      <Save />
      <ShareTrace />
      <StartOver />
      <ImageCard />
    </div>
  );
}
