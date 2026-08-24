import { useConnectivity } from "@/hooks/useConnectivity";

export default function OfflineIndicator() {
  const { online, syncing, pending, failed, syncNow, discardFailed } =
    useConnectivity();

  // Nothing to report: online, idle, queue empty.
  if (online && !syncing && pending === 0 && failed === 0) return null;

  let tone = "bg-ink text-paper";
  let message: string;

  if (!online) {
    tone = "bg-warn text-paper";
    message =
      pending > 0
        ? `Sem conexão — ${pending} alteração(ões) salva(s), sobem quando a internet voltar`
        : "Sem conexão — trabalhando offline";
  } else if (failed > 0) {
    tone = "bg-danger text-paper";
    message = `${failed} envio(s) com erro — toque para tentar de novo`;
  } else if (syncing) {
    tone = "bg-ink text-paper";
    message = `Sincronizando ${pending} item(ns)…`;
  } else {
    tone = "bg-ok text-paper";
    message = `${pending} item(ns) na fila de envio`;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative z-50 w-full ${tone}`}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-2 font-mono text-xs">
        <span className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 ${
              online ? "bg-paper" : "bg-paper/60"
            } ${syncing ? "animate-pulse" : ""}`}
          />
          {message}
        </span>
        {online && (pending > 0 || failed > 0) && (
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void syncNow()}
              disabled={syncing}
              className="border border-paper/40 px-2 py-1 hover:bg-paper/10 disabled:opacity-50"
            >
              {syncing ? "…" : "Sincronizar agora"}
            </button>
            {failed > 0 && (
              <button
                type="button"
                onClick={() => void discardFailed()}
                disabled={syncing}
                className="border border-paper/40 px-2 py-1 hover:bg-paper/10 disabled:opacity-50"
              >
                Descartar
              </button>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
