/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Proxy Ollama API calls to external server
      {
        source: '/api/ollama/:path*',
        destination: `${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      // Optional: redirect any direct Ollama calls
      {
        source: '/ollama/:path*',
        destination: `${process.env.OLLAMA_URL || 'http://localhost:11434'}/:path*`,
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig

