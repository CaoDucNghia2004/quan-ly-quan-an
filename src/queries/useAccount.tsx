import accountApiRequest from "@/apiRequests/account";
// import { AccountResType } from "@/schemaValidations/account.schema";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useAccountMe = () => {
    return useQuery({
        queryKey: ["account-me"],
        queryFn: accountApiRequest.me,
    });
};

// export const useAccountMe = (
//     onSuccess?: (data: AccountResType) => void
// ) => {
//     return useQuery({
//         queryKey: ["account-profile"],
//         queryFn: () =>
//             accountApiRequest.me().then((res) => {
//                 if (onSuccess) onSuccess(res.payload);
//                 return res
//             }),
//     });
// };

export const useUpdateMeMutation = () => {
    return useMutation({
        mutationFn: accountApiRequest.updateMe,
    });
};

// export const useChangePasswordMutation = () => {
//     return useMutation({
//         mutationFn: accountApiRequest.changePassword,
//     });
// };

export const useChangePasswordMutation = () => {
    return useMutation({
        mutationFn: accountApiRequest.changePasswordV2,
    });
};
