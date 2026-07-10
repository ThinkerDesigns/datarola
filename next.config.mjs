/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large CSV/XLSX uploads (default is 1MB — too small for any real dataset)
  serverActions: {
    bodySizeLimit: '50mb',
  },
};

export default nextConfig;
