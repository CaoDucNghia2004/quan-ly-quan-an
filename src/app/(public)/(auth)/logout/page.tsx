"use client";

import { useAppContext } from "@/components/app-provider";
import {
    getAccessTokenFromLocalStorage,
    getRefreshTokenFromLocalStorage,
} from "@/lib/utils";
import { useLogoutMutation } from "@/queries/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

function Logout() {
    // const logoutMutation = useLogoutMutation()
    const { mutateAsync } = useLogoutMutation();
    const router = useRouter();
    const { setIsAuth } = useAppContext();
    const searchParams = useSearchParams();
    const refreshTokenFromUrl = searchParams.get("refreshToken");
    const accessTokenFromUrl = searchParams.get("accessToken");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ref = useRef<any>(null); // dùng để giữ lại tham chiếu (tránh gọi lại logout nhiều lần)
    useEffect(() => {
        // logoutMutation.mutateAsync().then((res) => {
        //     router.push("/login");
        // });
        if (
            !ref.current &&
            ((refreshTokenFromUrl &&
                refreshTokenFromUrl === getRefreshTokenFromLocalStorage()) ||
                (accessTokenFromUrl &&
                    accessTokenFromUrl === getAccessTokenFromLocalStorage()))
        ) {
            ref.current = mutateAsync;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            mutateAsync().then((res) => {
                setTimeout(() => {
                    ref.current = null;
                }, 1000);
                router.push("/login");
            });
        } else {
            setIsAuth(false);
            router.push("/");
        }
        // // Nếu đã gọi logout trước đó rồi thì không gọi lại nữa
        // ref.current = mutateAsync; // đánh dấu là "đang xử lý logout"
        // // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // mutateAsync().then((res) => {
        //     setTimeout(() => {
        //         ref.current = null; // reset sau 1 giây
        //     }, 1000);
        //     router.push("/login");
        // });
    }, [
        mutateAsync,
        router,
        refreshTokenFromUrl,
        accessTokenFromUrl,
        setIsAuth,
    ]);
    return <div>Log out ....</div>;
}

export default function LogoutPage() {
    return (
        <Suspense>
            <Logout />
        </Suspense>
    );
}

// obj dễ bị thay đổi tham chiếu khi gọi logoutMutation.mutateAsync() khiến logoutMutation thay đổi tham chiếu, thì trong useEffect sẽ gọi lại liên tục
