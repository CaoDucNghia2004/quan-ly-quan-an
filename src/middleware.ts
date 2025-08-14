import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken } from "./lib/utils";
import { Role } from "./constants/type";

const managePaths = ["/manage"];
const guestPaths = ["/guest"];
const privatePaths = [...managePaths, ...guestPaths];
const unAuthPaths = ["/login"];
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    // 1. Nếu chưa đăng nhập mà vào trang riêng tư → chuyển về /login
    if (
        privatePaths.some((path) => pathname.startsWith(path)) &&
        !refreshToken
    ) {
        const url = new URL("/login", request.url);
        url.searchParams.set("clearTokens", "true");
        return NextResponse.redirect(url);
    }

    // 2. Trường hợp đã đăng nhập
    if (refreshToken) {
        //2.1 Nếu đã đăng nhập rồi (có refresh token) mà còn vào lại trang login → redirect về trang chủ
        if (
            unAuthPaths.some((path) => pathname.startsWith(path)) &&
            refreshToken
        ) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // 2.2. Nếu có refresh token nhưng không có access token → token hết hạn → redirect sang /logout để xử lý refresh

        if (
            privatePaths.some((path) => pathname.startsWith(path)) &&
            !accessToken
        ) {
            const url = new URL("/refresh-token", request.url);
            // const url = new URL("/logout", request.url);
            url.searchParams.set("refreshToken", refreshToken);
            url.searchParams.set("redirect", pathname);
            return NextResponse.redirect(url);
        }

        // 2.3 Vào không đúng role, redirect về trang chủ
        const role = decodeToken(refreshToken).role;
        // Guest nhưng cố vào route owner
        const isGuestGoToManagePath =
            role === Role.Guest &&
            managePaths.some((path) => pathname.startsWith(path));
        // Không phải Guest nhưng cố vào route guest
        const isNotGuestGoToGuestPath =
            role !== Role.Guest &&
            guestPaths.some((path) => pathname.startsWith(path));
        if (isGuestGoToManagePath || isNotGuestGoToGuestPath) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // Trường hợp còn lại → cho phép đi tiếp
    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ["/manage/:path*", "/guest/:path*", "/login"],
};
