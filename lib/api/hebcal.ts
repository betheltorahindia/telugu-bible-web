// lib/api/hebcal.ts
// Server-safe helpers to fetch Parasha/Haftarah from Hebcal Leyning API
// (Diaspora; triennial OFF)

export type Aliyah = { k: string; b: string; e: string; v?: number; p?: number };
export type LeyningItem = {
  date: string;
  hdate?: string;
  name?: { en?: string; he?: string };
  summary?: string;
  fullkriyah?: Record<string, Aliyah>;
  haft?: { k: string; b: string; e: string; v?: number } | Array<{ k: string; b: string; e: string; v?: number }>;
  haftara?: string;
  seph?: { k: string; b: string; e: string; v?: number };
  sephardic?: string;
  sephardicNumV?: number;
  reason?: Record<string, string>;
};

type HaftaraSegment = { k: string; b: string; e: string; label: string };

export type UpcomingShabbat = {
  shabbatDateISO: string;
  shabbatHebrew?: string;
  parashaEn?: string;
  parashaHe?: string;
  aliyot: { n: string; k: string; b: string; e: string }[];
  haftara?: HaftaraSegment;
  haftaraSegments?: HaftaraSegment[];
  maftir?: { k: string; b: string; e: string; label: string };
  // debug fields for surfacing issues
  _url?: string;
  _status?: number;
  _error?: string;
};

// NEW: unified weekly item (festival or shabbat) for the teaser
export type WeeklyItem = {
  kind: 'festival' | 'shabbat';
  isoDate: string;                 // YYYY-MM-DD
  hebDate?: string;
  titleEn?: string;
  titleHe?: string;
  aliyot: { n: string; k: string; b: string; e: string }[]; // 1..7
  haftara?: HaftaraSegment;
  haftaraSegments?: HaftaraSegment[];
  maftir?: { k: string; b: string; e: string; label: string };
};

// ---------------- date helpers ----------------
function toLocalISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// Find this coming Saturday (Shabbat) in local time; set to noon to avoid DST/UTC edge cases
function nextSaturday(from = new Date()) {
  const d = new Date(from);
  const delta = (6 - d.getDay() + 7) % 7; // 0..6 to Saturday
  d.setDate(d.getDate() + delta);
  d.setHours(12, 0, 0, 0);
  return d;
}

// --------------- mappers ---------------
function normalizeHaftSegments(haft: LeyningItem['haft'], fallbackLabel?: string, item?: LeyningItem): HaftaraSegment[] {
  if (!haft) return [];

  // First try to get Sephardic reading from the root level
  if (item?.seph && item.seph.k && item.seph.b && item.seph.e) {
    return [{
      k: item.seph.k,
      b: item.seph.b,
      e: item.seph.e,
      label: item.sephardic || `${item.seph.k} ${item.seph.b}-${item.seph.e}`,
    }];
  }
  
  // Fallback to regular haft if no Sephardic reading
  const entries = Array.isArray(haft) ? haft : [haft];
  const segments: HaftaraSegment[] = [];
  entries.forEach((entry, idx) => {
    if (!entry || !entry.k || !entry.b || !entry.e) return;
    segments.push({
      k: entry.k,
      b: entry.b,
      e: entry.e,
      label: idx === 0 && fallbackLabel ? fallbackLabel : `${entry.k} ${entry.b}-${entry.e}`,
    });
  });
  return segments;
}

function normalizeHaft(haft: LeyningItem['haft'], fallbackLabel?: string): HaftaraSegment | undefined {
  return normalizeHaftSegments(haft, fallbackLabel)[0];
}

function mapItemToWeekly(it: LeyningItem, kind: 'festival'|'shabbat'): WeeklyItem | null {
  if (!it.fullkriyah) return null;

  const aliyahKeys = ['1','2','3','4','5','6','7'];
  const aliyot = aliyahKeys
    .map((n) => it.fullkriyah![n])
    .filter(Boolean)
    .map((a, idx) => ({ n: String(idx + 1), k: a.k, b: a.b, e: a.e }));

  if (aliyot.length === 0) return null;

  const haftaraSegments = normalizeHaftSegments(it.haft, it.haftara, it);
  const haftara = haftaraSegments[0];

  const maftirAliyah = it.fullkriyah?.M || it.fullkriyah?.maftir || it.fullkriyah?.maf;
  const maftir = maftirAliyah
    ? {
        k: maftirAliyah.k,
        b: maftirAliyah.b,
        e: maftirAliyah.e,
        label: it.reason?.M
          ? `${maftirAliyah.k} ${maftirAliyah.b}-${maftirAliyah.e} (${it.reason.M})`
          : `${maftirAliyah.k} ${maftirAliyah.b}-${maftirAliyah.e}`,
      }
    : undefined;

  return {
    kind,
    isoDate: it.date,
    hebDate: it.hdate,
    titleEn: it.name?.en,
    titleHe: it.name?.he,
    aliyot,
    haftara,
    haftaraSegments,
    maftir,
  };
}

// Heuristic list of parasha names to distinguish shabbat vs. festival
const PARASHA_NAMES = new Set([
  'Bereshit','Noach','Lech-Lecha','Vayera','Chayei Sara','Toldot','Vayetzei','Vayishlach','Vayeshev',
  'Miketz','Vayigash','Vayechi','Shemot','Vaera','Bo','Beshalach','Yitro','Mishpatim','Terumah','Tetzaveh',
  'Ki Tisa','Vayakhel','Pekudei','Vayikra','Tzav','Shemini','Tazria','Metzora','Achrei Mot','Kedoshim',
  'Emor','Behar','Bechukotai','Bamidbar','Nasso','Beha\'alotcha','Sh\'lach','Korach','Chukat','Balak',
  'Pinchas','Matot','Masei','Devarim','Vaetchanan','Eikev','Re\'eh','Shoftim','Ki Teitzei','Ki Tavo',
  'Nitzavim','Vayeilech','Ha\'Azinu','V\'Zot HaBerachah'
].map((s) => s.toLowerCase()));

