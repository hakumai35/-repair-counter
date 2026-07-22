import type { Metadata } from "next";
import "./globals.css";

const repositoryName =
  process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "repair-counter";
const publicBasePath =
  process.env.GITHUB_PAGES === "true" ? `/${repositoryName}` : "";

export const metadata: Metadata = {
  title: "補修カウンター",
  description: "現場の補修箇所を数えて報告文をすぐに作成できるツール",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: `${publicBasePath}/favicon.svg`,
    shortcut: `${publicBasePath}/favicon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
