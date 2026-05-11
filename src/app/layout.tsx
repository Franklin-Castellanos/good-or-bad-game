import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Good or Bad Game",
  description: "A social clue game about reading the room from 1 to 10.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
