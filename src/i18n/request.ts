// import { getUserLocale } from "@/services/locale";
// import { getRequestConfig } from "next-intl/server";

// export default getRequestConfig(async () => {
//     // Ngôn ngữ website
//     // Cái giá trị locale chúng ta có thể lấy từ cookie người dùng chẳng hạn.
//     const locale = await getUserLocale();

//     return {
//         locale,
//         messages: (await import(`../../messages/${locale}.json`)).default,
//     };
// });

import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
    // Typically corresponds to the `[locale]` segment
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested)
        ? requested
        : routing.defaultLocale;

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
