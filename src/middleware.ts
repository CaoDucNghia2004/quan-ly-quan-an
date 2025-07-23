import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const privatePaths = ["/manage"];
const unAuthPaths = ["/login"];
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    // Nếu chưa đăng nhập mà vào trang riêng tư → chuyển về /login
    if (
        privatePaths.some((path) => pathname.startsWith(path)) &&
        !refreshToken
    ) {
        const url = new URL("/login", request.url);
        url.searchParams.set("clearTokens", "true");
        return NextResponse.redirect(url);
    }

    // Nếu đã đăng nhập rồi (có refresh token) mà còn vào lại trang login → redirect về trang chính
    if (unAuthPaths.some((path) => pathname.startsWith(path)) && refreshToken) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Nếu có refresh token nhưng không có access token → token hết hạn → redirect sang /logout để xử lý refresh
    if (
        privatePaths.some((path) => pathname.startsWith(path)) &&
        !accessToken &&
        refreshToken
    ) {
        const url = new URL("/refresh-token", request.url);
        // const url = new URL("/logout", request.url);
        url.searchParams.set("refreshToken", refreshToken);
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // Trường hợp còn lại → cho phép đi tiếp
    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ["/manage/:path*", "/login"],
};
