import { clsx, type ClassValue } from "clsx";
import { UseFormSetError } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { EntityError } from "./http";
import { toast } from "sonner";
import jwt from "jsonwebtoken";
import authApiRequest from "@/apiRequests/auth";
import { DishStatus, OrderStatus, TableStatus } from "@/constants/type";
import envConfig from "@/config";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Xóa đi ký tự "/" đầu tiên của path
 */

export const normalizePath = (path: string) => {
    return path.startsWith("/") ? path.slice(1) : path;
};

export const handleErrorApi = ({
    error,
    setError,
    duration,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setError?: UseFormSetError<any>;
    duration?: number;
}) => {
    if (error instanceof EntityError && setError) {
        error.payload.errors.forEach((item) => {
            setError(item.field, {
                type: "server",
                message: item.message,
            });
        });
    } else {
        toast.error("Lỗi", {
            description: error?.payload?.message || "Lỗi không xác định",
            duration: duration || 5000,
        });
    }
};

const isBrowser = typeof window !== "undefined"; // cần phải kiểm tra nếu ko sẽ bị lỗi

export const getAccessTokenFromLocalStorage = () => {
    return isBrowser ? localStorage.getItem("accessToken") : null;
};

export const getRefreshTokenFromLocalStorage = () => {
    return isBrowser ? localStorage.getItem("refreshToken") : null;
};

export const setAccessTokenToLocalStorage = (value: string) =>
    isBrowser && localStorage.setItem("accessToken", value);

export const setRefreshTokenToLocalStorage = (value: string) =>
    isBrowser && localStorage.setItem("refreshToken", value);

export const removeTokensFromLocalStorage = () => {
    if (isBrowser) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    }
};

export const checkAndRefreshToken = async (param?: {
    onError?: () => void;
    onSuccess?: () => void;
}) => {
    // Không nên đưa logic lấy access và refresh token ra khỏi cái function `checkAndRefreshToken`
    // Vì để mỗi lần mà checkAndRefreshToken() được gọi thì chúng ta se có một access và refresh token mới
    // Tránh hiện tượng bug nó lấy access và refresh token cũ ở lần đầu rồi gọi cho các lần tiếp theo
    const accessToken = getAccessTokenFromLocalStorage();
    const refreshToken = getRefreshTokenFromLocalStorage();
    // Chưa đăng nhập thì cũng không cho chạy
    if (!accessToken || !refreshToken) return;
    const decodedAccessToken = jwt.decode(accessToken) as {
        exp: number;
        iat: number;
    };
    const decodedRefreshToken = jwt.decode(refreshToken) as {
        exp: number;
        iat: number;
    };
    // Thời điểm hết hạn của token là tính theo epoch time (s)
    // Còn khi các bạn dùng cú pháp new Date().getTime() thì nó sẽ trả về epoch time (ms)
    const now = new Date().getTime() / 1000 - 1;
    // trường hợp refresh token hết hạn thì cho logout
    if (decodedRefreshToken.exp <= now) {
        removeTokensFromLocalStorage();
        return param?.onError && param.onError();
    }
    // Ví dụ access token của chúng ta có thời gian hết hạn là 10s
    // thì mình sẽ kiểm tra còn 1/3 thời gian (3s) thì mình sẽ cho refresh token lại
    // Thời gian còn lại sẽ tính dựa trên công thức: decodedAccessToken.exp - now
    // Thời gian hết hạn của access token dựa trên công thức: decodedAccessToken.exp - decodedAccessToken.iat
    if (
        decodedAccessToken.exp - now <
        (decodedAccessToken.exp - decodedAccessToken.iat) / 3
    ) {
        // Gọi API refresh token
        try {
            const res = await authApiRequest.refreshToken();
            setAccessTokenToLocalStorage(res.payload.data.accessToken);
            setRefreshTokenToLocalStorage(res.payload.data.refreshToken);
            if (param?.onSuccess) {
                param.onSuccess();
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            if (param?.onError) {
                param.onError();
            }
        }
    }
};

export const formatCurrency = (number: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(number);
};

export const getVietnameseDishStatus = (
    status: (typeof DishStatus)[keyof typeof DishStatus]
) => {
    switch (status) {
        case DishStatus.Available:
            return "Có sẵn";
        case DishStatus.Unavailable:
            return "Không có sẵn";
        default:
            return "Ẩn";
    }
};

export const getVietnameseOrderStatus = (
    status: (typeof OrderStatus)[keyof typeof OrderStatus]
) => {
    switch (status) {
        case OrderStatus.Delivered:
            return "Đã phục vụ";
        case OrderStatus.Paid:
            return "Đã thanh toán";
        case OrderStatus.Pending:
            return "Chờ xử lý";
        case OrderStatus.Processing:
            return "Đang nấu";
        default:
            return "Từ chối";
    }
};

export const getVietnameseTableStatus = (
    status: (typeof TableStatus)[keyof typeof TableStatus]
) => {
    switch (status) {
        case TableStatus.Available:
            return "Có sẵn";
        case TableStatus.Reserved:
            return "Đã đặt";
        default:
            return "Ẩn";
    }
};

export const getTableLink = ({
    token,
    tableNumber,
}: {
    token: string;
    tableNumber: number;
}) => {
    return (
        envConfig.NEXT_PUBLIC_URL + "/tables/" + tableNumber + "?token=" + token
    );
};
