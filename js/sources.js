/* Where passages come from. Selah ships no Bible text: when a day is planned, its passage is
 * fetched from one of these services and saved with that day, so reading is fully offline later.
 *
 * - WEB and KJV: bible-api.com (public domain, no key; about 15 requests per 30 seconds).
 * - ESV: Crossway's official API (free for non-commercial use, needs a key from api.esv.org).
 * - NLT: Tyndale's official API (needs a key from api.nlt.to).
 * - Tagalog: Ang Dating Biblia (1905, public domain) from getBible.net (no key).
 * - Cebuano: Ang Biblia, Bugna version (1917, public domain) — built into the app (data/ceb1917.json), works offline.
 * NIV/old ESV/NLT entries only describe days planned before this change (their text is already saved).
 */
(function () {
  const S = (window.Selah = window.Selah || {});

  const ALL = {
    web: { id: "web", name: "WEB", full: "World English Bible", notice: "World English Bible (WEB), public domain.", fetchable: true },
    kjv: { id: "kjv", name: "KJV", full: "King James Version", notice: "King James Version (KJV), public domain.", fetchable: true },
    esv: {
      id: "esv", name: "ESV", full: "English Standard Version", needsKey: "esvKey", keyUrl: "api.esv.org", fetchable: true,
      notice: "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. esv.org",
    },
    nlt: {
      id: "nlt", name: "NLT", full: "New Living Translation", needsKey: "nltKey", keyUrl: "api.nlt.to", fetchable: true,
      notice: "Holy Bible, New Living Translation, © 1996, 2004, 2015 by Tyndale House Foundation. Used by permission of Tyndale House Publishers. All rights reserved.",
    },
    tag1905: {
      id: "tag1905", name: "TAG", full: "Ang Dating Biblia (1905) — Tagalog", fetchable: true, service: "getbible", lang: "tl",
      notice: "Ang Dating Biblia (1905), Tagalog — public domain. Text from getBible.net.", bookNames: ["Genesis", "Exodo", "Levitico", "Mga Bilang", "Deuteronomio", "Josue", "Mga Hukom", "Ruth", "1 Samuel", "2 Samuel", "1 Mga Hari", "2 Mga Hari", "1 Mga Cronica", "2 Mga Cronica", "Ezra", "Nehemias", "Ester", "Job", "Mga Awit", "Mga Kawikaan", "Mangangaral", "Awit ni Solomon", "Isaias", "Jeremias", "Mga Panaghoy", "Ezekiel", "Daniel", "Oseas", "Joel", "Amos", "Obadias", "Jonas", "Mikas", "Nahum", "Habacuc", "Zefanias", "Hagai", "Zacarias", "Malachias", "Mateo", "Marcos", "Lucas", "Juan", "Mga Gawa", "Mga Romano", "1 Mga Corinto", "2 Mga Corinto", "Mga Taga-Galacia", "Mga Efeso", "Mga Taga-Filipos", "Mga Taga-Colosas", "1 Mga Taga-Tesalonica", "2 Mga Taga-Tesalonica", "1 Timoteo", "2 Timoteo", "Tito", "Filemon", "Mga Hebreo", "Santiago", "1 Pedro", "2 Pedro", "1 Juan", "2 Juan", "3 Juan", "Judas", "Pahayag"],
    },
    ceb1917: {
      id: "ceb1917", name: "CEB", full: "Ang Biblia, Bugna (1917) — Cebuano", builtIn: true, lang: "ceb",
      notice: "Ang Biblia, Bugna version (1917), Cebuano — public domain. Text from the Christian Classics Ethereal Library.", bookNames: ["Genesis", "Exodo", "Levitico", "Numeros", "Deuteronomio", "Josue", "Mga Maghuhukom", "Ruth", "I Samuel", "II Samuel", "I Mga Hari", "II Mga Hari", "I Mga Cronicas", "II Mga Cronicas", "Esdras", "Nehemias", "Ester", "Job", "Mga Salmo", "Mga Proverbio", "Ecclesiastes", "Awit Ni Salomon", "Isaias", "Jeremias", "Lamentaciones", "Ezequiel", "Daniel", "Oseas", "Joel", "Amos", "Abdias", "Jonas", "Miqueas", "Nahum", "Habacuc", "Sofonias", "Haggeo", "Zacarias", "Malaquias", "Mateo", "Marcos", "Lucas", "Juan", "Mga Buhat", "Mga Taga-Roma", "I Mga Taga-Corinto", "II Mga Taga-Corinto", "Mga Taga-Galacia", "Mga Taga-Efeso", "Mga Taga-Filipos", "Mga Taga-Colosas", "I Mga Taga-Tesalonica", "II Mga Taga-Tesalonica", "I Kang Timoteo", "II Kang Timoteo", "Kang Tito", "Kang Filemon", "Sa Mga Hebreohanon", "Jacobo", "I Pedro", "II Pedro", "I Juan", "II Juan", "III Juan", "Judas", "Ang Bugna"],
    },
    niv: { id: "niv", name: "NIV", full: "New International Version", notice: "NIV® © Biblica, Inc.", fetchable: false },
  };

  const info = (id) => ALL[id] || { id, name: id.toUpperCase(), full: id.toUpperCase(), notice: "" };

  // ---------- personal Bible files (only the Mac build has them: text from the owner's own PDFs) ----------
  let localIds = [];
  const localText = {};
  async function init() {
    try {
      const r = await fetch("personal/manifest.json");
      if (r.ok) localIds = (await r.json()).ids || [];
    } catch {
      localIds = [];
    }
  }
  async function localBook(id) {
    if (!localText[id]) localText[id] = (await (await fetch(`personal/${id}.json`)).json()).books;
    return localText[id];
  }

  // ---------- built-in public-domain text (shipped with every edition) ----------
  const builtInText = {};
  async function builtInBook(id) {
    if (!builtInText[id]) builtInText[id] = (await (await fetch(`data/${id}.json`)).json()).books;
    return builtInText[id];
  }

  /** Translations usable now: personal files and built-in ones first (offline), then downloads (ESV/NLT only with a key). */
  function available(settings) {
    const local = localIds.map((id) => Object.assign({}, info(id), { local: true }));
    const builtIn = Object.values(ALL).filter((t) => t.builtIn && !localIds.includes(t.id)).map((t) => Object.assign({}, t, { local: true }));
    const online = Object.values(ALL).filter((t) => t.fetchable && !localIds.includes(t.id) && (!t.needsKey || (settings && settings[t.needsKey])));
    return local.concat(builtIn, online);
  }

  /** Book name in a translation's own language (Tagalog/Cebuano), else English. */
  function bookName(id, b) {
    const t = ALL[id];
    return (t && t.bookNames && t.bookNames[b]) || S.bible.bookName(b);
  }

  // ---------- network (through the native shell when there is one, so no browser limits apply) ----------
  async function http(url, headers = {}) {
    if (S.platform !== "browser") {
      const r = await S.store.raw("http", { url, headers });
      if (!r) throw new Error("offline");
      return r; // { status, text }
    }
    const res = await fetch(url, { headers });
    return { status: res.status, text: await res.text() };
  }

  // keep under each service's rate limit
  const gaps = { "bible-api": 2100, esv: 250, nlt: 250, getbible: 300 };
  const last = {};
  async function paced(service, fn) {
    const wait = (last[service] || 0) + gaps[service] - Date.now();
    last[service] = Date.now() + Math.max(0, wait);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    return fn();
  }

  function friendlyError(e, t) {
    const m = String((e && e.message) || e);
    if (/offline|Failed to fetch|NetworkError|network|timed out|Load failed|not connected|Internet/i.test(m))
      return new Error("You're offline. Connect to the internet to plan a new day — planned days still open offline.");
    if (/401|403|credentials|key/i.test(m)) return new Error(`The ${t.name} key was refused. Check it in Settings.`);
    if (/429/.test(m)) return new Error("The Bible service is busy. Wait a minute and try again.");
    return new Error(`Couldn't get the ${t.name} text (${m}).`);
  }

  /** One request per chapter piece: [{b, c, v1, v2}] */
  function pieces(ranges, shape) {
    const out = [];
    for (const r of ranges)
      for (let c = r.c1; c <= r.c2; c++)
        out.push({ b: r.b, c, v1: c === r.c1 ? r.v1 : 1, v2: c === r.c2 ? r.v2 : shape[r.b][c - 1] });
    return out;
  }

  const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

  async function fetchBibleApi(p, t) {
    const name = S.bible.bookName(p.b);
    const ref = `${name} ${p.c}:${p.v1}${p.v2 > p.v1 ? "-" + p.v2 : ""}`;
    const r = await paced("bible-api", () => http(`https://bible-api.com/${encodeURIComponent(ref)}?translation=${t.id}`));
    if (r.status !== 200) throw new Error(String(r.status));
    const data = JSON.parse(r.text);
    const got = {};
    for (const v of data.verses || []) if (v.chapter === p.c) got[v.verse] = clean(v.text);
    return got;
  }

  // getBible.net: one chapter per request, by book number (Genesis = 1)
  async function fetchGetBible(p, t) {
    const code = { tag1905: "tagalog" }[t.id];
    const r = await paced("getbible", () => http(`https://api.getbible.net/v2/${code}/${p.b + 1}/${p.c}.json`));
    if (r.status !== 200) throw new Error(String(r.status));
    const got = {};
    for (const v of JSON.parse(r.text).verses || []) if (v.chapter === p.c && v.verse >= p.v1 && v.verse <= p.v2) got[v.verse] = clean(v.text);
    return got;
  }

  async function fetchEsv(p, t, key) {
    const ref = `${S.bible.bookName(p.b)} ${p.c}:${p.v1}-${p.v2}`;
    const q = new URLSearchParams({
      q: ref, "include-passage-references": "false", "include-verse-numbers": "true", "include-first-verse-numbers": "true",
      "include-footnotes": "false", "include-footnote-body": "false", "include-headings": "false", "include-short-copyright": "false",
      "include-selahs": "true", "indent-poetry": "false", "indent-paragraphs": "0",
    });
    const r = await paced("esv", () => http(`https://api.esv.org/v3/passage/text/?${q}`, { Authorization: `Token ${key}` }));
    if (r.status !== 200) throw new Error(String(r.status));
    const text = (JSON.parse(r.text).passages || []).join(" ");
    const got = {};
    const parts = text.split(/\[(\d+)\]/); // "", "16", " For God…", "17", " For God did not…"
    for (let i = 1; i < parts.length; i += 2) got[+parts[i]] = clean(parts[i + 1]);
    return got;
  }

  async function fetchNlt(p, t, key) {
    const book = S.bible.bookName(p.b).replace(/\s+/g, "");
    const ref = `${book}.${p.c}:${p.v1}-${p.v2}`;
    const r = await paced("nlt", () => http(`https://api.nlt.to/api/passages?ref=${encodeURIComponent(ref)}&version=NLT&key=${encodeURIComponent(key)}`));
    if (r.status !== 200) throw new Error(String(r.status));
    const doc = new DOMParser().parseFromString(r.text, "text/html");
    const got = {};
    doc.querySelectorAll("verse_export").forEach((ve) => {
      if (+ve.getAttribute("ch") !== p.c) return;
      ve.querySelectorAll(".vn, .tn, .a-tn, h2, h3, .subhead").forEach((n) => n.remove());
      got[+ve.getAttribute("vn")] = clean(ve.textContent);
    });
    return got;
  }

  /** Verses of the ranges in one translation, fetched now: [{b,c,v,t}] ("" if the service has none). */
  async function fetchVerses(ranges, id, settings, onPiece) {
    const t = info(id);
    if (localIds.includes(id) || t.builtIn) {
      // from files on this device (personal or built-in): no internet needed
      const data = localIds.includes(id) ? await localBook(id) : await builtInBook(id);
      const shape = S.bible.books().shape;
      return pieces(ranges, shape).flatMap((p) => {
        const ch = data[p.b][p.c - 1] || [];
        const out = [];
        for (let v = p.v1; v <= p.v2; v++) out.push({ b: p.b, c: p.c, v, t: ch[v - 1] || "" });
        return out;
      });
    }
    if (!t.fetchable) throw new Error(`${t.name} can't be downloaded`);
    const shape = S.bible.books().shape;
    const out = [];
    try {
      for (const p of pieces(ranges, shape)) {
        const got = id === "esv" ? await fetchEsv(p, t, settings.esvKey)
          : id === "nlt" ? await fetchNlt(p, t, settings.nltKey)
          : t.service === "getbible" ? await fetchGetBible(p, t)
          : await fetchBibleApi(p, t);
        for (let v = p.v1; v <= p.v2; v++) out.push({ b: p.b, c: p.c, v, t: got[v] || "" });
        onPiece && onPiece();
      }
    } catch (e) {
      throw friendlyError(e, t);
    }
    if (!out.some((v) => v.t)) throw new Error(`No ${t.name} text came back for that passage.`);
    return out;
  }

  S.sources = { ALL, info, init, available, fetchVerses, http, bookName, get localIds() { return localIds; } };
})();
