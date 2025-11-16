import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SensEra - AI Career Coach",
  description:
    "SensEra helps you generate AI-powered resumes, cover letters, mock interviews, career insights, and job preparation tools.",
  keywords: [
    "AI resume builder",
    "AI cover letter generator",
    "mock interview",
    "Industry insights",
  ],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/SensEra_logo.png",
  },
};


export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{ baseTheme: "dark" }}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/SensEra_logo.png" sizes="any" />
          <meta name="google-site-verification" content="xG11mAS9tWB8GUhdZP5JeObmpuZI-AjObYICKTV-G-8" />
        </head>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />

            <footer className="bg-muted/50 py-12">
              <div className="container mx-auto px-4 text-center text-gray-200">
                <p>Designed & Developed with 💗 by AS-Codes15</p>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}


