"use client";

import { checkAndRefreshToken } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Những page sau sẽ không check refresh token
const UNAUTHENTICATED_PATH = ["/login", "/logout", "/refresh-token"];
export default function RefreshToken() {
    const pathname = usePathname();
    const router = useRouter();
    useEffect(() => {
        if (UNAUTHENTICATED_PATH.includes(pathname)) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let interval: any = null;

        //Gọi lần đầu: để check ngay lập tức khi component vừa load (tránh delay).
        //  Gọi lần 2 trở đi (setInterval): để check liên tục mỗi giây trong suốt thời gian người dùng online.
        //Nếu không gọi lần đầu, có nguy cơ bị lỗi do access token hết hạn đúng lúc load trang.
        // Phải gọi lần đầu tiên, vì interval sẽ chạy sau thời gian TIMEOUT
        checkAndRefreshToken({
            onError: () => {
                clearInterval(interval);
                router.push("/login");
            },
        });
        // Timeout interval phải bé hơn thời gian hết hạn của access token
        // Ví dụ thời gian hết hạn access token là 10s thì 1s mình sẽ cho check 1 lần
        const TIMEOUT = 1000;
        interval = setInterval(
            () =>
                checkAndRefreshToken({
                    onError: () => {
                        clearInterval(interval);
                        router.push("/login");
                    },
                }),
            TIMEOUT
        );
        return () => {
            clearInterval(interval);
        };
    }, [pathname, router]);
    return null;
}
