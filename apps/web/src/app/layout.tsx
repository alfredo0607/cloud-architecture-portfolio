import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alfredo Dominguez — AWS Solutions Architect",
  description:
    "Portfolio de arquitectura cloud. Diseño sistemas AWS escalables, seguros y costo-eficientes. ECS Fargate, Lambda, CloudFront, Terraform.",
  keywords: [
    "AWS",
    "Cloud Architect",
    "Solutions Architect",
    "Terraform",
    "ECS",
    "Lambda",
    "Colombia",
  ],
  authors: [{ name: "Alfredo José Dominguez Hernández" }],
  openGraph: {
    title: "Alfredo Dominguez — AWS Solutions Architect",
    description:
      "Portfolio de arquitectura cloud: sistemas AWS modernos, escalables y seguros.",
    type: "website",
    locale: "es_CO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
