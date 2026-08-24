import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, submitMutation } from "@/lib/api";
import type { BCI, ImovelLite, Paginated } from "@/types/bci";
import type { FormularioBCI } from "@/types/bciForm";

export function useBCIFormSchema() {
  return useQuery({
    queryKey: ["bci-formulario"],
    // Cacheado pelo SW + react-query → disponível offline.
    staleTime: 1000 * 60 * 60 * 24,
    queryFn: () => api.get("bcis/formulario/").json<FormularioBCI>(),
  });
}

export function useBCI(id: number | null) {
  return useQuery({
    queryKey: ["bci", id],
    enabled: id != null,
    queryFn: () => api.get(`bcis/${id}/`).json<BCI>(),
  });
}

export function useBCIs(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["bcis", status ?? "all"],
    queryFn: () => api.get(`bcis/${qs}`).json<Paginated<BCI>>(),
  });
}

/** BCI "aberto" (rascunho ou enviado) para o imóvel, se houver. */
export function useBCIAbertoDoImovel(imovelId: number | null) {
  return useQuery({
    queryKey: ["bci-aberto", imovelId],
    enabled: imovelId != null,
    queryFn: async () => {
      const page = await api
        .get(`bcis/?imovel=${imovelId}&status=rascunho`)
        .json<Paginated<BCI>>();
      if (page.results.length > 0) return page.results[0];
      const enviados = await api
        .get(`bcis/?imovel=${imovelId}&status=enviado`)
        .json<Paginated<BCI>>();
      return enviados.results[0] ?? null;
    },
  });
}

export function useImovelSearch(term: string) {
  return useQuery({
    queryKey: ["imoveis", term],
    enabled: term.trim().length >= 2,
    queryFn: () =>
      api
        .get(`imoveis/?search=${encodeURIComponent(term.trim())}`)
        .json<Paginated<ImovelLite>>(),
  });
}

interface CreateInput {
  imovel: number;
  dados: Record<string, string | number | boolean>;
  observacoes?: string;
  ponto_coletado?: { type: "Point"; coordinates: [number, number] } | null;
  precisao_gps_m?: number | null;
}

export function useCreateBCI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInput) =>
      submitMutation<BCI>({
        path: "bcis/",
        method: "POST",
        body,
        label: `BCI · imóvel ${body.imovel}`,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bcis"] }),
  });
}

export function useDeleteBCI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`bcis/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bcis"] });
      qc.invalidateQueries({ queryKey: ["lotes-geojson"] });
    },
  });
}

interface UpdateInput {
  id: number;
  dados: Record<string, string | number | boolean>;
  observacoes?: string;
}

export function useUpdateBCI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados, observacoes }: UpdateInput) =>
      submitMutation<BCI>({
        path: `bcis/${id}/`,
        method: "PATCH",
        body: { dados, observacoes: observacoes ?? "" },
        label: `BCI #${id} · editar`,
      }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["bcis"] });
      qc.invalidateQueries({ queryKey: ["bci", v.id] });
    },
  });
}

type WorkflowAction = "enviar" | "aprovar" | "rejeitar" | "reabrir";

export function useWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      motivo,
    }: {
      id: number;
      action: WorkflowAction;
      motivo?: string;
    }) =>
      submitMutation<BCI>({
        path: `bcis/${id}/${action}/`,
        method: "POST",
        body: action === "rejeitar" ? { motivo } : {},
        label: `BCI #${id} · ${action}`,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bcis"] }),
  });
}

interface FotoInput {
  id: number;
  file: File;
  lat?: number;
  lon?: number;
  capturada_em?: string;
  legenda?: string;
  tipo?: "geral" | "croqui";
}

export function useUploadFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      file,
      lat,
      lon,
      capturada_em,
      legenda,
      tipo,
    }: FotoInput) =>
      submitMutation({
        path: `bcis/${id}/fotos/`,
        method: "POST",
        body: {
          ...(lat != null ? { latitude: lat } : {}),
          ...(lon != null ? { longitude: lon } : {}),
          ...(capturada_em ? { capturada_em } : {}),
          ...(legenda ? { legenda } : {}),
          ...(tipo ? { tipo } : {}),
        },
        files: [
          {
            field: "imagem",
            name: file.name || "foto.jpg",
            type: file.type || "image/jpeg",
            blob: file,
          },
        ],
        label: `Foto · BCI #${id}`,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bcis"] }),
  });
}
