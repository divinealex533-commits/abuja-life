"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  formatPrice,
  PRICE_GROUP_TITLES,
  type EffectivePrice,
  type PriceGroup,
  type PricedItem,
  type PriceMethod,
} from "@/lib/pricing/items";

type Row = PricedItem & { current: EffectivePrice };
type Draft = { method: PriceMethod; amount: number; active: boolean };

const METHOD_LABEL: Record<PriceMethod, string> = {
  cash: "Game cash",
  naira: "Real Naira (Paystack)",
  free: "Free",
};

const GROUP_ORDER: PriceGroup[] = ["store", "ad", "cosmetic", "venue", "career", "job"];

export default function AdminPricesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/prices", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setNotice({ text: data?.error || "Could not load prices.", ok: false });
      return;
    }
    setRows(data.items);
    const next: Record<string, Draft> = {};
    for (const row of data.items as Row[]) {
      next[row.key] = { ...row.current };
    }
    setDrafts(next);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(row: Row, reset = false) {
    setSavingKey(row.key);
    setNotice(null);
    const draft = drafts[row.key];
    const response = await fetch("/api/admin/prices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reset ? { itemKey: row.key, reset: true } : { itemKey: row.key, ...draft }),
    });
    const data = await response.json().catch(() => null);
    setSavingKey(null);
    if (!response.ok) {
      setNotice({ text: data?.error || "Save failed.", ok: false });
      return;
    }
    setNotice({ text: `${row.name}: ${reset ? "back to default" : "saved"}.`, ok: true });
    void load();
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? rows.filter((r) => `${r.name} ${r.subtitle}`.toLowerCase().includes(term)) : rows;
  }, [rows, search]);

  const input =
    "rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50";

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Link href="/admin" className="text-xs font-bold text-orange-400 hover:text-orange-300">
        ← Admin Dashboard
      </Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight">Prices</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-500">
        Set the price of every VIP item, VIP place and job. For most items you can choose
        <b className="text-slate-300"> game cash</b> (money players earn in the game) or
        <b className="text-slate-300"> real Naira</b> (paid through Paystack, goes to your account).
        Changes apply immediately.
      </p>

      {notice && (
        <div
          className={`mt-6 rounded-2xl border p-4 text-sm ${
            notice.ok ? "border-green-500/20 bg-green-500/10 text-green-300" : "border-red-500/20 bg-red-500/10 text-red-300"
          }`}
        >
          {notice.text}
        </div>
      )}

      <input
        className={`${input} mt-6 w-full max-w-md`}
        placeholder="Search items…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {GROUP_ORDER.map((group) => {
        const groupRows = filtered.filter((r) => r.group === group);
        if (groupRows.length === 0) return null;

        return (
          <section key={group} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-black">{PRICE_GROUP_TITLES[group].title}</h2>
            <p className="mt-1 text-xs text-slate-500">{PRICE_GROUP_TITLES[group].help}</p>

            <div className="mt-4 divide-y divide-white/5">
              {groupRows.map((row) => {
                const draft = drafts[row.key] ?? row.current;
                const changed =
                  draft.method !== row.current.method ||
                  draft.amount !== row.current.amount ||
                  draft.active !== row.current.active;

                return (
                  <div key={row.key} className="grid gap-3 py-4 lg:grid-cols-[1.4fr_1fr_0.8fr_auto] lg:items-center">
                    <div>
                      <div className="font-bold">{row.name}</div>
                      <div className="text-xs text-slate-500">{row.subtitle}</div>
                      <div className="mt-1 text-[11px] text-slate-600">
                        Default: {formatPrice({ method: row.defaultMethod, amount: row.defaultAmount, active: true })}
                      </div>
                    </div>

                    <select
                      className={input}
                      value={draft.method}
                      onChange={(e) =>
                        setDrafts({ ...drafts, [row.key]: { ...draft, method: e.target.value as PriceMethod } })
                      }
                    >
                      {row.allowedMethods.map((m) => (
                        <option key={m} value={m}>
                          {METHOD_LABEL[m]}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">₦</span>
                      <input
                        type="number"
                        min={0}
                        disabled={draft.method === "free"}
                        className={`${input} w-full disabled:opacity-40`}
                        value={draft.method === "free" ? 0 : draft.amount}
                        onChange={(e) =>
                          setDrafts({ ...drafts, [row.key]: { ...draft, amount: Number(e.target.value) } })
                        }
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <input
                          type="checkbox"
                          checked={draft.active}
                          onChange={(e) =>
                            setDrafts({ ...drafts, [row.key]: { ...draft, active: e.target.checked } })
                          }
                        />
                        On sale
                      </label>
                      <button
                        type="button"
                        disabled={!changed || savingKey !== null}
                        onClick={() => save(row)}
                        className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white hover:bg-orange-400 disabled:opacity-30"
                      >
                        {savingKey === row.key ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        disabled={savingKey !== null}
                        onClick={() => save(row, true)}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-white/5"
                      >
                        Default
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
