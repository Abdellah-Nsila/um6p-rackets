import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 2,
    workerThreads: false,
  },
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  skipTrailingSlashRedirect: true,

  // Add the images configuration here to allow Google avatars
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**', 
      },
      // Uncomment this if you also need 42 Intra avatars later
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.intra.42.fr',
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },

  // To make the browser see one origin, as it will behind nginx,
  // we add the rewrite in next.config so the frontend calls /api/... and Next forwards to the gateway:
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://127.0.0.1:3010/api/:path*" },
      { source: "/socket.io", destination: "http://127.0.0.1:3010/socket.io/" },
    ];
  },
};

// standalone mode is used to bundle the application into a single output directory,
// which can be deployed easily. This is particularly useful for serverless deployments or when you want
// to minimize the number of files in your deployment package.
// also its take just used packages and files that are necessary for the application to run,
// which can help reduce the size of the deployment package and improve performance.

export default nextConfig;