import LoginForm from "@/app/[locale]/(public)/(auth)/login/login-form";
// import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

export default async function Login({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Enable static rendering
    setRequestLocale(locale);

    return (
        <div className="min-h-screen flex items-center justify-center">
            {/* <Suspense>
                <LoginForm />
            </Suspense> */}

            <LoginForm />
        </div>
    );
}
