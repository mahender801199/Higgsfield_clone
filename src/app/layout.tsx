import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Lumora Studio — AI image & video generation",
  description:
    "Lumora is a multi-model AI studio for creators and marketers: generate images and video, build consistent characters, clone voices, and produce ads.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
