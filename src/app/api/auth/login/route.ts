import authApiRequest from "@/apiRequests/auth";
import { LoginBodyType } from "@/schemaValidations/auth.schema";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { HttpError } from "@/lib/http";

export async function POST(request: Request) {
    const body = (await request.json()) as LoginBodyType; //Nếu không gọi await request.json(), bạn sẽ không thể lấy được dữ liệu body từ client gửi lên.
    const cookieStore = await cookies(); // cái thằng này ngoài cơ chế get cookie còn cơ chế set cookie

    try {
        const { payload } = await authApiRequest.sLogin(body);

        const { accessToken, refreshToken } = payload.data;
        const decodeAccessToken = jwt.decode(accessToken) as { exp: number };
        const decodeRefreshToken = jwt.decode(refreshToken) as { exp: number };
        //Là để lấy thời gian hết hạn (exp) từ trong token và dùng nó để set thời gian hết hạn cho cookie.
        cookieStore.set("accessToken", accessToken, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            expires: decodeAccessToken.exp * 1000,
        });

        cookieStore.set("refreshToken", refreshToken, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            expires: decodeRefreshToken.exp * 1000,
        });

        return Response.json(payload);
    } catch (error) {
        // console.log("Lỗi khi gọi authApiRequest.sLogin:", error);
        //HttpError là lỗi do API trả về (có status, payload)
        if (error instanceof HttpError) {
            return Response.json(error.payload, {
                status: error.status,
            });
        } else {
            //Tức là đây là một lỗi bất ngờ (bug, lỗi code, lỗi decode...), không phải lỗi từ API trả về.
            return Response.json(
                {
                    message: "Có lỗi xảy ra",
                },
                {
                    status: 500,
                }
            );
        }
    }
}
