import { handleErrorApi } from "@/lib/utils";
import { useLogoutMutation } from "@/queries/useAuth";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "./app-provider";

const UNAUTHENTICATED_PATH = ["/login", "/logout", "/refresh-token"];
export default function ListenLogoutSocket() {
    const pathname = usePathname();
    const router = useRouter();
    const { isPending, mutateAsync } = useLogoutMutation();
    const setRole = useAppStore((state) => state.setRole);
    const disconnectSocket = useAppStore((state) => state.disconnectSocket);
    const socket = useAppStore((state) => state.socket);

    useEffect(() => {
        if (UNAUTHENTICATED_PATH.includes(pathname)) return;
        async function onLogout() {
            if (isPending) return;
            try {
                await mutateAsync();
                setRole();
                disconnectSocket();
                router.push("/");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                handleErrorApi({
                    error,
                });
            }
        }
        socket?.on("logout", onLogout);
        return () => {
            socket?.off("logout", onLogout);
        };
    }, [
        socket,
        pathname,
        setRole,
        router,
        isPending,
        mutateAsync,
        disconnectSocket,
    ]);
    return null;
}
