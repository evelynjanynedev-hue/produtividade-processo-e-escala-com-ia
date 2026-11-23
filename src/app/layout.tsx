import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Execução — sistema operacional pessoal",
  description:
    "Transforme intenção em clareza, ação em evidência e evidência em processo escalável.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
