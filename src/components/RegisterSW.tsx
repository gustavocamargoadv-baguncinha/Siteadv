"use client";

import { useEffect, useRef, useState } from "react";

// Registra o service worker e, quando uma nova versão do app é publicada,
// mostra um aviso "Nova versão disponível — Atualizar". Ao tocar, o novo
// service worker assume e a página recarrega sozinha na versão nova.
export function RegisterSW() {
  const [aguardando, setAguardando] = useState<ServiceWorker | null>(null);
  const acionou = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reg: ServiceWorkerRegistration | undefined;

    navigator.serviceWorker
      .register("/sw.js")
      .then((r) => {
        reg = r;
        // já há uma versão nova esperando de uma visita anterior?
        if (r.waiting && navigator.serviceWorker.controller) setAguardando(r.waiting);
        // uma versão nova começou a ser baixada
        r.addEventListener("updatefound", () => {
          const novo = r.installing;
          if (!novo) return;
          novo.addEventListener("statechange", () => {
            if (novo.state === "installed" && navigator.serviceWorker.controller) {
              setAguardando(novo);
            }
          });
        });
      })
      .catch(() => {
        // sem service worker o app continua funcionando normalmente
      });

    // quando o novo service worker assume (após o toque), recarrega uma vez
    const onControllerChange = () => {
      if (!acionou.current) return;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // procura por atualização ao abrir e sempre que o app volta ao primeiro plano
    const checar = () => reg?.update().catch(() => {});
    const onVis = () => document.visibilityState === "visible" && checar();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  function atualizar() {
    acionou.current = true;
    aguardando?.postMessage({ type: "SKIP_WAITING" });
  }

  if (!aguardando) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-[60] flex justify-center px-3 sm:bottom-6">
      <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg ring-1 ring-white/10">
        <span>✨ Nova versão disponível</span>
        <button
          onClick={atualizar}
          className="rounded-lg bg-brand-600 px-3 py-1.5 font-semibold text-white transition hover:bg-brand-500"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
}
