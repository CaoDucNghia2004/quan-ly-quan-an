import accountApiRequest from "@/apiRequests/account";

import { ChangePasswordV2BodyType } from "@/schemaValidations/account.schema";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function PUT(request: Request) {
    const cookieStore = await cookies(); // cái thằng này ngoài cơ chế get cookie còn cơ chế set cookie
    const body = (await request.json()) as ChangePasswordV2BodyType;
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
        return Response.json(
            {
                message: "Không tìm thấy access token",
            },
            {
                status: 401,
            }
        );
    }
    try {
        const { payload } = await accountApiRequest.sChangePasswordV2(
            accessToken,
            body
        );
        const decodedAccessToken = jwt.decode(payload.data.accessToken) as {
            exp: number;
        };

        const decodedRefreshToken = jwt.decode(payload.data.refreshToken) as {
            exp: number;
        };

        cookieStore.set("accessToken", payload.data.accessToken, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            expires: decodedAccessToken.exp * 1000,
        });

        cookieStore.set("refreshToken", payload.data.refreshToken, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            expires: decodedRefreshToken.exp * 1000,
        });

        return Response.json(payload);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return Response.json(
            {
                message: error.message ?? "Có lỗi xảy ra",
            },
            {
                status: error.status ?? 500,
            }
        );
    }
}
