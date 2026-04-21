//src/pages/Client/TicketsListPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { EBillet } from "@/types/billets";
import { listBillets } from "@/api/billets.api";

export default function TicketsListPage() {
  const [rows, setRows] = useState<EBillet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await listBillets();

        if (!mounted) return;

        // DRF pagination
        if (Array.isArray(data)) {
          setRows(data);
        } else {
          setRows(data.results ?? []);
        }
      } catch {
        if (mounted) setError("Impossible de charger vos billets.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div style={{ padding: "2rem" }}>Chargement…</div>;
  if (error) return <div style={{ padding: "2rem" }}>{error}</div>;

  if (rows.length === 0) {
    return <div style={{ padding: "2rem" }}>Vous n’avez aucun billet.</div>;
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>
        Mes billets
      </h1>

      <div style={{ display: "grid", gap: "1rem" }}>
        {rows.map((b) => (
          <Link
            key={b.id}
            to={`/mon-espace/billets/${b.id}`}
            style={{
              padding: "1rem",
              borderRadius: 12,
              border: "1px solid rgba(15,23,42,0.15)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <strong>{b.numero_billet}</strong>
            <div>{b.offre_nom}</div>
            <div>Statut : {b.statut}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}