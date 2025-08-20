import http from "@/lib/http";
import {
    LoginBodyType,
    LoginResType,
    LogoutBodyType,
    RefreshTokenBodyType,
    RefreshTokenResType,
} from "@/schemaValidations/auth.schema";

const authApiRequest = {
    refreshTokenRequest: null as Promise<{
        status: number;
        payload: RefreshTokenResType;
    }> | null,
    sLogin: (body: LoginBodyType) =>
        http.post<LoginResType>("/auth/login", body),
    login: (body: LoginBodyType) =>
        http.post<LoginResType>("/api/auth/login", body, {
            baseUrl: "",
        }),
    sLogout: (
        body: LogoutBodyType & {
            accessToken: string;
        }
    ) =>
        http.post(
            "/auth/logout",
            {
                refreshToken: body.refreshToken,
            },
            {
                headers: {
                    Authorization: `Bearer ${body.accessToken}`,
                },
            }
        ),
    // yêu cầu không chỉ gửi refresh token mà còn gửi access token (trong header Authorization) lên nữa phụ thuộc vào api nữa
    // nếu mà gọi ở server thì phải truyền thêm, gọi ở server thì ko tự động truyền access token phải truyền thủ công
    // còn gọi ở client thì access token tự động truyền vào header (config sẵn trong http)
    logout: () =>
        http.post("/api/auth/logout", null, {
            baseUrl: "",
        }),
    //  access token và refresh token tự động gửi lên cookie, không cần truyền luôn cũng được body: LogoutBodyType
    sRefreshToken: (body: RefreshTokenBodyType) =>
        http.post<RefreshTokenResType>("/auth/refresh-token", body),
    // refreshToken: () =>
    //     http.post<RefreshTokenResType>("/api/auth/refresh-token", null, {
    //         baseUrl: "",
    //     }), // ko cần truyền body vào cũng được bỏi vì đã có cookie gửi lên server rồi
    async refreshToken() {
        if (this.refreshTokenRequest) {
            return this.refreshTokenRequest;
        }
        this.refreshTokenRequest = http.post<RefreshTokenResType>(
            "/api/auth/refresh-token",
            null,
            {
                baseUrl: "",
            }
        );
        const result = await this.refreshTokenRequest;
        this.refreshTokenRequest = null;
        return result;
    },
    setTokenToCookie: (body: { accessToken: string; refreshToken: string }) =>
        http.post("/api/auth/token", body, { baseUrl: "" }),
};

export default authApiRequest;
