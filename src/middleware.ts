import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { Role } from "./constants/type";
import jwt from "jsonwebtoken";
import { TokenPayload } from "@/types/jwt.types";

const decodeToken = (token: string) => {
    return jwt.decode(token) as TokenPayload;
};

const managePaths = ["/manage"];
const guestPaths = ["/guest"];
const onlyOwnerPaths = ["/manage/accounts"];
const privatePaths = [...managePaths, ...guestPaths];
const unAuthPaths = ["/login"];

// const managePaths = ["/vi/manage", "/en/manage"];

// const guestPaths = ["/vi/guest", "/en/guest"];

// const onlyOwnerPaths = ["/vi/manage/accounts", "/en/manage/accounts"];

// const privatePaths = [...managePaths, ...guestPaths];

// const unAuthPaths = ["/vi/login", "/en/login"];

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

        // Không phải Owner nhưng cố tình truy cập vào các route dành cho owner
        const isNotOwnerGoToOwnerPath =
            role !== Role.Owner &&
            onlyOwnerPaths.some((path) => pathname.startsWith(path));

        if (
            isGuestGoToManagePath ||
            isNotGuestGoToGuestPath ||
            isNotOwnerGoToOwnerPath
        ) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // Trường hợp còn lại → cho phép đi tiếp
    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ["/manage/:path*", "/guest/:path*", "/login"],
    // matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
