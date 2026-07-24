/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Projeto dedicado ao blog: quando BLOG_ONLY=1 estiver definido no ambiente
  // (só no projeto Vercel do "Radar Penal"), quem abrir a raiz "/" é levado
  // direto para /blog, em vez de cair na tela de login do sistema.
  //
  // Sem essa variável (todos os outros deploys), nada muda: "/" continua sendo
  // o sistema de gestão. Assim, um mesmo repositório serve o blog público e o
  // sistema interno sem um projeto atrapalhar o outro.
  async redirects() {
    if (process.env.BLOG_ONLY !== "1") return [];
    return [
      {
        source: "/",
        destination: "/blog",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
