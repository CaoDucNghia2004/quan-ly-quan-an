import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { HttpError } from "@/lib/http";
import { GuestLoginBodyType } from "@/schemaValidations/guest.schema";
import guestApiRequest from "@/apiRequests/guest";

export async function POST(request: Request) {
    const body = (await request.json()) as GuestLoginBodyType;
    const cookieStore = await cookies();

    try {
        const { payload } = await guestApiRequest.sLogin(body);

        const { accessToken, refreshToken } = payload.data;
        const decodeAccessToken = jwt.decode(accessToken) as { exp: number };
        const decodeRefreshToken = jwt.decode(refreshToken) as { exp: number };

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
