"use client";

import { checkAndRefreshToken } from "@/lib/utils";

import { useEffect } from "react";
import { useAppStore } from "./app-provider";
import { usePathname, useRouter } from "@/i18n/routing";

// Những page sau sẽ không check refresh token
const UNAUTHENTICATED_PATH = ["/login", "/logout", "/refresh-token"];
export default function RefreshToken() {
    const pathname = usePathname();
    const router = useRouter();
    const socket = useAppStore((state) => state.socket);
    const disconnectSocket = useAppStore((state) => state.disconnectSocket);
    useEffect(() => {
        if (UNAUTHENTICATED_PATH.includes(pathname)) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let interval: any = null;

        //Gọi lần đầu: để check ngay lập tức khi component vừa load (tránh delay).
        //  Gọi lần 2 trở đi (setInterval): để check liên tục mỗi giây trong suốt thời gian người dùng online.
        //Nếu không gọi lần đầu, có nguy cơ bị lỗi do access token hết hạn đúng lúc load trang.
        // Phải gọi lần đầu tiên, vì interval sẽ chạy sau thời gian TIMEOUT
        const onRefreshToken = (force?: boolean) => {
            checkAndRefreshToken({
                onError: () => {
                    clearInterval(interval);
                    disconnectSocket();
                    router.push("/login");
                },
                force,
            });
        };

        onRefreshToken();
        // Timeout interval phải bé hơn thời gian hết hạn của access token
        // Ví dụ thời gian hết hạn access token là 10s thì 1s mình sẽ cho check 1 lần
        const TIMEOUT = 1000;
        interval = setInterval(onRefreshToken, TIMEOUT);

        if (socket?.connected) {
            onConnect();
        }

        function onConnect() {
            console.log(socket?.id);
        }

        function onDisconnect() {
            console.log("disconnect");
        }

        function onRefreshTokenSocket() {
            onRefreshToken(true);
        }
        socket?.on("connect", onConnect);
        socket?.on("disconnect", onDisconnect);
        socket?.on("refresh-token", onRefreshTokenSocket);
        return () => {
            clearInterval(interval);
            socket?.off("connect", onConnect);
            socket?.off("disconnect", onDisconnect);
            socket?.off("refresh-token", onRefreshTokenSocket);
        };
    }, [pathname, router, socket, disconnectSocket]);
    return null;
}