// --------------- public API ---------------

/**
 * Fetch leyning for the *upcoming* Shabbat from Hebcal (Diaspora, triennial OFF).
 * Revalidates every 6h so the banner auto-updates weekly.
 */
export async function getUpcomingShabbatLeyning(): Promise<UpcomingShabbat | null> {
  const sat = nextSaturday();
  const start = toLocalISODate(sat);
  const url = `https://www.hebcal.com/leyning?cfg=json&start=${start}&end=${start}&i=off&triennial=off&custom=seph`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 6 } } as NextFetchOptions);
    if (!res.ok) {
      return { shabbatDateISO: start, aliyot: [], _url: url, _status: res.status, _error: 'HTTP not OK' };
    }

    const data = (await res.json()) as { items?: LeyningItem[] };
    const item = (data.items || [])
      .filter((it) => !(it.name?.en || '').toLowerCase().includes('(mincha)'))
      .find((it) => it.fullkriyah);
    if (!item || !item.fullkriyah) {
      return { shabbatDateISO: start, aliyot: [], _url: url, _status: 204, _error: 'No fullkriyah in response' };
    }

    const mapped = mapItemToWeekly(item, 'shabbat');
    if (!mapped) return null;

    return {
      shabbatDateISO: mapped.isoDate,
      shabbatHebrew: mapped.hebDate,
      parashaEn: mapped.titleEn,
      parashaHe: mapped.titleHe,
      aliyot: mapped.aliyot,
      haftara: mapped.haftara,
      haftaraSegments: mapped.haftaraSegments,
      maftir: mapped.maftir,
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
  const start = isoDate.slice(0, 10);
  const url = `https://www.hebcal.com/leyning?cfg=json&start=${start}&end=${start}&i=off&triennial=off&custom=seph`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 6 } } as NextFetchOptions);
    if (!res.ok) {
      return { shabbatDateISO: start, aliyot: [], _url: url, _status: res.status, _error: 'HTTP not OK' };
    }

    const data = (await res.json()) as { items?: LeyningItem[] };
    const item = (data.items || []).find((it) => it.fullkriyah);
    if (!item || !item.fullkriyah) {
      return { shabbatDateISO: start, aliyot: [], _url: url, _status: 204, _error: 'No fullkriyah in response' };
    }

    const aliyahKeys = ['1','2','3','4','5','6','7'];
    const aliyot = aliyahKeys
      .map((n) => item.fullkriyah![n])
      .filter(Boolean)
      .map((a, idx) => ({ n: String(idx + 1), k: a.k, b: a.b, e: a.e }));

    const haftaraSegments = normalizeHaftSegments(item.haft, item.haftara, item);
    const haft = haftaraSegments[0];

    const maftirAliyah = item.fullkriyah?.M || item.fullkriyah?.maftir || item.fullkriyah?.maf;
    const maftir = maftirAliyah
      ? {
          k: maftirAliyah.k,
          b: maftirAliyah.b,
          e: maftirAliyah.e,
          label: item.reason?.M
            ? `${maftirAliyah.k} ${maftirAliyah.b}-${maftirAliyah.e} (${item.reason.M})`
            : `${maftirAliyah.k} ${maftirAliyah.b}-${maftirAliyah.e}`,
        }
      : undefined;

    return {
      shabbatDateISO: start,
      shabbatHebrew: item.hdate,
      parashaEn: item.name?.en,
      parashaHe: item.name?.he,
      aliyot,
      haftara: haft,
      haftaraSegments,
      maftir,
      _url: url,
      _status: 200,
    };
  } catch (e: any) {
    return { shabbatDateISO: start, aliyot: [], _url: url, _status: 0, _error: e?.message || 'Fetch failed' };
  }
}

// Next.js fetch options type
type NextFetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false
    tags?: string[]
  }
}

/**
 * NEW: Fetch all leyning items in the next 7 days (festivals + shabbat).
 * Use this to show multiple cards on Home (e.g., a festival midweek and Shabbat after).
 */
export async function getWeeklyLeyning(): Promise<WeeklyItem[]> {
  try {
    const today = new Date();
    const start = toLocalISODate(today);
    const end = toLocalISODate(addDays(today, 7));
    const url = `https://www.hebcal.com/leyning?cfg=json&start=${start}&end=${end}&i=off&triennial=off&custom=seph`;

    const res = await fetch(url, { next: { revalidate: 60 * 60 * 6 } } as NextFetchOptions);
    if (!res.ok) return [];

    const data = (await res.json()) as { items?: LeyningItem[] };
    const items = (data.items || [])
      .filter((it) => !(it.name?.en || '').toLowerCase().includes('(mincha)'))
      .filter((it) => it.fullkriyah);

    const out = items
      .map((it) => {
        const en = (it.name?.en || '').toLowerCase().trim();
        const kind: 'festival' | 'shabbat' = PARASHA_NAMES.has(en) ? 'shabbat' : 'festival';
        return mapItemToWeekly(it, kind);
      })
      .filter(Boolean) as WeeklyItem[];

    // Sort by date; if same date, festival first
    out.sort((a, b) => {
      if (a.isoDate !== b.isoDate) return a.isoDate < b.isoDate ? -1 : 1;
      if (a.kind === b.kind) return 0;
      return a.kind === 'festival' ? -1 : 1;
    });

    return out;
  } catch {
    return [];
  }
}
