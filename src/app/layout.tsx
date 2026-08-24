import type { Metadata } from "next";
import "./globals.css";
import "./navigation.css";
import AppShell from "./components/app-shell";
export const metadata: Metadata={title:"Sistem Maklumat Khairat | Masjid Tengah",description:"Pengurusan ahli dan yuran khairat kematian"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ms"><body><AppShell>{children}</AppShell></body></html>}
