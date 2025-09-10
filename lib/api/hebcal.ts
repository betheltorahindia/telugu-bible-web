// lib/api/hebcal.ts
// Server-safe helpers to fetch Parasha/Haftarah from Hebcal Leyning API
// (Diaspora; triennial OFF)

export type Aliyah = { k: string; b: string; e: string; v: number; p?: number };
export type LeyningItem = {
  date: string;
  hdate?: string;
  name?: { en?: string; he?: string };
  summary?: string;
  fullkriyah?: Record<string, Aliyah>;
  haft?: { k: string; b: string; e: string; v?: number };
  haftara?: string;
};

export type UpcomingShabbat = {
  shabbatDateISO: string;
  shabbatHebrew?: string;
  parashaEn?: string;
  parashaHe?: string;
  aliyot: { n: string; k: string; b: string; e: string }[];
  haftara?: { k: string; b: string; e: string; label: string };
  // debug fields for surfacing issues
  _url?: string;
  _status?: number;
  _error?: string;
};

// Format YYYY-MM-DD in **local time** (not UTC)
function toLocalISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Find this coming Saturday (Shabbat) in local time; set to noon to avoid DST/UTC edge cases
function nextSaturday(from = new Date()) {
  const d = new Date(from);
  const delta = (6 - d.getDay() + 7) % 7; // 0..6 to Saturday
  d.setDate(d.getDate() + delta);
  d.setHours(12, 0, 0, 0);
  return d;
}

/**
 * Fetch leyning for the *upcoming* Shabbat from Hebcal (Diaspora, triennial OFF).
 * Revalidates every 6h so the banner auto-updates weekly.
 */
export async function getUpcomingShabbatLeyning(): Promise<UpcomingShabbat | null> {
  const sat = nextSaturday();
  const start = toLocalISODate(sat);
  const end = start;
  const url = `https://www.hebcal.com/leyning?cfg=json&start=${start}&end=${end}&i=off&triennial=off`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 6 } });
    if (!res.ok) {
      return { shabbatDateISO: start, aliyot: [], _url: url, _status: res.status, _error: 'HTTP not OK' };
    }

    const data = (await res.json()) as { items?: LeyningItem[] };
    const item = (data.items || []).find(it => it.fullkriyah);
    if (!item || !item.fullkriyah) {
      return { shabbatDateISO: start, aliyot: [], _url: url, _status: 204, _error: 'No fullkriyah in response' };
    }

    const aliyahKeys = ['1','2','3','4','5','6','7'];
    const aliyot = aliyahKeys
      .map(n => item.fullkriyah![n])
      .filter(Boolean)
      .map((a, idx) => ({ n: String(idx + 1), k: a.k, b: a.b, e: a.e }));

    const haft = item.haft
      ? {
          k: item.haft.k,
          b: item.haft.b,
          e: item.haft.e,
          label: item.haftara || `${item.haft.k} ${item.haft.b}-${item.haft.e}`,
        }
      : undefined;

    return {
      shabbatDateISO: start,
      shabbatHebrew: item.hdate,
      parashaEn: item.name?.en,
      parashaHe: item.name?.he,
      aliyot,
      haftara: haft,
      _url: url,
      _status: 200,
    };
  } catch (e: any) {
    return { shabbatDateISO: start, aliyot: [], _url: url, _status: 0, _error: e?.message || 'Fetch failed' };
  }
}

/**
 * Fetch leyning for a *specific* ISO date (YYYY-MM-DD).
 * Used by the dedicated Aliyah/Haftarah reader routes.
 */
export async function getLeyningForDate(isoDate: string): Promise<UpcomingShabbat | null> {
  // normalize to YYYY-MM-DD
  const start = isoDate.slice(0, 10);
  const end = start;
  const url = `https://www.hebcal.com/leyning?cfg=json&start=${start}&end=${end}&i=off&triennial=off`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 6 } });
    if (!res.ok) {
      return { shabbatDateISO: start, aliyot: [], _url: url, _status: res.status, _error: 'HTTP not OK' };
    }

    const data = (await res.json()) as { items?: LeyningItem[] };
    const item = (data.items || []).find(it => it.fullkriyah);
    if (!item || !item.fullkriyah) {
      return { shabbatDateISO: start, aliyot: [], _url: url, _status: 204, _error: 'No fullkriyah in response' };
    }

    const aliyahKeys = ['1','2','3','4','5','6','7'];
    const aliyot = aliyahKeys
      .map(n => item.fullkriyah![n])
      .filter(Boolean)
      .map((a, idx) => ({ n: String(idx + 1), k: a.k, b: a.b, e: a.e }));

    const haft = item.haft
      ? {
          k: item.haft.k,
          b: item.haft.b,
          e: item.haft.e,
          label: item.haftara || `${item.haft.k} ${item.haft.b}-${item.haft.e}`,
        }
      : undefined;

    return {
      shabbatDateISO: start,
      shabbatHebrew: item.hdate,
      parashaEn: item.name?.en,
      parashaHe: item.name?.he,
      aliyot,
      haftara: haft,
      _url: url,
      _status: 200,
    };
  } catch (e: any) {
    return { shabbatDateISO: start, aliyot: [], _url: url, _status: 0, _error: e?.message || 'Fetch failed' };
  }
}
