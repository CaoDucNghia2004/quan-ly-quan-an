// import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import AppProvider from "@/components/app-provider";
import { NextIntlClientProvider, hasLocale } from "next-intl";
// import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Locale } from "@/config";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

// export const metadata: Metadata = {
//     title: "Big Boy Restaurant",
//     description: "The best restaurant in the world",
// };

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "HomePage" });

    return {
        title: t("title"),
        description: "The best restaurant in the world",
    };
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }
    setRequestLocale(locale);
    // const locale = await getLocale();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body
                className={cn(
                    "min-h-screen bg-background font-sans antialiased",
                    fontSans.variable,
                )}
            >
                <NextIntlClientProvider>
                    <AppProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            {children}
                            <Toaster />
                        </ThemeProvider>
                    </AppProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
