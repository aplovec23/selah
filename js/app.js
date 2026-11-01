/* App start-up, data, routing, plan & settings dialogs, export/import, widget feed. */
(function () {
  const S = window.Selah;
  const { el, ui } = { el: S.ui.el, ui: S.ui };
  const T = () => S.bible.TRANSLATIONS; // downloadable now (depends on Settings keys)
  const trName = (id) => S.bible.trInfo(id).name;

  // ---------- data ----------
  const DEFAULTS = { guide: true, tr: "web", bg: "cream", theme: "auto", font: "serif", startWeek: 0, pen: "#2e2a25" };
  let settings = { ...DEFAULTS };
  let index = {}; // entry id -> { ref, kind, title, done, vod: { web: {r,t}, ... } }

  // ---------- entry ids: a day can hold several entries ----------
  // The first entry of a day is keyed by its date ("2026-11-01"); more are "2026-11-01_2", "_3", …
  const dateOf = (id) => String(id || "").slice(0, 10);
  const entryNo = (id) => +(String(id).split("_")[1] || 1);
  const byId = (a, b) => (dateOf(a) < dateOf(b) ? -1 : dateOf(a) > dateOf(b) ? 1 : entryNo(a) - entryNo(b));
  const sortIds = (ids) => ids.slice().sort(byId);
  const idsFor = (date) => sortIds(Object.keys(index).filter((k) => dateOf(k) === date));
  function nextId(date) {
    if (!index[date]) return date;
    let n = 2;
    while (index[`${date}_${n}`]) n++;
    return `${date}_${n}`;
  }
  /** Short label for an entry (calendar, lists). */
  const labelOf = (s) => (s && s.ref) || (s && s.kind === "notes" ? "📝 " + (s.title || "Notes") : "✎ Journal");

  async function loadSettings() {
    settings = Object.assign({ ...DEFAULTS }, (await S.store.get("settings")) || {});
    applyTheme();
  }
  async function saveSettings(patch) {
    Object.assign(settings, patch);
    await S.store.set("settings", settings);
    applyTheme();
    pushWidget();
  }
  function applyTheme() {
    if (settings.theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", settings.theme);
  }

  /** The person's favorite verse of the day: one looked up and starred, or a starred verse in the passage. */
  function favorite(entry) {
    if (entry.fav && entry.fav.t) return entry.fav;
    if (!entry.key) return null;
    const ids = [entry.tr, ...Object.keys(entry.verses || {})];
    for (const id of ids) {
      const v = id && (entry.verses[id] || []).find((x) => x.b === entry.key.b && x.c === entry.key.c && x.v === entry.key.v && x.t);
      if (v) return { r: `${S.bible.bookName(v.b).replace(/^Psalms$/, "Psalm")} ${v.c}:${v.v}`, t: v.t, tr: id };
    }
    return null;
  }

  /** The verse shown in widgets and on the calendar: the favorite verse if one is starred, else the first verse. */
  function verseOfDay(entry) {
    const out = {};
    if (entry.fav && entry.fav.t) return { [entry.fav.tr || "web"]: { r: entry.fav.r, t: entry.fav.t } };
    for (const id of Object.keys(entry.verses || {})) {
      const t = { id };
      const vs = entry.verses[t.id] || [];
      let i = entry.key ? vs.findIndex((v) => v.b === entry.key.b && v.c === entry.key.c && v.v === entry.key.v) : -1;
      if (i < 0) i = vs.findIndex((v) => v.t);
      if (i < 0) continue;
      let pick = [vs[i]];
      if (!entry.key && vs[i].t.length < 70 && vs[i + 1] && vs[i + 1].t) pick.push(vs[i + 1]); // very short first verse: add the next
      const first = pick[0], last = pick[pick.length - 1];
      const name = S.bible.bookName(first.b).replace(/^Psalms$/, "Psalm");
      out[t.id] = {
        r: `${name} ${first.c}:${first.v}${last.v !== first.v ? "–" + last.v : ""}`,
        t: pick.map((v) => v.t).join(" "),
      };
    }
    return out;
  }

  function summary(entry) {
    const s = entry.sections || {};
    const wrote = Object.values(s).some((h) => (h || "").replace(/<[^>]+>/g, "").trim()) || (entry.strokes || []).length > 0;
    return { ref: entry.ref, kind: entry.kind || null, title: entry.title || "", done: wrote, vod: verseOfDay(entry) };
  }

  async function loadIndex() {
    index = (await S.store.get("index")) || {};
  }

  async function getDay(id) {
    const e = await S.store.get("day/" + id);
    if (e && !e.id) e.id = e.date; // saved before a day could hold several entries
    return e;
  }

  async function saveDay(entry, { quiet } = {}) {
    entry.updated = Date.now();
    entry.id = entry.id || entry.date;
    await S.store.set("day/" + entry.id, entry);
    index[entry.id] = summary(entry);
    await S.store.set("index", index);
    if (!quiet) pushWidget();
  }

  async function removeDay(id) {
    const e = await getDay(id);
    for (const it of (e && e.items) || []) if (it.kind === "photo") await S.store.del("photo/" + it.ref);
    await S.store.del("day/" + id);
    delete index[id];
    await S.store.set("index", index);
    pushWidget();
  }

  /** Put a passage on a date (keeps the reflection if the day already exists). */
  /** Put a passage on a date: downloads it in every available translation and saves it with the day. */
  async function planDay(id, input, { keepKey, onStep, pasted, guide } = {}) {
    const date = dateOf(id);
    const { ranges, errors } = S.bible.parse(input);
    if (errors.length || !ranges.length) throw new Error(errors[0] || "Type a passage, e.g. John 3:16–21");
    if (S.bible.verseCount(ranges) > S.bible.MAX_VERSES) throw new Error(`That's more than ${S.bible.MAX_VERSES} verses — try a shorter passage`);
    const old = await getDay(id);
    const entry = old || {
      id, date, sections: { e: "", l: "", a: "", h: "" }, strokes: [], items: [], hl: {},
      bg: settings.bg, width: window.innerWidth < 600 ? 440 : 720, tr: settings.tr, guide: settings.guide !== false,
    };
    let verses;
    if (pasted) {
      // the person's own copy of the passage: no download, works offline
      const id = pasteId(pasted.name);
      verses = { [id]: splitPasted(pasted.text, ranges) };
      entry.pasted = Object.assign(entry.pasted || {}, { [id]: true });
      if (old && old.ref === S.bible.label(ranges)) verses = Object.assign({}, old.verses, verses); // keep other translations of the same passage
      entry.tr = id;
    } else {
      verses = await S.bible.snapshot(ranges, onStep); // needs internet; throws a friendly message if offline
    }
    const changed = !old || old.ref !== S.bible.label(ranges);
    entry.ranges = ranges;
    entry.ref = S.bible.label(ranges);
    entry.verses = verses;
    if (guide !== undefined) entry.guide = !!guide;
    if (!entry.verses[entry.tr]) entry.tr = entry.verses[settings.tr] ? settings.tr : Object.keys(entry.verses)[0];
    if (changed) {
      entry.hl = {};
      if (!keepKey) entry.key = null;
    }
    if (entry.kind === "notes") entry.kind = null; // a notes page that now has a passage
    await saveDay(entry);
    return entry;
  }

  /** An entry for free writing only: no passage, guide off. With notes: a titled page of notes. */
  async function journalDay(id, { notes } = {}) {
    let entry = await getDay(id);
    if (!entry) {
      entry = {
        id, date: dateOf(id), ranges: [], verses: {}, ref: "", tr: null, guide: false, kind: notes ? "notes" : null, title: "",
        sections: { e: "", l: "", a: "", h: "", j: "" }, strokes: [], items: [], hl: {},
        bg: settings.bg, width: window.innerWidth < 600 ? 440 : 720,
      };
      await saveDay(entry);
    }
    return entry;
  }

  const pasteId = (name) => (String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "") || "mine").slice(0, 12);

  /**
   * Turn pasted scripture into verses. If it has verse numbers ("16 For God… 17 For…"), each number
   * starts the next expected verse; otherwise the whole text is kept as one block on the first verse.
   */
  function splitPasted(text, ranges) {
    const shape = S.bible.books().shape;
    const expect = [];
    for (const r of ranges)
      for (let c = r.c1; c <= r.c2; c++)
        for (let v = c === r.c1 ? r.v1 : 1; v <= (c === r.c2 ? r.v2 : shape[r.b][c - 1]); v++) expect.push({ b: r.b, c, v, t: "" });
    let clean = String(text || "").replace(/\r/g, "");
    // copied from a Bible website: drop the trailing footnotes / cross references / links
    clean = clean.split(/\n\s*(?:Footnotes|Cross references|Read full chapter|Copyright ©|New International Version \(NIV\)|Scripture quotations)/i)[0];
    // …and a leading reference line like "John 3:16-18 New International Version"
    clean = clean.replace(/^\s*[1-3]?\s?[A-Za-z][A-Za-z .]+\s\d+(:\d+)?([-–]\d+(:\d+)?)?[^\n]*\n/, "");
    clean = clean.replace(/\[[a-z]{1,2}\]|\([A-Z]{1,2}\)/g, "").trim(); // footnote / cross-reference letters
    let i = -1, buf = "";
    const tokens = clean.split(/(\d{1,3}:\d{1,3}|(?<!\d)\d{1,3}(?!\d))/);
    for (const tok of tokens) {
      const m = tok.match(/^(?:(\d{1,3}):)?(\d{1,3})$/);
      if (m) {
        const n = +m[2];
        // a number counts as a verse marker only if it is the next (or a near) expected verse
        // …or the chapter number standing in for verse 1 (how many sites print a chapter's start)
        const j = expect.findIndex((e, k) => k > i && k <= i + 3 && ((e.v === n && (!m[1] || e.c === +m[1])) || (e.v === 1 && e.c === n && !m[1])));
        if (j >= 0) {
          if (i >= 0) expect[i].t = buf.replace(/\s+/g, " ").trim();
          else if (buf.trim()) expect[0].t = buf.replace(/\s+/g, " ").trim() + " ";
          i = j;
          buf = "";
          continue;
        }
      }
      buf += tok;
    }
    if (i >= 0) expect[i].t = buf.replace(/\s+/g, " ").trim();
    else expect[0].t = clean.replace(/\s+/g, " "); // no verse numbers: one block
    return expect;
  }

  // ---------- widget feed ----------
  const pushWidget = ui.debounce(async () => {
    const start = ui.today();
    const days = [];
    for (let i = -1; i <= 60; i++) {
      const d = ui.addDays(start, i);
      const s = idsFor(d).map((k) => index[k]).find((x) => x && x.vod && Object.keys(x.vod).length);
      if (!s) continue;
      const id = s.vod[settings.tr] ? settings.tr : Object.keys(s.vod)[0];
      const v = id && s.vod[id];
      if (v) days.push({ date: d, passage: s.ref, ref: v.r, text: v.t, tr: trName(id) });
    }
    try {
      await S.store.setWidget({ updated: new Date().toISOString(), days });
    } catch (e) {
      console.warn("widget", e);
    }
  }, 400);

  // ---------- routing ----------
  let current = null;
  async function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [view, rawArg] = h.split("/");
    const arg = rawArg && rawArg.split("?")[0];
    if (current && current.leave) await current.leave();
    S.ui.closePop();
    const host = document.getElementById("view");
    host.innerHTML = "";
    host.scrollTop = 0;
    if (view === "day" && arg) current = await S.day.show(host, decodeURIComponent(arg));
    else current = await S.calendar.show(host, arg);
  }
  const go = (hash) => {
    if (location.hash === hash) route();
    else location.hash = hash;
  };

  // ---------- plan dialog ----------
  /** Save what the open page has typed before something else changes the same entry. */
  async function flushPage() {
    if (current && current.flush) await current.flush();
  }

  /** Where a new entry on date d goes: the id it was opened for, the date itself, or a further entry. */
  function newIdFor(d, wanted) {
    if (wanted && dateOf(wanted) === d && !index[wanted]) return wanted;
    return nextId(d);
  }

  function planDialog(dateOrId, existing, { paste = false, id: wantId } = {}) {
    const date = dateOrId && dateOf(dateOrId);
    ui.dialog((box, close) => {
      let pasteMode = paste;
      const pasteBox = el("textarea.input", { rows: 7, placeholder: "Paste the passage here. Verse numbers (16 For God so loved… 17 For God did not…) are optional but let you highlight verse by verse." });
      const pasteName = el("input.input", { value: "NIV", placeholder: "e.g. NIV", maxlength: 12, style: { maxWidth: "140px" } });
      const pasteArea = el("div", { hidden: !pasteMode },
        el("div.row", {}, el("label.field", { style: { flex: "0 0 auto" } }, el("span", {}, "Translation label"), pasteName)),
        el("label.field", {}, el("span", {}, "Passage text"), pasteBox));
      const modeBtn = el("button.btn.ghost", { type: "button", onclick: () => setMode(!pasteMode) });
      const sub = el("p.sub");
      const guideSw = ui.toggle("S.E.L.A.H. guide", existing ? existing.guide !== false : settings.guide !== false, null, "Off: keep the passage but write your reflection freely in one open area");
      function setMode(v) {
        pasteMode = v;
        pasteArea.hidden = !v;
        prev.hidden = v;
        segField.hidden = v;
        modeBtn.textContent = v ? "Download it instead" : "Paste it yourself";
        sub.textContent = v
          ? "Type the reference, then paste the passage from your Bible app or a website (e.g. BibleGateway). No internet needed."
          : "Pick a day and type the passage. It's downloaded now and saved on this device, so the day opens offline.";
        if (v) setTimeout(() => pasteBox.focus(), 30);
      }
      const dateIn = el("input.input", { type: "date", value: date || ui.today() });
      const refIn = el("input.input", { placeholder: "e.g. John 3:16–21, Psalm 23, Romans 8", value: existing ? existing.ref : "", autofocus: true, autocomplete: "off", spellcheck: "false" });
      const prev = el("div.preview", {}, el("span.muted", {}, "The passage will appear here."));
      const list = T();
      let tr = list.some((t) => t.id === settings.tr) ? settings.tr : list[0].id;
      let ask = 0; // ignore previews that arrive after newer typing
      const seg = el("div.seg", {}, list.map((t) => el("button", { class: t.id === tr ? "on" : "", onclick: (e) => { tr = t.id; [...seg.children].forEach((b) => b.classList.toggle("on", b === e.currentTarget)); update(); } }, t.name)));
      const save = el("button.btn.primary", { onclick: submit }, existing ? "Update passage" : "Save to calendar");
      const segField = el("div.field", {}, el("span", {}, "Preview in"), seg);
      const update = ui.debounce(async () => {
        const v = refIn.value.trim();
        if (!v) return prev.replaceChildren(el("span.muted", {}, "The passage will appear here."));
        const { ranges, errors } = S.bible.parse(v);
        if (errors.length || !ranges.length) return prev.replaceChildren(el("span.err", {}, errors[0] || "Keep typing…"));
        const n = S.bible.verseCount(ranges);
        if (n > S.bible.MAX_VERSES) return prev.replaceChildren(el("span.err", {}, `${n} verses — that's a lot for one day (max ${S.bible.MAX_VERSES}).`));
        const mine = ++ask;
        prev.replaceChildren(el("span.ok", {}, `✓ ${S.bible.label(ranges)} · ${n} verse${n > 1 ? "s" : ""}`), el("span.muted", {}, "Getting the text…"));
        let vs;
        try {
          vs = await S.bible.verses(ranges.slice(0, 1).map((r) => ({ ...r, c2: r.c1, v2: r.c1 === r.c2 ? Math.min(r.v2, r.v1 + 7) : Math.min(S.bible.books().shape[r.b][r.c1 - 1], r.v1 + 7) })), tr);
        } catch (e) {
          if (mine === ask) prev.replaceChildren(el("span.ok", {}, `✓ ${S.bible.label(ranges)} · ${n} verse${n > 1 ? "s" : ""}`), el("span.err", {}, e.message));
          return;
        }
        if (mine !== ask) return;
        prev.replaceChildren(
          el("span.ok", {}, `✓ ${S.bible.label(ranges)} · ${n} verse${n > 1 ? "s" : ""}`),
          ...vs.slice(0, 8).map((x) => el("span", {}, el("sup", {}, x.v), " ", x.t || "—", " ")),
          n > 8 ? el("span.muted", {}, "…") : null
        );
      }, 600);
      refIn.addEventListener("input", update);
      refIn.addEventListener("keydown", (e) => e.key === "Enter" && submit());
      async function submit() {
        save.disabled = true;
        try {
          const d = dateIn.value;
          if (!d) throw new Error("Pick a date");
          let id;
          if (existing && dateOf(existing.id || existing.date) === d) id = existing.id || existing.date; // change this entry's passage
          else {
            id = newIdFor(d, wantId);
            const others = idsFor(d);
            if (others.length && id !== wantId && !(await ui.confirmBox("Add another entry?",
              `${ui.longDate(d)} already has ${others.map((k) => labelOf(index[k])).join(", ")}. This adds a new entry for the same day; ${others.length > 1 ? "the others stay" : "it stays"} as ${others.length > 1 ? "they are" : "it is"}.`, "Add entry"))) {
              save.disabled = false;
              return;
            }
          }
          if (pasteMode && !pasteBox.value.trim()) throw new Error("Paste the passage text first");
          await flushPage(); // the open page's last typing first, so it can't overwrite the new passage
          if (pasteMode) {
            await planDay(id, refIn.value, { pasted: { name: pasteName.value, text: pasteBox.value }, guide: guideSw.get() });
          } else {
            prev.replaceChildren(el("span.muted", {}, "Downloading the passage for offline reading…"));
            await planDay(id, refIn.value, { guide: guideSw.get(), onStep: (k, total) => prev.replaceChildren(el("span.muted", {}, `Downloading… ${k} of ${total} translations`)) });
          }
          close();
          ui.toast(`Saved for ${ui.shortDate(d)}`);
          go("#/day/" + id);
        } catch (err) {
          prev.hidden = false;
          prev.replaceChildren(el("span.err", {}, err.message));
          save.disabled = false;
        }
      }
      box.append(
        el("h2", {}, existing ? "Change passage" : "Plan a reading"),
        sub,
        el("div.row", {}, el("label.field", {}, el("span", {}, "Date"), dateIn), segField),
        el("label.field", {}, el("span", {}, "Passage"), refIn),
        prev,
        pasteArea,
        el("div.row", { style: { marginTop: "8px", alignItems: "center", justifyContent: "space-between" } }, modeBtn, guideSw),
        el("div.actions", {},
          el("button.btn", { onclick: () => { close(); bulkDialog(); } }, "Plan many days…"),
          existing ? null : el("button.btn", { title: "A page for free writing, with no passage", onclick: async () => { const d = dateIn.value || ui.today(); const id = newIdFor(d, wantId); await journalDay(id); close(); go("#/day/" + id); } }, "✎ Just journal"),
          existing ? null : el("button.btn", { title: "A titled page of notes only (sermon, study…), with no passage", onclick: async () => { const d = dateIn.value || ui.today(); const id = newIdFor(d, wantId); await journalDay(id, { notes: true }); close(); go("#/day/" + id); } }, "📝 Notes only"),
          el("span.spacer"), el("button.btn", { onclick: close }, "Cancel"), save)
      );
      setMode(pasteMode);
      if (existing && !pasteMode) update();
    });
  }

  /** Fill several days by reading straight through a book. */
  function bulkDialog() {
    ui.dialog((box, close) => {
      const names = S.bible.books().names;
      const book = el("select.input", {}, names.map((n, i) => el("option", { value: i }, n)));
      const from = el("input.input", { type: "number", min: 1, value: 1 });
      const per = el("input.input", { type: "number", min: 1, max: 10, value: 1 });
      const start = el("input.input", { type: "date", value: ui.today() });
      const note = el("p.muted", {});
      const upd = () => {
        const b = +book.value, n = S.bible.books().shape[b].length;
        from.max = n;
        const left = n - Math.max(1, +from.value || 1) + 1;
        const days = Math.ceil(left / Math.max(1, +per.value || 1));
        note.textContent = `${names[b]} has ${n} chapters → ${days} day${days > 1 ? "s" : ""}, ending ${ui.shortDate(ui.addDays(start.value || ui.today(), days - 1))}. Days that already have a passage are skipped.`;
      };
      [book, from, per, start].forEach((x) => x.addEventListener("input", upd));
      upd();
      const bar = el("div.progress", { hidden: true }, el("div.fill"));
      let stop = false;
      const go2 = el("button.btn.primary", {
        onclick: async () => {
          go2.disabled = true;
          [book, from, per, start].forEach((x) => (x.disabled = true));
          const b = +book.value, n = S.bible.books().shape[b].length, step = Math.max(1, +per.value || 1);
          let d = start.value || ui.today(), made = 0, skipped = 0;
          const first = Math.max(1, +from.value || 1);
          const totalDays = Math.ceil((n - first + 1) / step);
          bar.hidden = false;
          let error = null;
          for (let c = first, k = 0; c <= n && !stop; c += step, k++) {
            const c2 = Math.min(n, c + step - 1);
            note.textContent = `Downloading day ${k + 1} of ${totalDays} (${names[b]} ${c}${c2 > c ? "–" + c2 : ""})… Keep Selah open.`;
            bar.firstChild.style.width = Math.round((k / totalDays) * 100) + "%";
            if (idsFor(d).length) skipped++;
            else {
              try {
                await planDay(d, `${names[b]} ${c}${c2 > c ? "-" + c2 : ""}`);
                made++;
              } catch (e) {
                error = e;
                break;
              }
            }
            d = ui.addDays(d, 1);
          }
          close();
          const msg = `Planned ${made} day${made === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}`;
          ui.toast(error ? `${msg}. Stopped: ${error.message}` : stop ? `${msg} (stopped)` : msg, error ? 6000 : 2500);
          go("#/cal/" + (start.value || ui.today()).slice(0, 7));
        },
      }, "Download & fill calendar");
      box.append(
        el("h2", {}, "Plan many days"),
        el("p.sub", {}, "Read through a book a few chapters at a time, one day after another. Every day's passage is downloaded now, so the whole plan works offline."),
        el("label.field", {}, el("span", {}, "Book"), book),
        el("div.row", {}, el("label.field", {}, el("span", {}, "From chapter"), from), el("label.field", {}, el("span", {}, "Chapters per day"), per)),
        el("label.field", {}, el("span", {}, "Start date"), start),
        note,
        bar,
        el("div.actions", {}, el("button.btn", { onclick: () => { stop = true; if (!go2.disabled) close(); } }, "Cancel"), go2)
      );
    });
  }

  // ---------- settings ----------
  function settingsDialog() {
    ui.dialog((box, close) => {
      const trSel = el("select.input", {}, T().map((t) => el("option", { value: t.id, selected: t.id === settings.tr }, `${t.name} — ${t.full}`)));
      const esvIn = el("input.input", { value: settings.esvKey || "", placeholder: "Paste your ESV API key", autocomplete: "off", spellcheck: "false" });
      const nltIn = el("input.input", { value: settings.nltKey || "", placeholder: "Paste your NLT API key", autocomplete: "off", spellcheck: "false" });
      const bgSel = el("select.input", {}, S.backgrounds.LIST.map((b) => el("option", { value: b.id, selected: b.id === settings.bg }, `${b.group}: ${b.name}`)));
      const guideSel = el("select.input", {}, [["guide", "S.E.L.A.H. guide (Scripture, Examine, Lesson, Acknowledge, Heart)"], ["free", "Free journal (one open writing area)"]].map(([v, n]) =>
        el("option", { value: v, selected: (settings.guide === false ? "free" : "guide") === v }, n)));
      const theme = el("select.input", {}, [["auto", "Match device"], ["light", "Light"], ["dark", "Dark"]].map(([v, n]) => el("option", { value: v, selected: v === settings.theme }, n)));
      const week = el("select.input", {}, [[0, "Sunday"], [1, "Monday"]].map(([v, n]) => el("option", { value: v, selected: v === settings.startWeek }, n)));
      const extra = [];
      if (S.platform === "electron") {
        const verseWin = el("input", { type: "checkbox" });
        const login = el("input", { type: "checkbox" });
        S.store.raw("getWidgetPrefs").then((p) => { verseWin.checked = !!(p && p.show); login.checked = !!(p && p.login); });
        verseWin.onchange = () => S.store.raw("setWidgetPrefs", { show: verseWin.checked });
        login.onchange = () => S.store.raw("setWidgetPrefs", { login: login.checked });
        extra.push(el("h4", { style: { margin: "18px 0 8px" } }, "Desktop verse window"),
          el("label.row", { style: { alignItems: "center", marginBottom: "8px" } }, verseWin, "Show the verse of the day on the desktop"),
          el("label.row", { style: { alignItems: "center" } }, login, "Open Selah's verse window when I sign in"));
      }
      box.append(
        el("h2", {}, "Settings"),
        el("p.sub", {}, "Saved on this device."),
        el("label.field", {}, el("span", {}, "Main translation (pages and widget)"), trSel),
        el("label.field", {}, el("span", {}, "Page style for new pages"), guideSel),
        el("label.field", {}, el("span", {}, "Background for new pages"), bgSel),
        el("div.row", {}, el("label.field", {}, el("span", {}, "Appearance"), theme), el("label.field", {}, el("span", {}, "Week starts on"), week)),
        ...extra,
        el("h4", { style: { margin: "18px 0 8px" } }, "Bible downloads"),
        S.sources.localIds.length ? el("p.muted", { style: { margin: "0 0 10px" } }, `On this device: ${S.sources.localIds.map((id) => S.bible.trInfo(id).name).join(", ")} from your own Bible files (works offline).`) : null,
        el("p.muted", { style: { margin: "0 0 10px" } }, "Selah doesn't store whole Bibles. Each planned day downloads just its passage. WEB and KJV are free and need nothing. To add ESV or NLT, get a free key for non-commercial use and paste it here: api.esv.org (ESV), api.nlt.to (NLT)."),
        el("label.field", {}, el("span", {}, "ESV key (optional)"), esvIn),
        el("label.field", {}, el("span", {}, "NLT key (optional)"), nltIn),
        el("h4", { style: { margin: "18px 0 8px" } }, "Move to another device"),
        el("p.muted", { style: { margin: "0 0 10px" } }, "Export makes one backup file with every planned day, reflection, drawing and photo. Import it on another device."),
        el("div.row", {}, el("button.btn", { onclick: exportAll }, "Export backup…"), el("button.btn", { onclick: () => { close(); importAll(); } }, "Import backup…")),
        el("p.copyright", { style: { marginTop: "18px" } }, "WEB and KJV text from bible-api.com (public domain). ESV® © Crossway and NLT © Tyndale House Foundation, used through their official services with the publishers' notices."),
        el("div.actions", {}, el("button.btn.primary", {
          onclick: async () => {
            await saveSettings({ guide: guideSel.value === "guide", tr: trSel.value, bg: bgSel.value, theme: theme.value, startWeek: +week.value, esvKey: esvIn.value.trim(), nltKey: nltIn.value.trim() });
            close();
            route();
          },
        }, "Done"))
      );
    });
  }

  async function exportAll() {
    ui.toast("Preparing backup…");
    const days = [];
    const photos = {};
    for (const id of sortIds(Object.keys(index))) {
      const e = await getDay(id);
      if (!e) continue;
      days.push(e);
      for (const it of e.items || []) if (it.kind === "photo" && !photos[it.ref]) photos[it.ref] = await S.store.get("photo/" + it.ref);
    }
    const mystickers = (await S.store.get("mystickers")) || [];
    const stickers = {};
    for (const st of mystickers) stickers[st.id] = await S.store.get("sticker/" + st.id);
    const data = { app: "selah", version: 1, exported: new Date().toISOString(), settings, days, photos, mystickers, stickers };
    const ok = await S.store.saveFile(`Selah backup ${ui.today()}.selah`, JSON.stringify(data));
    if (ok) ui.toast(`Exported ${days.length} day${days.length === 1 ? "" : "s"}`);
  }

  function importAll() {
    const inp = el("input", { type: "file", accept: ".selah,.json,application/json" });
    inp.onchange = async () => {
      const f = inp.files[0];
      if (!f) return;
      let data;
      try {
        data = JSON.parse(await f.text());
        if (data.app !== "selah" || !Array.isArray(data.days)) throw 0;
      } catch {
        return ui.toast("That isn't a Selah backup file");
      }
      for (const e of data.days) e.id = e.id || e.date;
      const clash = data.days.filter((d) => index[d.id]).length;
      let replace = true;
      if (clash) {
        replace = await ui.confirmBox("Some days already exist",
          `${clash} of the ${data.days.length} days in the backup are already on this device. Replace them with the backup's version? (Cancel keeps yours and adds only new days.)`, "Replace");
      }
      // the person's own stickers: add any this device doesn't have yet
      if (Array.isArray(data.mystickers) && data.stickers) {
        const mine = (await S.store.get("mystickers")) || [];
        const have = new Set(mine.map((s) => s.id));
        for (const st of data.mystickers) {
          if (have.has(st.id) || !data.stickers[st.id]) continue;
          await S.store.set("sticker/" + st.id, data.stickers[st.id]);
          mine.push(st);
        }
        await S.store.set("mystickers", mine);
      }
      let n = 0;
      for (const e of data.days) {
        if (index[e.id] && !replace) continue;
        for (const it of e.items || []) if (it.kind === "photo" && data.photos && data.photos[it.ref]) await S.store.set("photo/" + it.ref, data.photos[it.ref]);
        await saveDay(e, { quiet: true });
        n++;
      }
      pushWidget();
      ui.toast(`Imported ${n} day${n === 1 ? "" : "s"}`);
      route();
    };
    inp.click();
  }

  // ---------- start ----------
  async function start() {
    if (S.platform === "electron" && /Mac/.test(navigator.platform)) document.body.classList.add("mac-electron");
    const stored = await S.store.get("settings");
    await Promise.all([loadSettings(), loadIndex(), S.bible.init()]);
    if (!(stored && stored.tr && S.bible.TRANSLATIONS.some((t) => t.id === stored.tr)) && S.sources.localIds.includes("niv")) settings.tr = "niv";
    document.getElementById("go-calendar").onclick = () => go("#/cal");
    document.getElementById("go-today").onclick = () => go("#/day/" + ui.today()); // shows the start choices if nothing is planned
    document.getElementById("go-plan").onclick = () => planDialog(location.hash.startsWith("#/day/") ? location.hash.slice(6) : ui.today());
    document.getElementById("go-settings").onclick = settingsDialog;
    window.addEventListener("hashchange", route);
    // Native shells can open a specific day (e.g. tapping the widget).
    window.SelahOpenDay = (d) => go(idsFor(d).length ? "#/day/" + idsFor(d)[0] : "#/cal/" + d.slice(0, 7));
    if (!location.hash) location.hash = idsFor(ui.today()).length ? "#/day/" + idsFor(ui.today())[0] : "#/cal";
    else route();
    pushWidget();
    // web version only: keep the app's files for offline use and allow "Add to Home Screen"
    if (S.platform === "browser" && "serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
    // Refresh the widget feed just after midnight while the app stays open.
    let day = ui.today();
    setInterval(() => {
      if (ui.today() !== day) {
        day = ui.today();
        pushWidget();
        if (!location.hash.startsWith("#/day/")) route();
      }
    }, 60000);
  }

  S.app = {
    get settings() { return settings; },
    get index() { return index; },
    saveSettings, getDay, saveDay, removeDay, planDay, journalDay, planDialog, bulkDialog, go, route, verseOfDay, favorite, pushWidget,
    dateOf, idsFor, sortIds, nextId, labelOf, flushPage,
  };

  window.addEventListener("DOMContentLoaded", () =>
    start().catch((e) => {
      console.error(e);
      document.getElementById("view").append(el("p", { style: { padding: "24px" } }, "Selah couldn't start: " + e.message));
    })
  );
})();
