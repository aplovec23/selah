/* Bible references and passage text.
 *
 * The full verse data ships with the app but is never browsed: it is only read
 * when a passage is put on the calendar, and the passage's verses are then
 * saved with that day (so a day keeps its text even without the data files).
 */
(function () {
  const S = (window.Selah = window.Selah || {});
  let books = null; // { names, shape } — book names and verse counts only, no Bible text

  async function loadJSON(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error("Could not load " + path);
    return r.json();
  }

  async function init() {
    if (!books) [books] = await Promise.all([loadJSON("data/books.json"), S.sources.init()]);
    return books;
  }


  // ---------- book names ----------
  const ALIASES = {
    gn: "Genesis", ge: "Genesis", gen: "Genesis", ex: "Exodus", exo: "Exodus", exod: "Exodus",
    lv: "Leviticus", lev: "Leviticus", nm: "Numbers", nu: "Numbers", num: "Numbers",
    dt: "Deuteronomy", deut: "Deuteronomy", jos: "Joshua", josh: "Joshua", jdg: "Judges", judg: "Judges",
    rth: "Ruth", ru: "Ruth", "1sa": "1 Samuel", "1sm": "1 Samuel", "2sa": "2 Samuel", "2sm": "2 Samuel",
    "1ki": "1 Kings", "1kgs": "1 Kings", "2ki": "2 Kings", "2kgs": "2 Kings", "1ch": "1 Chronicles",
    "1chr": "1 Chronicles", "2ch": "2 Chronicles", "2chr": "2 Chronicles", ezr: "Ezra", ne: "Nehemiah",
    neh: "Nehemiah", est: "Esther", esth: "Esther", jb: "Job", ps: "Psalms", psa: "Psalms", psalm: "Psalms",
    pss: "Psalms", psm: "Psalms", pr: "Proverbs", prov: "Proverbs", prv: "Proverbs", ec: "Ecclesiastes",
    eccl: "Ecclesiastes", qoh: "Ecclesiastes", so: "Song of Solomon", sos: "Song of Solomon",
    song: "Song of Solomon", songofsongs: "Song of Solomon", sng: "Song of Solomon",
    canticles: "Song of Solomon", is: "Isaiah", isa: "Isaiah", jer: "Jeremiah", je: "Jeremiah",
    lam: "Lamentations", la: "Lamentations", ezk: "Ezekiel", eze: "Ezekiel", ezek: "Ezekiel",
    dn: "Daniel", da: "Daniel", dan: "Daniel", ho: "Hosea", hos: "Hosea", jl: "Joel", joe: "Joel",
    am: "Amos", amo: "Amos", ob: "Obadiah", obad: "Obadiah", jnh: "Jonah", jon: "Jonah", mic: "Micah",
    mi: "Micah", na: "Nahum", nah: "Nahum", hab: "Habakkuk", zep: "Zephaniah", zeph: "Zephaniah",
    hg: "Haggai", hag: "Haggai", zec: "Zechariah", zech: "Zechariah", mal: "Malachi", mt: "Matthew",
    matt: "Matthew", mat: "Matthew", mk: "Mark", mrk: "Mark", mr: "Mark", lk: "Luke", luk: "Luke",
    jn: "John", jhn: "John", joh: "John", ac: "Acts", act: "Acts", ro: "Romans", rom: "Romans",
    rm: "Romans", "1co": "1 Corinthians", "1cor": "1 Corinthians", "2co": "2 Corinthians",
    "2cor": "2 Corinthians", ga: "Galatians", gal: "Galatians", eph: "Ephesians", ephes: "Ephesians",
    php: "Philippians", phil: "Philippians", pp: "Philippians", col: "Colossians",
    "1th": "1 Thessalonians", "1thess": "1 Thessalonians", "2th": "2 Thessalonians",
    "2thess": "2 Thessalonians", "1ti": "1 Timothy", "1tim": "1 Timothy", "2ti": "2 Timothy",
    "2tim": "2 Timothy", ti: "Titus", tit: "Titus", phm: "Philemon", philem: "Philemon", phlm: "Philemon",
    heb: "Hebrews", jas: "James", jm: "James", jam: "James", "1pe": "1 Peter", "1pet": "1 Peter",
    "1pt": "1 Peter", "2pe": "2 Peter", "2pet": "2 Peter", "2pt": "2 Peter", "1jn": "1 John",
    "1jo": "1 John", "1jhn": "1 John", "2jn": "2 John", "2jo": "2 John", "3jn": "3 John", "3jo": "3 John",
    jud: "Jude", jd: "Jude", re: "Revelation", rev: "Revelation", rv: "Revelation",
    revelations: "Revelation",
  };

  const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  function normBookToken(raw) {
    let s = raw.trim().toLowerCase();
    s = s.replace(/^(i{1,3})\s+/, (m, r) => r.length + " "); // "II Kings"
    s = s.replace(/^(first|1st)\s*/, "1").replace(/^(second|2nd)\s*/, "2").replace(/^(third|3rd)\s*/, "3");
    return squash(s);
  }

  function findBook(raw) {
    const tok = normBookToken(raw);
    if (!tok) return -1;
    const names = books.names;
    const exact = names.findIndex((n) => squash(n) === tok);
    if (exact >= 0) return exact;
    if (ALIASES[tok]) return names.indexOf(ALIASES[tok]);
    if (tok.length >= 2) {
      const pre = names.findIndex((n) => squash(n).startsWith(tok));
      if (pre >= 0) return pre;
    }
    return -1;
  }

  /** Parse "John 3:16-21; Ps 23, Rom 8:28" into ranges [{b,c1,v1,c2,v2}] (all 1-based). */
  function parse(input) {
    const ranges = [];
    const errors = [];
    let book = -1;
    const segs = String(input || "").split(";").map((s) => s.trim()).filter(Boolean);
    for (const seg of segs) {
      const m = seg.match(/^((?:[1-3]|i{1,3}|first|second|third|1st|2nd|3rd)?\s*[a-z][a-z .]*?)\s*(\d.*)?$/i);
      let rest = seg;
      if (m && m[1] && /[a-z]/i.test(m[1])) {
        const b = findBook(m[1]);
        if (b < 0) {
          errors.push(`Unknown book "${m[1].trim()}"`);
          continue;
        }
        book = b;
        rest = m[2] || "";
      }
      if (book < 0) {
        errors.push(`Missing book name in "${seg}"`);
        continue;
      }
      const shape = books.shape[book];
      if (!rest.trim()) {
        if (shape.length === 1) ranges.push({ b: book, c1: 1, v1: 1, c2: 1, v2: shape[0] });
        else errors.push(`Add a chapter for ${books.names[book]}`);
        continue;
      }
      let chapter = null;
      for (let part of rest.split(",")) {
        part = part.replace(/\s+/g, "").replace(/[–—]/g, "-");
        if (!part) continue;
        const pm = part.match(/^(\d+)(?::(\d+))?(?:-(\d+)(?::(\d+))?)?$/);
        if (!pm) {
          errors.push(`Can't read "${part}"`);
          continue;
        }
        let [, a, b2, c, d] = pm.map((x) => (x === undefined ? null : +x));
        let r;
        const oneChapter = shape.length === 1;
        if (b2 === null && chapter !== null && !oneChapter && ranges.length && part.indexOf(":") < 0 && rest.indexOf(":") >= 0) {
          // "3:16, 18" -> verse 18 of the same chapter
          r = { c1: chapter, v1: a, c2: chapter, v2: c ?? a };
        } else if (oneChapter && b2 === null) {
          r = { c1: 1, v1: a, c2: 1, v2: c ?? a }; // "Jude 3-4"
        } else if (b2 === null) {
          r = { c1: a, v1: 1, c2: c ?? a, v2: null }; // whole chapters
        } else if (c === null) {
          r = { c1: a, v1: b2, c2: a, v2: b2 };
        } else if (d === null) {
          r = { c1: a, v1: b2, c2: a, v2: c }; // 3:16-21
        } else {
          r = { c1: a, v1: b2, c2: c, v2: d }; // 5:1-7:29
        }
        if (r.c1 < 1 || r.c1 > shape.length || r.c2 < r.c1 || r.c2 > shape.length) {
          errors.push(`${books.names[book]} has ${shape.length} chapter${shape.length > 1 ? "s" : ""}`);
          continue;
        }
        if (r.v2 === null) r.v2 = shape[r.c2 - 1];
        if (r.v1 < 1 || r.v1 > shape[r.c1 - 1] || r.v2 > shape[r.c2 - 1] || (r.c1 === r.c2 && r.v2 < r.v1)) {
          errors.push(`${books.names[book]} ${r.c1 === r.c2 ? r.c1 : r.c1 + "–" + r.c2} doesn't have those verses`);
          continue;
        }
        chapter = r.c2;
        ranges.push(Object.assign({ b: book }, r));
      }
    }
    return { ranges, errors };
  }

  /** Tidy label for ranges, e.g. "John 3:16–21; Psalm 23". */
  function label(ranges) {
    const out = [];
    let lastBook = -1;
    for (const r of ranges) {
      const shape = books.shape[r.b];
      const name = r.b === books.names.indexOf("Psalms") && r.c1 === r.c2 ? "Psalm" : books.names[r.b];
      const whole1 = r.v1 === 1;
      const whole2 = r.v2 === shape[r.c2 - 1];
      let s;
      if (shape.length === 1) s = whole1 && whole2 ? "" : r.v1 === r.v2 ? `${r.v1}` : `${r.v1}–${r.v2}`;
      else if (whole1 && whole2) s = r.c1 === r.c2 ? `${r.c1}` : `${r.c1}–${r.c2}`;
      else if (r.c1 === r.c2) s = r.v1 === r.v2 ? `${r.c1}:${r.v1}` : `${r.c1}:${r.v1}–${r.v2}`;
      else s = `${r.c1}:${r.v1}–${r.c2}:${r.v2}`;
      out.push(r.b === lastBook ? s : (name + (s ? " " + s : "")));
      lastBook = r.b;
    }
    return out.join("; ").replace(/; (\d)/g, ", $1");
  }

  /** Verses of the ranges in one translation, downloaded now: [{b,c,v,t}]. */
  function verses(ranges, id) {
    return S.sources.fetchVerses(ranges, id, (S.app && S.app.settings) || {});
  }

  /**
   * Download the passage in every available translation, to save with the day.
   * Fails only if nothing could be downloaded (e.g. offline); a translation that fails is skipped.
   * onStep(done, total) reports progress.
   */
  async function snapshot(ranges, onStep) {
    const settings = (S.app && S.app.settings) || {};
    const list = S.sources.available(settings);
    const out = {};
    let firstError = null;
    for (let i = 0; i < list.length; i++) {
      try {
        out[list[i].id] = await S.sources.fetchVerses(ranges, list[i].id, settings);
      } catch (e) {
        firstError = firstError || e;
        if (/offline/i.test(e.message)) break;
      }
      onStep && onStep(i + 1, list.length);
    }
    if (!Object.keys(out).length) throw firstError || new Error("Couldn't download that passage");
    return out;
  }

  const verseCount = (ranges) =>
    ranges.reduce((n, r) => {
      let k = 0;
      for (let c = r.c1; c <= r.c2; c++)
        k += (c === r.c2 ? r.v2 : books.shape[r.b][c - 1]) - (c === r.c1 ? r.v1 : 1) + 1;
      return n + k;
    }, 0);

  /** Translation to download a looked-up verse in: the page's, then the main one, then any. */
  function lookupTr(prefer) {
    const ids = S.sources.available((S.app && S.app.settings) || {}).map((t) => t.id);
    for (const id of [prefer, S.app && S.app.settings.tr]) if (id && ids.includes(id)) return id;
    return ids[0];
  }

  /**
   * Look up a short passage typed by the person, e.g. "John 3:16" or "Rom 8:28-30".
   * Uses the day's own saved text when it covers the verses (works offline), else downloads it.
   * Returns { ref, text, tr, verses }.
   */
  async function lookup(input, { entry, tr, max = 30 } = {}) {
    const { ranges, errors } = parse(input);
    if (errors.length || !ranges.length) throw new Error(errors[0] || "Type a verse, e.g. John 3:16");
    if (verseCount(ranges) > max) throw new Error(`Pick a shorter passage (up to ${max} verses)`);
    const ref = label(ranges);
    const want = [];
    for (const r of ranges)
      for (let c = r.c1; c <= r.c2; c++)
        for (let v = c === r.c1 ? r.v1 : 1; v <= (c === r.c2 ? r.v2 : books.shape[r.b][c - 1]); v++) want.push({ b: r.b, c, v });
    // the day's own saved translations first (offline)
    const saved = entry && entry.verses ? [tr, entry.tr, ...Object.keys(entry.verses)].filter((id, i, a) => id && a.indexOf(id) === i && entry.verses[id]) : [];
    for (const id of saved) {
      const vs = entry.verses[id];
      const got = want.map((w) => vs.find((x) => x.b === w.b && x.c === w.c && x.v === w.v && x.t));
      if (got.every(Boolean)) return { ref, tr: id, verses: got, text: got.map((v) => v.t).join(" ") };
    }
    const id = lookupTr(tr || (entry && entry.tr));
    if (!id) throw new Error("No translation can be downloaded");
    const vs = (await verses(ranges, id)).filter((v) => v.t);
    if (!vs.length) throw new Error("That verse didn't come back. Try again.");
    return { ref, tr: id, verses: vs, text: vs.map((v) => v.t).join(" ") };
  }

  S.bible = {
    lookup,
    /** Translations that can be downloaded right now. */
    get TRANSLATIONS() { return S.sources.available((S.app && S.app.settings) || {}); },
    /** Name/notice for any translation id, including ones only found in older saved days. */
    trInfo: (id) => S.sources.info(id),
    init,
    parse,
    label,
    verses,
    snapshot,
    verseCount,
    bookName: (b) => books.names[b],
    books: () => books,
    MAX_VERSES: 400,
  };
})();
