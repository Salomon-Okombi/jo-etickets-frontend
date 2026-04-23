//src/pages/Stats/StatsPage.tsx
import { useEffect, useMemo, useState } from "react";
import api  from "@/api/axiosClient";
import "@/styles/admin.css";

type TopOffre = {
  offre_id: number;
  offre_nom: string | null;
  nombre_ventes: number;
  chiffre_affaires: string | number;
};

type GlobalStats = {
  ventes_totales: number;
  chiffre_affaires_total: string | number;
  panier_moyen: string | number;
  nombre_offres_suivies: number;
  moyenne_ventes_jour_globale: string | number;
  derniere_mise_a_jour: string | null;
  top_5_offres: TopOffre[];
};

type StatVente = {
  id: number;
  offre: number;
  offre_nom: string;
  nombre_ventes: number;
  chiffre_affaires: string | number;
  date_derniere_maj: string;
  moyenne_ventes_jour: string | number;
  pic_ventes_heure: string | null;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const PAGE_SIZES = [10, 20, 50] as const;

function toNumber(v: string | number | undefined | null): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(v: number | string | null | undefined) {
  const n = toNumber(v ?? 0);
  return n.toLocaleString("fr-FR");
}

function formatCurrency(v: number | string | null | undefined) {
  const n = toNumber(v ?? 0);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function formatDate(v?: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("fr-FR");
  } catch {
    return v;
  }
}

function sortLabel(key: SortKey) {
  switch (key) {
    case "ventes_desc":
      return "Ventes ↓";
    case "ventes_asc":
      return "Ventes ↑";
    case "ca_desc":
      return "CA ↓";
    case "ca_asc":
      return "CA ↑";
    case "maj_desc":
      return "MAJ ↓";
    case "maj_asc":
      return "MAJ ↑";
    case "nom_asc":
      return "Offre A→Z";
    case "nom_desc":
      return "Offre Z→A";
    default:
      return "Tri";
  }
}

type SortKey =
  | "ventes_desc"
  | "ventes_asc"
  | "ca_desc"
  | "ca_asc"
  | "maj_desc"
  | "maj_asc"
  | "nom_asc"
  | "nom_desc";

function sortStats(stats: StatVente[], sort: SortKey) {
  const arr = [...stats];
  arr.sort((a, b) => {
    const ventesA = a.nombre_ventes ?? 0;
    const ventesB = b.nombre_ventes ?? 0;
    const caA = toNumber(a.chiffre_affaires);
    const caB = toNumber(b.chiffre_affaires);
    const majA = a.date_derniere_maj ? new Date(a.date_derniere_maj).getTime() : 0;
    const majB = b.date_derniere_maj ? new Date(b.date_derniere_maj).getTime() : 0;
    const nomA = (a.offre_nom ?? "").toLowerCase();
    const nomB = (b.offre_nom ?? "").toLowerCase();

    switch (sort) {
      case "ventes_desc":
        return ventesB - ventesA;
      case "ventes_asc":
        return ventesA - ventesB;
      case "ca_desc":
        return caB - caA;
      case "ca_asc":
        return caA - caB;
      case "maj_desc":
        return majB - majA;
      case "maj_asc":
        return majA - majB;
      case "nom_asc":
        return nomA.localeCompare(nomB);
      case "nom_desc":
        return nomB.localeCompare(nomA);
      default:
        return 0;
    }
  });
  return arr;
}

function KpiCard(props: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="admin-kpi-card">
      <div className="admin-kpi-card__label">{props.label}</div>
      <div className="admin-kpi-card__value">{props.value}</div>
      <div className="admin-kpi-card__hint">{props.hint}</div>
    </div>
  );
}

