/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // A home abre direto no jogo (arquivo estático em /public/jogo.html),
    // mantendo a URL "/". O restante do app segue nas suas rotas.
    return {
      beforeFiles: [{ source: "/", destination: "/jogo.html" }],
    };
  },
  async redirects() {
    // Rota antiga do jogo passa a apontar para a home (o jogo).
    return [{ source: "/jogo", destination: "/", permanent: false }];
  },
};

export default nextConfig;
