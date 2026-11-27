"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type SupplierStatus = "active" | "suspended";
type Supplier = {
  id: number;
  name: string;
  country: string;
  categories: string[];
  rate: number;
  status: SupplierStatus;
  updated_at: string;
};
type ApiError = { detail?: string };

type SupplierDraft = {
  name: string;
  country: string;
  categories: string[];
  rate: string;
  status: SupplierStatus;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CATEGORIES = [
  "medical_supplies",
  "pharma",
  "diagnostics",
  "it_infrastructure",
  "ehr_services",
] as const;
const INITIAL_DRAFT: SupplierDraft = {
  name: "",
  country: "USA",
  categories: [],
  rate: "",
  status: "active",
};

async function readApiError(response: Response, fallback: string): Promise<Error> {
  try {
    const body = await response.json() as ApiError;
    return new Error(body.detail ?? fallback);
  } catch {
    return new Error(fallback);
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString("es-ES", { timeZone: "UTC" }) + " UTC";
}

function StatusBadge({ status }: { status: SupplierStatus }) {
  const active = status === "active";
  return (
    <span className={`status-badge ${active ? "status-active" : "status-suspended"}`}>
      {active ? "Activo" : "Suspendido"}
    </span>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [draft, setDraft] = useState<SupplierDraft>(INITIAL_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rateDrafts, setRateDrafts] = useState<Record<number, string>>({});
  const [busyIds, setBusyIds] = useState<number[]>([]);

  const loadSuppliers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (category) params.set("category", category);
    const query = params.toString();
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers${query ? `?${query}` : ""}`, { signal });
      if (!response.ok) throw await readApiError(response, "No se pudo cargar el directorio de proveedores.");
      setSuppliers(await response.json() as Supplier[]);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Error al conectar con la API de proveedores.");
      setSuppliers([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [country, category]);

  useEffect(() => {
    const controller = new AbortController();
    void loadSuppliers(controller.signal);
    return () => controller.abort();
  }, [loadSuppliers]);

  function toggleCategory(selected: string) {
    setDraft((current) => ({
      ...current,
      categories: current.categories.includes(selected)
        ? current.categories.filter((item) => item !== selected)
        : [...current.categories, selected],
    }));
  }

  async function createSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const parsedRate = Number(draft.rate);
    if (!draft.name.trim() || !draft.country.trim() || draft.categories.length === 0 || !Number.isFinite(parsedRate) || parsedRate <= 0) {
      setError("Completa nombre y país, selecciona al menos una categoría e indica una tarifa mayor que 0.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, name: draft.name.trim(), rate: parsedRate }),
      });
      if (!response.ok) throw await readApiError(response, response.status === 422 ? "La API rechazó los datos. Revisa los campos e inténtalo de nuevo." : "No se pudo crear el proveedor.");
      const created = await response.json() as Supplier;
      setDraft(INITIAL_DRAFT);
      setShowForm(false);
      setNotice("Proveedor creado correctamente.");
      if ((!country || created.country.toLowerCase() === country.toLowerCase()) && (!category || created.categories.some((item) => item.toLowerCase() === category.toLowerCase()))) {
        setSuppliers((current) => [created, ...current]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error al crear el proveedor.");
    } finally {
      setSaving(false);
    }
  }

  async function updateRate(supplier: Supplier) {
    const updatedRate = Number(rateDrafts[supplier.id] ?? supplier.rate);
    if (!Number.isFinite(updatedRate) || updatedRate <= 0) {
      setError("La tarifa debe ser un número mayor que 0.");
      return;
    }
    setError("");
    setNotice("");
    setBusyIds((current) => [...current, supplier.id]);
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/${supplier.id}/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: updatedRate }),
      });
      if (!response.ok) throw await readApiError(response, "No se pudo actualizar la tarifa.");
      const updated = await response.json() as Supplier;
      setSuppliers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setRateDrafts((current) => ({ ...current, [updated.id]: String(updated.rate) }));
      setNotice(`Tarifa de ${updated.name} actualizada.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error al actualizar la tarifa.");
    } finally {
      setBusyIds((current) => current.filter((id) => id !== supplier.id));
    }
  }

  async function toggleStatus(supplier: Supplier) {
    const nextStatus: SupplierStatus = supplier.status === "active" ? "suspended" : "active";
    const previousStatus = supplier.status;
    const previousTimestamp = supplier.updated_at;
    const optimisticTimestamp = new Date().toISOString();
    setError("");
    setNotice("");
    setSuppliers((current) => current.map((item) => item.id === supplier.id ? { ...item, status: nextStatus, updated_at: optimisticTimestamp } : item));
    setBusyIds((current) => [...current, supplier.id]);
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/${supplier.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw await readApiError(response, "No se pudo actualizar el estado.");
      const updated = await response.json() as Supplier;
      setSuppliers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`Estado de ${updated.name} actualizado.`);
    } catch (cause) {
      setSuppliers((current) => current.map((item) => item.id === supplier.id ? { ...item, status: previousStatus, updated_at: previousTimestamp } : item));
      setError(cause instanceof Error ? cause.message : "Error al actualizar el estado.");
    } finally {
      setBusyIds((current) => current.filter((id) => id !== supplier.id));
    }
  }

  return (
    <>
      <header className="topbar">
        <div>HealthCore <span>/</span> Operaciones <span>/</span> Proveedores</div>
        <span className="privacy-label">Compras y suministros</span>
      </header>
      <div className="content suppliers-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">COMPRAS Y SUMINISTROS</p>
            <h1>Directorio de Proveedores</h1>
            <p className="description">Consulta y administra los proveedores sanitarios y tecnológicos de HealthCore.</p>
          </div>
          <button className="primary-action" type="button" onClick={() => { setShowForm((current) => !current); setError(""); }}>
            {showForm ? "Cerrar formulario" : "＋ Nuevo proveedor"}
          </button>
        </div>

        {error && <div className="alert" role="alert">{error}</div>}
        {notice && <div className="notice" role="status">{notice}</div>}

        {showForm && (
          <form className="card supplier-form" onSubmit={createSupplier}>
            <div className="card-heading"><h2>Registrar proveedor</h2><span>Todos los campos son obligatorios</span></div>
            <div className="supplier-form-grid">
              <label>Nombre comercial
                <input required minLength={1} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre del proveedor" />
              </label>
              <label>País de operación
                <select value={draft.country} onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))}>
                  <option value="USA">USA</option><option value="UK">UK</option>
                </select>
              </label>
              <label>Tarifa base (USD / GBP)
                <input required type="number" min="0.01" step="0.01" value={draft.rate} onChange={(event) => setDraft((current) => ({ ...current, rate: event.target.value }))} placeholder="0.00" />
              </label>
              <label>Estado inicial
                <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as SupplierStatus }))}>
                  <option value="active">Activo</option><option value="suspended">Suspendido</option>
                </select>
              </label>
            </div>
            <fieldset className="category-picker">
              <legend>Categorías (selecciona al menos una)</legend>
              <div className="category-options">
                {CATEGORIES.map((item) => (
                  <label key={item}><input type="checkbox" checked={draft.categories.includes(item)} onChange={() => toggleCategory(item)} /> <code>{item}</code></label>
                ))}
              </div>
            </fieldset>
            <div className="form-actions">
              <button className="secondary-action" type="button" onClick={() => { setShowForm(false); setDraft(INITIAL_DRAFT); }}>Cancelar</button>
              <button className="primary-action" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar proveedor"}</button>
            </div>
          </form>
        )}

        <section className="card supplier-directory">
          <div className="supplier-toolbar">
            <div className="card-heading"><h2>Proveedores</h2><span>{loading ? "Cargando…" : `${suppliers.length} registros`}</span></div>
            <div className="supplier-filters">
              <label>País
                <select value={country} onChange={(event) => setCountry(event.target.value)}>
                  <option value="">Todos</option><option value="USA">USA</option><option value="UK">UK</option>
                </select>
              </label>
              <label>Categoría
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="">Todas</option>
                  {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>
          {loading ? <p className="empty supplier-empty">Cargando proveedores…</p> : suppliers.length === 0 ? (
            <p className="empty supplier-empty">No hay proveedores para los filtros seleccionados.</p>
          ) : (
            <div className="table-wrap">
              <table className="supplier-table">
                <thead><tr><th>Nombre</th><th>País</th><th>Categorías</th><th>Tarifa</th><th>Última actualización</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {suppliers.map((supplier) => {
                    const busy = busyIds.includes(supplier.id);
                    return (
                      <tr key={supplier.id}>
                        <td className="supplier-name">{supplier.name}</td>
                        <td>{supplier.country}</td>
                        <td><div className="supplier-category-list">{supplier.categories.map((item) => <code key={item}>{item}</code>)}</div></td>
                        <td>
                          <div className="rate-control">
                            <input aria-label={`Tarifa de ${supplier.name}`} type="number" min="0.01" step="0.01" value={rateDrafts[supplier.id] ?? String(supplier.rate)} onChange={(event) => setRateDrafts((current) => ({ ...current, [supplier.id]: event.target.value }))} />
                            <button className="small-action" type="button" disabled={busy} onClick={() => void updateRate(supplier)}>Guardar</button>
                          </div>
                        </td>
                        <td>{formatTimestamp(supplier.updated_at)}</td>
                        <td><StatusBadge status={supplier.status} /></td>
                        <td><button className="status-action" type="button" disabled={busy} onClick={() => void toggleStatus(supplier)}>{supplier.status === "active" ? "Suspender" : "Activar"}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
