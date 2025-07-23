import authApiRequest from "@/apiRequests/auth";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: Request) {
    const cookieStore = await cookies(); // cái thằng này ngoài cơ chế get cookie còn cơ chế set cookie
    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (!refreshToken) {
        return Response.json(
            {
                message: "Không tìm thầy refreshToken",
            },
            {
                status: 401,
            }
        );
    }

    try {
        const { payload } = await authApiRequest.sRefreshToken({
            refreshToken,
        });

        const decodeAccessToken = jwt.decode(payload.data.accessToken) as {
            exp: number;
        };
        const decodeRefreshToken = jwt.decode(payload.data.refreshToken) as {
            exp: number;
        };
        //Là để lấy thời gian hết hạn (exp) từ trong token và dùng nó để set thời gian hết hạn cho cookie.
        cookieStore.set("accessToken", payload.data.accessToken, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            expires: decodeAccessToken.exp * 1000,
        });

        cookieStore.set("refreshToken", payload.data.refreshToken, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            expires: decodeRefreshToken.exp * 1000,
        });

        return Response.json(payload);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        // console.log(error);
        return Response.json(
            {
                message: error.message ?? "Có lỗi xảy ra",
            },
            {
                status: 401,
            }
        );
    }
}
