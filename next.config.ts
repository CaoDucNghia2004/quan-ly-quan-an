import type { NextConfig } from "next";

import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
    /* config options here */
    // images: {
    //     remotePatterns: [
    //         {
    //             hostname: "localhost",
    //             pathname: "/**",
    //         },
    //     ],
    // },
    images: {
        remotePatterns: [
            {
                hostname: "localhost",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "api-bigboy.duthanhduoc.com",
                pathname: "/**",
            },
            {
                hostname: "via.placeholder.com",
                pathname: "/**",
            },
        ],
    },
};

export default withNextIntl(nextConfig);
