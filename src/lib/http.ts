import { redirect } from "next/navigation";
import { normalizePath } from "./utils";
import { LoginResType } from "@/schemaValidations/auth.schema";

type CustomOptions = Omit<RequestInit, "method"> & {
    baseUrl?: string | undefined;
};

const ENTITY_ERROR_STATUS = 422;
const AUTHENTICATION_ERROR_STATUS = 401;

type EntityErrorPayload = {
    message: string;
    errors: {
        field: string;
        message: string;
    }[];
};

export class HttpError extends Error {
    status: number;
    payload: {
        message: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    constructor({
        status,
        payload,
        message = "Lỗi HTTP",
    }: {
        status: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: any;
        message?: string;
    }) {
        super(message);
        this.status = status;
        this.payload = payload;
    }
}

export class EntityError extends HttpError {
    status: typeof ENTITY_ERROR_STATUS;
    payload: EntityErrorPayload;
    constructor({
        status,
        payload,
    }: {
        status: typeof ENTITY_ERROR_STATUS;
        payload: EntityErrorPayload;
    }) {
        super({ status, payload, message: "Lôi thực thể" });
        this.status = status;
        this.payload = payload;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clientLogoutRequest: null | Promise<any> = null;
const isClient = typeof window !== "undefined";

const request = async <Response>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    options?: CustomOptions | undefined
) => {
    let body: FormData | string | undefined = undefined;
    if (options?.body instanceof FormData) {
        body = options.body;
    } else if (options?.body) {
        body = JSON.stringify(body);
    }

    const baseHeaders: { [key: string]: string } =
        body instanceof FormData ? {} : { "Content-Type": "application/json" };

    if (isClient) {
        const accessToken = localStorage.getItem("accessToken");
        baseHeaders.Authorization = `Bearer ${accessToken}`;
    }

    const baseUrl =
        options?.baseUrl === undefined
            ? process.env.NEXT_PUBLIC_API_ENDPOINT
            : options.baseUrl;

    const fullUrl = `${baseUrl}/${normalizePath(url)}`;

    const res = await fetch(fullUrl, {
        ...options,
        headers: {
            ...baseHeaders,
            ...options?.headers,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        body,
        method,
    });

    const payload: Response = await res.json();
    const data = {
        status: res.status,
        payload,
    };

    // Interceptor là nơi chúng ta xử lý request và response trước khi trả về cho phía component
    if (!res.ok) {
        if (res.status === ENTITY_ERROR_STATUS) {
            throw new EntityError(
                data as {
                    status: 422;
                    payload: EntityErrorPayload;
                }
            );
        } else if (res.status === AUTHENTICATION_ERROR_STATUS) {
            if (isClient) {
                clientLogoutRequest = fetch("/api/auth/logout", {
                    method: "POST",
                    body: null, //Logout mình luôn cho phép luôn luôn thành công
                    headers: {
                        ...baseHeaders,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any,
                });
                try {
                    await clientLogoutRequest;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                } finally {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    clientLogoutRequest = null;
                    // Redirect về trang login có thể dẫn đến loop vô hạn
                    // Nếu không không được xử lý đúng cách
                    // Vì nếu rơi vào trường hợp tại trang login, chúng ta có gọi api cần accessToken
                    // Mà accessToken đã bị xóa thì nhảy vào đây, cứ thể thì nó sẽ bị lặp
                    location.href = "/login";
                }
            } else {
                const accessToken =
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (options?.headers as any).Authorization.split("Bearer ")[1];
                redirect(`/logout?accessToken=${accessToken}`);
            }
        } else {
            throw new HttpError(data);
        }
    }

    // Logic này chỉ chạy được phái client
    if (isClient) {
        const normalizeUrl = normalizePath(url);
        if (normalizeUrl === "api/auth/login") {
            const { accessToken, refreshToken } = (payload as LoginResType)
                .data;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
        } else if (normalizeUrl === "api/auth/logout") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        }
    }
    return data;
};

const http = {
    get<Response>(
        url: string,
        options?: Omit<CustomOptions, "body"> | undefined
    ) {
        return request<Response>("POST", url, options);
    },
    post<Response>(
        url: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: any,
        options: Omit<CustomOptions, "body">
    ) {
        return request<Response>("POST", url, { ...options, body });
    },
    put<Response>(
        url: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: any,
        options: Omit<CustomOptions, "body">
    ) {
        return request<Response>("POST", url, { ...options, body });
    },
    delete<Response>(
        url: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: any,
        options: Omit<CustomOptions, "body">
    ) {
        return request<Response>("POST", url, { ...options, body });
    },
};