export default function StatsPage() {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [stats, setStats] = useState<StatVente[]>([]);
  const [count, setCount] = useState(0);

  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [loadingList, setLoadingList] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // recherche locale (sur résultats récupérés)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // tri local
  const [sortKey, setSortKey] = useState<SortKey>("ventes_desc");

  // debounce search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // ✅ Endpoints (SANS /api car axios baseURL est très probablement .../api)
  // => correspond à /api/statistiques/ventes/...
  const ENDPOINT_GLOBAL = "/statistiques/ventes/global/";
  const ENDPOINT_LIST = "/statistiques/ventes/";

  useEffect(() => {
    const controller = new AbortController();

    async function fetchGlobal() {
      try {
        setLoadingGlobal(true);
        setError(null);
        const { data } = await api.get<GlobalStats>(ENDPOINT_GLOBAL, { signal: controller.signal });
        setGlobalStats(data);
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;

        const status = err?.response?.status;
        if (status === 401) setError("Non authentifié (401). Connecte-toi.");
        else if (status === 403) setError("Accès refusé (403). Admin requis.");
        else if (status === 404) setError("Endpoint stats global introuvable (404). Vérifie /api/statistiques/ventes/global/.");
        else setError("Chargement des statistiques globales impossible.");
        console.error("StatsPage global error:", err);
      } finally {
        setLoadingGlobal(false);
      }
    }

    fetchGlobal();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchList() {
      try {
        setLoadingList(true);
        setError(null);

        // Pagination DRF
        const params: Record<string, string | number> = {
          page,
          page_size: pageSize,
        };

        // NOTE: ton ViewSet n'a pas de SearchFilter déclaré.
        // On ne force pas un `search=` serveur ici.
        const { data } = await api.get<Paginated<StatVente>>(ENDPOINT_LIST, {
          params,
          signal: controller.signal,
        });

        setStats(data.results);
        setCount(data.count);
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;

        const status = err?.response?.status;
        if (status === 401) setError("Non authentifié (401). Connecte-toi.");
        else if (status === 403) setError("Accès refusé (403). Admin requis.");
        else if (status === 404) setError("Endpoint stats introuvable (404). Vérifie /api/statistiques/ventes/.");
        else setError("Chargement des statistiques impossible.");
        console.error("StatsPage list error:", err);
      } finally {
        setLoadingList(false);
      }
    }

    fetchList();
    return () => controller.abort();
  }, [page, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // filtre local sur la page courante
  const filtered = useMemo(() => {
    if (!search) return stats;
    const needle = search.toLowerCase();
    return stats.filter((s) => {
      const nom = (s.offre_nom ?? "").toLowerCase();
      return nom.includes(needle);
    });
  }, [stats, search]);

  // tri local
  const sorted = useMemo(() => sortStats(filtered, sortKey), [filtered, sortKey]);

  const showLoading = loadingGlobal || loadingList;

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Statistiques</div>
        <div className="admin-subtitle">
          Statistiques de ventes par offre (admin-only) + indicateurs globaux.
        </div>
      </div>

      {error ? (
        <div className="admin-alert" role="alert">
          {error}
        </div>
      ) : null}

      {/* KPI */}
      <div className="admin-kpi-grid" style={{ marginTop: "1rem" }}>
        <KpiCard
          label="Ventes totales"
          value={loadingGlobal ? "…" : formatNumber(globalStats?.ventes_totales)}
          hint="Total des billets vendus (toutes offres)."
        />
        <KpiCard
          label="Chiffre d’affaires"
          value={loadingGlobal ? "…" : formatCurrency(globalStats?.chiffre_affaires_total)}
          hint="Somme du CA sur toutes les offres."
        />
        <KpiCard
          label="Panier moyen"
          value={loadingGlobal ? "…" : formatCurrency(globalStats?.panier_moyen)}
          hint="CA total / ventes totales."
        />
        <KpiCard
          label="Offres suivies"
          value={loadingGlobal ? "…" : formatNumber(globalStats?.nombre_offres_suivies)}
          hint="Nombre d’offres avec stats agrégées."
        />
      </div>

      {/* Top 5 */}
      <section style={{ marginTop: "1.6rem" }}>
        <div className="admin-table-wrap">
          <div className="admin-table-head">
            <div>
              <div className="admin-table-title">Top 5 offres (par ventes)</div>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
                Dernière MAJ : {loadingGlobal ? "…" : formatDate(globalStats?.derniere_mise_a_jour)}
              </div>
            </div>
          </div>

          {loadingGlobal ? (
            <div className="admin-table-state">Chargement…</div>
          ) : !globalStats?.top_5_offres?.length ? (
            <div className="admin-table-state">Aucune donnée top offres.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Offre</th>
                    <th className="admin-td-center">Ventes</th>
                    <th className="admin-td-right">CA</th>
                  </tr>
                </thead>
                <tbody>
                  {globalStats.top_5_offres.map((o) => (
                    <tr key={o.offre_id}>
                      <td>{o.offre_nom ?? `Offre #${o.offre_id}`}</td>
                      <td className="admin-td-center">{formatNumber(o.nombre_ventes)}</td>
                      <td className="admin-td-right">{formatCurrency(o.chiffre_affaires)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Table complète */}
      <section style={{ marginTop: "1.6rem" }}>
        <div className="admin-table-wrap">
          <div className="admin-table-head">
            <div>
              <div className="admin-table-title">Toutes les offres</div>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
                {count.toLocaleString("fr-FR")} ligne(s) — page {page}/{totalPages}
              </div>
            </div>

            <div className="admin-table-tools">
              <input
                className="admin-input"
                placeholder="Filtrer (nom offre)…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />

              <select
                className="admin-select"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="ventes_desc">{sortLabel("ventes_desc")}</option>
                <option value="ventes_asc">{sortLabel("ventes_asc")}</option>
                <option value="ca_desc">{sortLabel("ca_desc")}</option>
                <option value="ca_asc">{sortLabel("ca_asc")}</option>
                <option value="maj_desc">{sortLabel("maj_desc")}</option>
                <option value="maj_asc">{sortLabel("maj_asc")}</option>
                <option value="nom_asc">{sortLabel("nom_asc")}</option>
                <option value="nom_desc">{sortLabel("nom_desc")}</option>
              </select>

              <select
                className="admin-select"
                value={pageSize}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}/page
                  </option>
                ))}
              </select>

              <button className="admin-btn" onClick={() => setPage(1)} disabled={showLoading}>
                {showLoading ? "…" : "Actualiser"}
              </button>
            </div>
          </div>

          {loadingList ? (
            <div className="admin-table-state">Chargement…</div>
          ) : sorted.length === 0 ? (
            <div className="admin-table-state">Aucune statistique trouvée.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Offre</th>
                    <th className="admin-td-center">Ventes</th>
                    <th className="admin-td-right">CA</th>
                    <th className="admin-td-right">Moy./jour</th>
                    <th>Dernière MAJ</th>
                    <th>Pic ventes heure</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => (
                    <tr key={s.id}>
                      <td>{s.offre_nom ?? `Offre #${s.offre}`}</td>
                      <td className="admin-td-center">{formatNumber(s.nombre_ventes)}</td>
                      <td className="admin-td-right">{formatCurrency(s.chiffre_affaires)}</td>
                      <td className="admin-td-right">{formatNumber(s.moyenne_ventes_jour)}</td>
                      <td>{formatDate(s.date_derniere_maj)}</td>
                      <td>{formatDate(s.pic_ventes_heure)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="admin-table-footer">
                <div className="admin-table-footer__text">
                  {count.toLocaleString("fr-FR")} ligne(s) — page {page}/{totalPages}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="admin-btn admin-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ←
                  </button>
                  <button className="admin-btn admin-btn--sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    →
                  </button>
                </div>
              </div>

              {/* petit badge info */}
              <div style={{ padding: "0.85rem 1rem" }} className="admin-text-muted">
                <span className="admin-badge admin-badge--muted">Info</span>{" "}
                Recherche/tri effectués localement (sur la page chargée). Si tu veux une recherche serveur, on peut ajouter SearchFilter côté ViewSet.
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}