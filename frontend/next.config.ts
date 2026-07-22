import type { NextConfig } from "next";

// config file cho nextjs
const nextConfig: NextConfig = {
    reactStrictMode :true,
    experimental: {
    },
    images: {
        remotePatterns:[
            {
                protocol: 'https',
                hostname: 's3.amazonaws.com',
                port: '',
                pathname: '/my-bucket/**',
                search: '',
            },
        ]
    },
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:8000/api/:path*" // proxy
            }
        ]
    }
};

export default nextConfig;
