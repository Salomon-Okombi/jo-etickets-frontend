// src/pages/Client/ProfilePage.tsx
import { useEffect, useState } from "react";
import api from "@/api/axiosClient";
import useAuth from "@/hooks/useAuth";

type Profile = {
  first_name: string;
  last_name: string;
  email: string;
  telephone?: string | null;
  photo_profil_url?: string | null;
};

export default function ProfilePage() {
  const { refreshUser } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    telephone: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     Chargement du profil
  ========================= */
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data } = await api.get<Profile>("/utilisateurs/me/");
        setProfile(data);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          telephone: data.telephone || "",
        });
      } catch {
        setError("Impossible de charger le profil.");
      }
    }

    loadProfile();
  }, []);

  /* =========================
     Gestion formulaire
  ========================= */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  /* =========================
     Enregistrement profil
  ========================= */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("first_name", form.first_name);
      formData.append("last_name", form.last_name);
      if (form.telephone) formData.append("telephone", form.telephone);
      if (photo) formData.append("photo_profil", photo);

      await api.patch("/utilisateurs/me/", formData);

      // Mise à jour du header (avatar, nom)
      await refreshUser();

      alert("Profil mis à jour avec succès");
    } catch {
      setError("Erreur lors de l’enregistrement du profil.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return <div>Chargement du profil…</div>;
  }

  return (
    <section className="profile-page">
      <h1>Mon profil</h1>

      {error && <div className="profile-error">{error}</div>}

      <form onSubmit={handleSubmit} className="profile-card">
        <label>
          Prénom
          <input
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
          />
        </label>

        <label>
          Nom
          <input
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
          />
        </label>

        <label>
          Téléphone
          <input
            name="telephone"
            value={form.telephone}
            onChange={handleChange}
            placeholder="Optionnel"
          />
        </label>

        {/* Aperçu avatar */}
        {photo && (
          <div className="profile-avatar-preview">
            <img
              src={URL.createObjectURL(photo)}
              alt="Aperçu avatar"
            />
          </div>
        )}

        {/* Upload stylé */}
        <label className="file-upload">
          <span className="file-upload__label">Photo de profil</span>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          />

          <span className="file-upload__button">
            Choisir une image
          </span>

          <span className="file-upload__hint">
            JPG, PNG – 5 Mo max
          </span>
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </section>
  );
}
