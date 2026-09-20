/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oeijyuwngxmvlfffhixm.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],

    // TAMBAHAN optional tapi sangat disarankan:
    // Supaya Vercel domain & custom domain tidak error load gambar
    domains: ["oeijyuwngxmvlfffhixm.supabase.co"],
  },


  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/insight",
        destination: "/insights",
        permanent: true,
      },
      {
        source: "/insight/:path*",
        destination: "/insights/:path*",
        permanent: true,
      },
      {
        source: "/network",
        destination: "/networks",
        permanent: true,
      },
      {
        source: "/network/:path*",
        destination: "/networks/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
