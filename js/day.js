/* One day's page: date, S.E.L.A.H. sections (Scripture + four writing areas), highlights, art layer. */
(function () {
  const S = window.Selah;
  const { el } = S.ui;
  const ui = S.ui;
  // translations saved with a day, in a steady order (older days may also have NIV/ESV/NLT from before)
  const ORDER = ["niv", "esv", "nlt", "web", "kjv", "tag1905", "ceb1917"];
  const savedTr = (entry) => Object.keys(entry.verses || {}).sort((a, b) => (ORDER.indexOf(a) + 99) % 99 - (ORDER.indexOf(b) + 99) % 99);

  // The S.E.L.A.H. devotional flow (S is the passage itself, shown above these).
  const SCRIPTURE_HINT = "Let the word be set before you, that it may guide your steps.";
  const SECTIONS = [
    { k: "e", letter: "E", title: "Examine", hint: "Consider the meaning, and ponder the truth revealed. Ask questions about the passage.", ph: "What does this passage say? What truth stands out to you?" },
    { k: "l", letter: "L", title: "Lesson", hint: "Take hold of the teaching, that wisdom may dwell within you.", ph: "The lesson I'm taking hold of today…" },
    { k: "a", letter: "A", title: "Acknowledge", hint: "Lift up your prayer in thanksgiving, confession, and praise.", ph: "Lord, I thank you for…  I confess…  I praise you because…  (Use ☑ for prayer points: unchecked ones carry to the next day.)" },
    { k: "h", letter: "H", title: "Heart", hint: "Plant this truth deep within, and meditate upon it day and night. What verse caught your heart?", ph: "Write, draw, or sit quietly with the words to carry in your heart…" },
  ];
  const HL_COLORS = ["#fff176", "#b9f6ca", "#b3e5fc", "#f8bbd0", "#ffd180", "#d1c4e9"];
  const UL_COLORS = { "#fff176": "#c9a400", "#b9f6ca": "#2f9e5a", "#b3e5fc": "#1f7fb5", "#f8bbd0": "#c2477a", "#ffd180": "#d9822b", "#d1c4e9": "#6e55c9" };
  const FONTS = [
    ["Serif", 'var(--serif)'],
    ["Clean", 'var(--sans)'],
    ["Handwriting", '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive'],
    ["Marker", '"Marker Felt", "Ink Free", "Segoe Print", cursive'],
    ["Elegant", '"Snell Roundhand", "Segoe Script", "Brush Script MT", cursive'],
    ["Typewriter", '"American Typewriter", "Courier New", monospace'],
  ];
  const TEXT_COLORS = ["#2e2a25", "#c0392b", "#2f7a46", "#1f6f8b", "#5a46c2", "#b0561a"];

  // keep only harmless markup in saved reflections (they may come from an imported backup)
  function clean(html) {
    const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
    doc.querySelectorAll("script,style,iframe,object,embed,link,meta,img,svg,form,input,button").forEach((n) => n.remove());
    doc.querySelectorAll("*").forEach((n) => {
      for (const a of [...n.attributes]) if (!["style", "class", "color", "face", "size"].includes(a.name)) n.removeAttribute(a.name);
    });
    return doc.body.firstChild.innerHTML;
  }

  async function show(host, id) {
    const app = S.app;
    const date = app.dateOf(id);
    let entry = await app.getDay(id);
    if (!entry && id === date && app.idsFor(date).length) {
      // the day's first entry was deleted: open the next one
      app.go("#/day/" + app.idsFor(date)[0]);
      return {};
    }
    if (!entry) {
      // nothing here yet: offer the ways to start
      const isToday = date === ui.today();
      const extra = app.idsFor(date).length > 0;
      const choice = (icon, title, text, onclick, primary) =>
        el("button.start-choice", { class: primary ? "primary" : "", onclick }, el("span.ic", {}, icon), el("span", {}, el("b", {}, title), el("small", {}, text)));
      host.append(el("div.cal-wrap", { style: { display: "block", maxWidth: "560px" } },
        el("div.card.start-card", {},
          el("p.muted", { style: { margin: "0 0 2px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", fontSize: "12px" } }, ui.weekday(date)),
          el("h2", {}, ui.longDate(date)),
          el("p.muted", {}, extra ? "A new entry for this day. How would you like to start?" : isToday ? "Nothing planned for today yet. How would you like to start?" : "Nothing planned for this day yet."),
          el("div.start-choices", {},
            choice("📖", "Choose a passage", "Type a reference and download it (needs internet).", () => app.planDialog(date, null, { id }), true),
            choice("📋", "Paste a passage", "Paste from your Bible app or a website — works offline.", () => app.planDialog(date, null, { paste: true, id })),
            choice("✎", "Just journal", "A blank page to write freely, no passage.", async () => { await app.journalDay(id); app.go("#/day/" + id); }),
            choice("📝", "Notes only", "A titled page of notes — sermon, study, ideas. Type @ to add a verse.", async () => { await app.journalDay(id, { notes: true }); app.go("#/day/" + id); })),
          el("div", { style: { marginTop: "14px" } },
            extra ? el("button.btn.ghost", { onclick: () => app.go("#/day/" + app.idsFor(date)[0]) }, "‹ Back to this day") : el("button.btn.ghost", { onclick: () => app.go("#/cal/" + date.slice(0, 7)) }, "‹ Back to calendar")))));
      return {};
    }
    entry.sections = entry.sections || { e: "", l: "", a: "", h: "" };
    entry.hl = entry.hl || {};
    if (!entry.verses[entry.tr]) entry.tr = entry.verses[app.settings.tr] ? app.settings.tr : savedTr(entry)[0];
    const TR = savedTr(entry).map((id) => ({ id, name: S.bible.trInfo(id).name }));
    entry.sections.j = entry.sections.j || "";
    entry.id = entry.id || id;
    const isNotes = entry.kind === "notes";
    const hasPassage = Object.keys(entry.verses || {}).length > 0;

    const save = ui.debounce(() => app.saveDay(entry), 500);
    // save right away if the app is hidden or closed mid-typing
    const flushNow = () => save.flush();
    const onHidden = () => document.visibilityState === "hidden" && flushNow();
    window.addEventListener("pagehide", flushNow);
    document.addEventListener("visibilitychange", onHidden);

    // ---------- layout ----------
    const rail = el("div.rail");
    const sheet = el("div.sheet", { class: entry.width < 600 ? "narrow" : "" });
    sheet.style.width = entry.width + "px";
    const holder = el("div.sheet-holder", {}, sheet);
    const scroller = el("div.day-scroll");
    const planned = app.sortIds(Object.keys(app.index));
    const at = planned.indexOf(id);
    const prev = planned[at - 1], next = planned[at + 1];
    const sameDay = app.idsFor(date);
    // several entries on this day: switch between them
    const entrySeg = sameDay.length > 1 ? el("div.seg.entries", { title: "Entries on this day" },
      sameDay.map((k, i) => el("button", { class: k === id ? "on" : "", title: app.labelOf(app.index[k]), onclick: () => k !== id && app.go("#/day/" + k) }, `${i + 1}`)),
      el("button", { title: "New entry for this day", onclick: () => app.go("#/day/" + app.nextId(date)) }, "＋")) : null;

    const guideSwitch = ui.toggle("S.E.L.A.H.", entry.guide !== false, (on) => setGuide(on), "S.E.L.A.H. guide on/off — off gives one open writing area");
    if (isNotes) guideSwitch.hidden = true;
    const trSeg = el("div.seg", { title: "Translation", hidden: TR.length < 2 }, TR.map((t) =>
      el("button", { class: t.id === entry.tr ? "on" : "", onclick: () => setTr(t.id) }, t.name)));
    const menuBtn = el("button.icon-btn", { title: "More", "aria-label": "More", html: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>' });
    menuBtn.onclick = () => ui.popover(menuBtn, (p, close) => {
      p.append(el("div", { style: { display: "grid", gap: "4px", minWidth: "200px" } },
        el("button.btn.ghost", { onclick: () => { close(); app.go("#/day/" + app.nextId(date)); } }, "＋ New entry for this day"),
        el("button.btn.ghost", { onclick: () => { close(); app.planDialog(id, entry); } }, hasPassage ? "Change passage" : "Add a passage"),
        el("button.btn.ghost", { onclick: () => { close(); app.planDialog(id, entry, { paste: true }); } }, "Paste my own text"),
        isNotes ? null : el("button.btn.ghost", { onclick: () => { close(); setGuide(entry.guide === false); } },
          entry.guide === false ? "Use the S.E.L.A.H. guide" : "Free journal (turn off guide)"),
        el("button.btn.ghost", { onclick: () => { close(); copyPage(); } }, "Copy page text"),
        el("button.btn.ghost", { onclick: () => { close(); savePhoto(); } }, "Save page as photo"),
        app.favorite(entry) ? el("button.btn.ghost", { onclick: () => { close(); setFav(null); } }, "Clear favorite verse") : null,
        el("button.btn.ghost.danger", { onclick: async () => {
          close();
          const many = app.idsFor(date).length > 1;
          if (await ui.confirmBox(many ? "Delete this entry?" : "Delete this day?", `${ui.longDate(date)}${entry.ref ? " · " + entry.ref : ""} — the passage, writing, drawings and photos of this entry will be removed.`, "Delete", true)) {
            save.flush();
            await app.removeDay(id);
            const left = app.idsFor(date);
            app.go(left.length ? "#/day/" + left[0] : "#/cal/" + date.slice(0, 7));
          }
        } }, many() ? "Delete this entry" : "Delete day")));
    }, { side: "below" });
    const many = () => app.idsFor(date).length > 1;

    const top = el("div.day-top", {},
      el("button.btn.ghost", { onclick: () => app.go("#/cal/" + date.slice(0, 7)) }, "‹ Calendar"),
      el("button.icon-btn", { title: prev ? "Previous reading" : "", disabled: !prev, style: { opacity: prev ? 1 : 0.3 }, onclick: () => prev && app.go("#/day/" + prev), html: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' }),
      el("button.icon-btn", { title: next ? "Next reading" : "", disabled: !next, style: { opacity: next ? 1 : 0.3 }, onclick: () => next && app.go("#/day/" + next), html: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' }),
      entrySeg,
      el("span.spacer"),
      guideSwitch,
      trSeg,
      menuBtn,
      el("button.icon-btn.side-toggle", { title: "Companion panel: today, prayer list, memory verse", "aria-label": "Companion panel", onclick: () => side && side.toggle(), html: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14.5 4.5v15" stroke="currentColor" stroke-width="1.8"/></svg>' }));
    let side = null;
    // saving the page as a picture lives at the very bottom, out of the way while writing
    const bottom = el("div.day-bottom", {},
      el("button.btn.download", { onclick: () => copyPage(), title: "Copy this page's text",
        html: '<svg viewBox="0 0 24 24" width="18" height="18"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/></svg> Copy' }),
      el("button.btn.download", { onclick: () => savePhoto(), title: "Save this whole page as a picture",
        html: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Download page as photo' }));
    scroller.append(top, holder, bottom);
    const dayEl = el("div.day", {}, rail, scroller);
    host.append(dayEl);

    // ---------- page content ----------
    const scripture = el("div.scripture");
    // the passage label in the chosen translation's language (e.g. "Juan 3:16–21" for Tagalog/Cebuano)
    const refFor = (tr) => (entry.ranges && entry.ranges.length ? S.bible.label(entry.ranges, tr) : entry.ref || "");
    // Free journal style: one open writing area instead of E/L/A/H (both are kept; only one shows)
    function journalSection() {
      const ph = isNotes ? "Your notes… Type @ to add a verse (e.g. @John 3:16)." : hasPassage ? "Write freely — thoughts, prayers, notes, anything on your heart…" : "Write freely…";
      const w = el("div.write.journal-write", { contenteditable: "true", "data-ph": ph, "data-k": "j", spellcheck: "true", html: clean(entry.sections.j) });
      wireWrite(w, "j");
      let head = el("h3", {}, "Journal");
      if (isNotes) {
        // a notes page has its own title line
        head = el("div.note-title", { contenteditable: "true", spellcheck: "true", "data-ph": "Title — e.g. Sunday sermon, Bible study" });
        head.textContent = entry.title || "";
        head.addEventListener("input", () => { entry.title = head.textContent.trim(); save(); });
        head.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); w.focus(); } });
        head.addEventListener("paste", (e) => { e.preventDefault(); document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain").replace(/\s+/g, " ")); });
      }
      return el("section.sec.journal", { "data-anchor": "j" }, el("div.sec-h.plain", { class: isNotes ? "notes-h" : "" }, head), w);
    }
    /** Typing, pasting, checklists and @verse calls in a writing area. */
    function wireWrite(w, k) {
      w.addEventListener("input", (e) => {
        entry.sections[k] = w.innerHTML;
        save();
        art.resize(); // pinned drawings below follow the text
        if (e.inputType && e.inputType.startsWith("insert")) atCheck(w);
      });
      w.addEventListener("paste", (e) => {
        e.preventDefault();
        document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain"));
      });
      w.addEventListener("click", (e) => {
        const li = e.target.closest("ul.checks li");
        if (li && e.offsetX < 26) {
          li.classList.toggle("ok");
          entry.sections[k] = w.innerHTML;
          save();
        }
      });
    }
    function applyGuide() {
      sheet.classList.toggle("free", entry.guide === false || isNotes);
      sheet.classList.toggle("notes", isNotes);
    }
    function setGuide(on) {
      entry.guide = !!on;
      applyGuide();
      guideSwitch.set(on);
      art.resize();
      app.saveDay(entry);
    }
    const content = el("div.sheet-content", {},
      el("header.day-date", { "data-anchor": "top" }, el("span.dow", {}, ui.weekday(date)), el("span.full", {}, ui.longDate(date))),
      el("section.sec.sec-s", { "data-anchor": "s", class: hasPassage ? "" : "empty" },
        el("div.sec-h", {}, el("span.letter", {}, "S"), el("div", {}, el("h3", {}, "Scripture ", el("span.ref-line", {}, "· " + refFor(entry.tr))), el("div.hint", {}, SCRIPTURE_HINT))),
        scripture,
        el("div.copyright", { "data-tr": "" })),
      SECTIONS.map((s) => {
        const w = el("div.write", { contenteditable: "true", "data-ph": s.ph, "data-k": s.k, spellcheck: "true", html: clean(entry.sections[s.k]) });
        wireWrite(w, s.k);
        return el("section.sec.guided", { "data-anchor": s.k },
          el("div.sec-h", {}, el("span.letter", {}, s.letter), el("div", {}, el("h3", {}, s.title), el("div.hint", {}, s.hint))),
          w);
      }).concat(journalSection()));
    sheet.append(content);
    applyGuide();

    // backgrounds: still ones are CSS; moving scenes and the person's own videos/GIFs play in a layer
    let motionLayer = null;
    async function applyBg() {
      const want = entry.bg;
      const my = String(want || "").startsWith("my:") ? (await S.motion.myList()).find((x) => "my:" + x.id === want) : null;
      if (want !== entry.bg) return;
      const b = my ? null : S.backgrounds.byId[want] || S.backgrounds.byId.cream;
      sheet.style.background = my ? (my.dark ? "#1f2430" : "#fffdf8") : b.css;
      sheet.classList.toggle("dark-paper", my ? !!my.dark : !!b.dark);
      if (motionLayer) motionLayer.set(b ? b.id : null, my);
    }
    applyBg();

    // ---------- scripture & highlights ----------
    const keyOf = (v) => `${v.b}:${v.c}:${v.v}`;
    function renderScripture() {
      const refLine = content.querySelector(".ref-line");
      if (refLine) refLine.textContent = "· " + refFor(entry.tr);
      const vs = entry.verses[entry.tr] || [];
      const marks = entry.hl[entry.tr] || [];
      const multiChapter = new Set(vs.map((v) => v.b + ":" + v.c)).size > 1;
      scripture.replaceChildren();
      let lastCh = null;
      for (const v of vs) {
        const chKey = v.b + ":" + v.c;
        if (multiChapter && chKey !== lastCh) scripture.append(el("span.chap", {}, `${S.sources.ALL[entry.tr] && S.sources.ALL[entry.tr].bookNames ? S.sources.bookName(entry.tr, v.b) : S.bible.bookName(v.b).replace(/^Psalms$/, "Psalm")} ${v.c}`));
        lastCh = chKey;
        if (!v.t && entry.pasted && entry.pasted[entry.tr]) continue; // pasted as one block: nothing to show here
        scripture.append(el("sup", {}, v.v));
        if (!v.t) {
          scripture.append(el("span.miss", {}, `(not in the ${S.bible.trInfo(entry.tr).name}) `));
          continue;
        }
        const k = keyOf(v);
        const span = el("span.vt", { "data-k": k, class: entry.key && keyOf(entry.key) === k ? "key" : "" });
        const mine = marks.filter((m) => m.k === k).sort((a, b) => a.s - b.s);
        let pos = 0;
        for (const m of mine) {
          if (m.s > pos) span.append(v.t.slice(pos, m.s));
          const mk = el("mark", { class: m.kind === "ul" ? "ul" : "" }, v.t.slice(m.s, m.e));
          if (m.kind === "ul") mk.style.textDecorationColor = UL_COLORS[m.color] || m.color;
          else mk.style.background = m.color;
          span.append(mk);
          pos = m.e;
        }
        span.append(v.t.slice(pos) + " ");
        scripture.append(span);
      }
      content.querySelector(".copyright").textContent = entry.tr ? S.bible.trInfo(entry.tr).notice : "";
    }
    function setTr(id) {
      entry.tr = id;
      [...trSeg.children].forEach((b, i) => b.classList.toggle("on", TR[i].id === id));
      renderScripture();
      save();
      side && side.refresh();
    }

    function selectionInScripture() {
      const sel = window.getSelection();
      if (!sel.rangeCount || sel.isCollapsed) return null;
      const range = sel.getRangeAt(0);
      if (!scripture.contains(range.commonAncestorContainer)) return null;
      const parts = [];
      for (const span of scripture.querySelectorAll(".vt")) {
        if (!range.intersectsNode(span)) continue;
        const len = span.textContent.replace(/ $/, "").length;
        const off = (node, o) => {
          const r = document.createRange();
          r.selectNodeContents(span);
          r.setEnd(node, o);
          return r.toString().length;
        };
        const s = span.contains(range.startContainer) ? off(range.startContainer, range.startOffset) : 0;
        const e = span.contains(range.endContainer) ? off(range.endContainer, range.endOffset) : len;
        if (Math.min(e, len) > s) parts.push({ k: span.dataset.k, s, e: Math.min(e, len) });
      }
      return parts.length ? { parts, rect: range.getBoundingClientRect() } : null;
    }
    function clearRange(list, p) {
      const out = [];
      for (const m of list) {
        if (m.k !== p.k || m.e <= p.s || m.s >= p.e) {
          out.push(m);
          continue;
        }
        if (m.s < p.s) out.push({ ...m, e: p.s });
        if (m.e > p.e) out.push({ ...m, s: p.e });
      }
      return out;
    }
    function applyMark(parts, color, kind) {
      let list = entry.hl[entry.tr] || [];
      for (const p of parts) {
        list = clearRange(list, p);
        if (color) list.push({ k: p.k, s: p.s, e: p.e, color, kind });
      }
      entry.hl[entry.tr] = list;
      window.getSelection().removeAllRanges();
      hideBars();
      renderScripture();
      save();
      side && side.refresh();
    }
    // Favorite verse of the day: a starred verse in the passage, or one looked up in the side panel.
    // It is kept on its own and never changes the passage or the writing.
    function setKey(k) {
      const [b, c, v] = k.split(":").map(Number);
      entry.key = { b, c, v };
      entry.fav = null;
      window.getSelection().removeAllRanges();
      hideBars();
      renderScripture();
      app.saveDay(entry).then(() => side && side.refresh());
      ui.toast("★ Favorite verse of the day — it shows in the side panel and widget");
    }
    /** fav: { r, t, tr } from a search, or null to clear. */
    function setFav(fav) {
      entry.fav = fav ? { r: fav.r, t: fav.t, tr: fav.tr } : null;
      entry.key = null;
      renderScripture();
      app.saveDay(entry).then(() => side && side.refresh());
      if (fav) ui.toast("★ Favorite verse of the day saved");
    }

    // floating bars
    let hlBar = null, fmtBar = null;
    function hideBars() {
      hlBar && hlBar.remove();
      hlBar = null;
    }
    function place(bar, rect) {
      document.body.append(bar);
      const bw = bar.offsetWidth, bh = bar.offsetHeight;
      let x = rect.left + rect.width / 2 - bw / 2, y = rect.top - bh - 10;
      if (y < 60) y = rect.bottom + 10;
      bar.style.left = Math.max(8, Math.min(window.innerWidth - bw - 8, x)) + "px";
      bar.style.top = Math.max(8, Math.min(window.innerHeight - bh - 8, y)) + "px";
    }
    const keep = (e) => e.preventDefault();
    function showHlBar() {
      if (art.mode !== "write") return;
      const s = selectionInScripture();
      hideBars();
      if (!s) return;
      hlBar = el("div.fmt", { onmousedown: keep, onpointerdown: () => { barTouch = Date.now(); } },
        HL_COLORS.map((c) => el("button.hl", { title: "Highlight", style: { background: c }, onclick: () => applyMark(s.parts, c, "hl") })),
        el("span.sep"),
        el("button", { title: "Underline", onclick: () => applyMark(s.parts, HL_COLORS[0], "ul"), html: "<u>U</u>" }),
        el("button", { title: "Remove highlight", onclick: () => applyMark(s.parts, null) }, "⌫"),
        el("span.sep"),
        el("button", { title: "Make this your favorite verse of the day", onclick: () => setKey(s.parts[0].k) }, "★ Favorite"));
      place(hlBar, s.rect);
    }
    const onSel = ui.debounce(showHlBar, 120);
    scripture.addEventListener("mouseup", onSel);
    scripture.addEventListener("touchend", onSel);
    document.addEventListener("selectionchange", onSelChange);
    let barTouch = 0;
    function onSelChange() {
      const sel = window.getSelection();
      rememberRange(sel);
      if (hlBar && (sel.isCollapsed || !scripture.contains(sel.anchorNode))) {
        // on phones the tap on a bar button clears the selection before the click arrives: wait for it
        if (Date.now() - barTouch < 600) return;
        const bar = hlBar;
        setTimeout(() => {
          const now = window.getSelection();
          if (hlBar === bar && Date.now() - barTouch > 600 && (now.isCollapsed || !scripture.contains(now.anchorNode))) hideBars();
        }, 250);
      }
      if (sel.rangeCount && scripture.contains(sel.anchorNode) && !sel.isCollapsed && (window.matchMedia("(pointer: coarse)").matches)) onSel();
    }

    // The caret/selection in a writing area, kept so a tap on the tools (or a font menu on a phone,
    // which takes the focus away) puts it back exactly where it was.
    let savedRange = null, savedW = null;
    function rememberRange(sel) {
      if (!sel.rangeCount) return;
      const r = sel.getRangeAt(0);
      const n = r.startContainer;
      const w = (n.nodeType === 1 ? n : n.parentElement) && (n.nodeType === 1 ? n : n.parentElement).closest(".write");
      if (w && content.contains(w)) {
        savedRange = r.cloneRange();
        savedW = w;
      }
    }
    function restoreRange(w) {
      if (document.activeElement !== w) w.focus({ preventScroll: true });
      if (savedRange && savedW === w && w.contains(savedRange.startContainer)) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }

    // reflection text tools
    // The text tools can be dragged anywhere by their grip and folded down to a small button;
    // both are remembered on this device.
    const FMT_KEY = "selah.fmt";
    let fmtPref = {};
    try { fmtPref = JSON.parse(localStorage.getItem(FMT_KEY)) || {}; } catch {}
    const saveFmtPref = () => { try { localStorage.setItem(FMT_KEY, JSON.stringify(fmtPref)); } catch {} };
    let fmtFor = null;
    function showFmt(w) {
      if (fmtBar && fmtFor === w) return positionFmt(w);
      fmtBar && fmtBar.remove();
      fmtFor = w;
      const cmd = (c, v) => () => {
        restoreRange(w);
        document.execCommand("styleWithCSS", false, true);
        document.execCommand(c, false, v);
        w.dispatchEvent(new Event("input"));
      };
      const font = el("select", { title: "Font", onchange: (e) => { cmd("fontName", e.target.value)(); e.target.value = ""; } },
        el("option", { value: "" }, "Font"), FONTS.map(([n, f]) => el("option", { value: f.replace(/"/g, "'") }, n)));
      const size = el("select", { title: "Size", onchange: (e) => { cmd("fontSize", e.target.value)(); e.target.value = ""; } },
        el("option", { value: "" }, "Size"), [["2", "Small"], ["3", "Normal"], ["4", "Large"], ["5", "Larger"], ["6", "Title"]].map(([v, n]) => el("option", { value: v }, n)));
      const grip = el("button.grip", { title: "Drag to move the tools (double-tap to put them back)", "aria-label": "Move tools", html: '<svg viewBox="0 0 24 24" width="16" height="16"><g fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></g></svg>' });
      wireGrip(grip, w);
      const foldBtn = el("button.fold", { title: "Fold the tools away", "aria-label": "Fold the tools away", onclick: () => setFold(true) }, "–");
      const openBtn = el("button.unfold", { title: "Show the text tools", onclick: () => setFold(false) }, "Aa");
      function setFold(v) {
        fmtPref.min = v;
        saveFmtPref();
        fmtBar.classList.toggle("min", v);
        restoreRange(w);
        positionFmt(w);
      }
      fmtBar = el("div.fmt.text-tools", { class: fmtPref.min ? "min" : "", onmousedown: (e) => e.target.tagName !== "SELECT" && keep(e), onpointerdown: (e) => e.pointerType !== "mouse" && e.target.tagName !== "SELECT" && e.preventDefault() },
        grip, openBtn,
        el("span.tools", {},
        font, size, el("span.sep"),
        el("button", { title: "Bold", onclick: cmd("bold"), html: "<b>B</b>" }),
        el("button", { title: "Italic", onclick: cmd("italic"), html: "<i>I</i>" }),
        el("button", { title: "Underline", onclick: cmd("underline"), html: "<u>U</u>" }),
        el("button", { title: "Strikethrough", onclick: cmd("strikeThrough"), html: "<s>S</s>" }),
        el("span.sep"),
        TEXT_COLORS.map((c) => el("button.hl", { title: "Text color", style: { background: c }, onclick: cmd("foreColor", c) })),
        el("span.sep"),
        HL_COLORS.slice(0, 4).map((c) => el("button.hl", { title: "Highlight", style: { background: c, borderRadius: "4px" }, onclick: cmd("hiliteColor", c) })),
        el("button", { title: "Remove highlight", onclick: cmd("hiliteColor", "transparent") }, "⌫"),
        el("span.sep"),
        el("button", { title: "Bulleted list", onclick: cmd("insertUnorderedList") }, "•≡"),
        el("button", { title: "Numbered list", onclick: cmd("insertOrderedList") }, "1≡"),
        el("button", { title: "Checklist", onclick: () => { cmd("insertUnorderedList")(); const li = window.getSelection().anchorNode; const ul = li && (li.nodeType === 1 ? li : li.parentElement).closest("ul"); if (ul) ul.classList.add("checks"); w.dispatchEvent(new Event("input")); } }, "☑"),
        el("button", { title: "Center", onclick: cmd("justifyCenter") }, "≡"),
        el("button", { title: "Clear formatting", onclick: cmd("removeFormat") }, "Tx"),
        el("button", { title: "Add a verse (or type @)", onclick: () => { restoreRange(w); openVersePicker(w, null); } }, "@"),
        el("span.sep"), foldBtn));
      document.body.append(fmtBar);
      positionFmt(w);
    }
    function wireGrip(grip, w) {
      let drag = null, lastTap = 0;
      grip.addEventListener("pointerdown", (e) => {
        e.preventDefault(); // keep the caret in the writing area
        const r = fmtBar.getBoundingClientRect();
        drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false };
        grip.setPointerCapture(e.pointerId);
      });
      grip.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const x = e.clientX - drag.dx, y = e.clientY - drag.dy;
        if (!drag.moved && Math.hypot(x - fmtBar.offsetLeft, y - fmtBar.offsetTop) < 3) return;
        drag.moved = true;
        fmtPref.x = Math.round(x);
        fmtPref.y = Math.round(y);
        placeFixed();
      });
      const end = () => {
        if (!drag) return;
        if (drag.moved) saveFmtPref();
        else if (Date.now() - lastTap < 350) {
          // double-tap: back to following the writing area
          delete fmtPref.x;
          delete fmtPref.y;
          saveFmtPref();
          positionFmt(w);
        }
        lastTap = Date.now();
        drag = null;
      };
      grip.addEventListener("pointerup", end);
      grip.addEventListener("pointercancel", end);
      grip.addEventListener("dblclick", () => { delete fmtPref.x; delete fmtPref.y; saveFmtPref(); positionFmt(w); });
    }
    function placeFixed() {
      const bw = fmtBar.offsetWidth, bh = fmtBar.offsetHeight;
      const vv = window.visualViewport;
      const vh = vv ? vv.height + vv.offsetTop : window.innerHeight;
      fmtBar.style.left = Math.max(4, Math.min(window.innerWidth - bw - 4, fmtPref.x)) + "px";
      fmtBar.style.top = Math.max(4, Math.min(vh - bh - 4, fmtPref.y)) + "px";
    }
    function positionFmt(w) {
      if (!fmtBar) return;
      if (fmtPref.x !== undefined && fmtPref.y !== undefined) return placeFixed(); // the person moved it
      const r = w.getBoundingClientRect();
      const bw = fmtBar.offsetWidth, bh = fmtBar.offsetHeight;
      const vr = scroller.getBoundingClientRect();
      let y = r.top - bh - 8;
      if (y < vr.top + 4) y = vr.top + 4;
      fmtBar.style.left = Math.max(8, Math.min(window.innerWidth - bw - 8, r.left + Math.min(20, r.width / 2 - bw / 2))) + "px";
      fmtBar.style.top = y + "px";
    }
    content.addEventListener("focusin", (e) => e.target.classList.contains("write") && showFmt(e.target));
    content.addEventListener("focusout", () => setTimeout(() => {
      if (fmtBar && !(document.activeElement && document.activeElement.classList.contains("write")) && !fmtBar.contains(document.activeElement) && !versePick) {
        fmtBar.remove();
        fmtBar = null;
        fmtFor = null;
      }
    }, 150));
    scroller.addEventListener("scroll", () => {
      const w = document.activeElement;
      if (w && w.classList && w.classList.contains("write")) positionFmt(w);
      hideBars();
    });

    // ---------- @ verse calls: type @ in any writing area to bring in another verse ----------
    let versePick = null;
    function atCheck(w) {
      const sel = window.getSelection();
      if (!sel.rangeCount || !sel.isCollapsed) return;
      const r = sel.getRangeAt(0);
      const n = r.startContainer, o = r.startOffset;
      if (n.nodeType !== 3 || o < 1 || n.data[o - 1] !== "@") return;
      if (o > 1 && !/[\s\u00a0(“"]/.test(n.data[o - 2])) return; // an e-mail address, not a verse call
      const at = document.createRange();
      at.setStart(n, o - 1);
      at.setEnd(n, o);
      openVersePicker(w, at);
    }
    /** at: the range of the typed "@" (replaced by the verse), or null to insert at the caret. */
    function openVersePicker(w, at) {
      closeVersePicker();
      const caret = window.getSelection().rangeCount ? window.getSelection().getRangeAt(0).cloneRange() : null;
      const input = el("input.input", { placeholder: "Verse, e.g. John 3:16 or Rom 8:28-30", autocomplete: "off", spellcheck: "false", enterkeyhint: "done" });
      const msg = el("div.muted.small", {}, "Enter to add it · Esc to cancel");
      const addBtn = el("button.btn.primary", { onclick: () => choose() }, "Add");
      const box = el("div.verse-pick", {}, input, el("div.row", { style: { alignItems: "center", marginTop: "6px" } }, msg, el("span.spacer"), el("button.btn", { onclick: () => cancel() }, "Cancel"), addBtn));
      document.body.append(box);
      const rr = (at || caret || document.createRange()).getBoundingClientRect();
      const wr = w.getBoundingClientRect();
      const x = rr.width || rr.height ? rr.left : wr.left + 8, y = rr.width || rr.height ? rr.bottom : wr.top + 32;
      const bw = box.offsetWidth, bh = box.offsetHeight;
      box.style.left = Math.max(8, Math.min(window.innerWidth - bw - 8, x - 12)) + "px";
      box.style.top = (y + bh + 12 > window.innerHeight ? Math.max(8, (rr.top || wr.top) - bh - 8) : y + 6) + "px";
      versePick = { box, w };
      let busy = false;
      async function choose() {
        if (busy) return;
        busy = true;
        msg.className = "muted small";
        msg.textContent = "Getting the verse…";
        try {
          const got = await S.bible.lookup(input.value, { entry });
          closeVersePicker();
          w.focus({ preventScroll: true });
          const sel = window.getSelection();
          sel.removeAllRanges();
          const target = at || caret;
          if (target && w.contains(target.startContainer)) sel.addRange(target);
          else { const end = document.createRange(); end.selectNodeContents(w); end.collapse(false); sel.addRange(end); }
          if (at) document.execCommand("delete", false); // the typed @
          const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
          const text = got.verses.length > 1 ? got.verses.map((v) => `<sup>${v.v}</sup> ${esc(v.t)}`).join(" ") : esc(got.text);
          document.execCommand("insertHTML", false, `<blockquote class="vcall"><b>${esc(got.ref)}</b> <span class="vtr">${esc(S.bible.trInfo(got.tr).name)}</span><br>${text}</blockquote><div><br></div>`);
          w.dispatchEvent(new Event("input"));
        } catch (e) {
          busy = false;
          msg.className = "err small";
          msg.textContent = e.message;
        }
      }
      function cancel() {
        closeVersePicker();
        restoreRange(w);
        if (caret && w.contains(caret.startContainer)) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(caret); }
      }
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); choose(); }
        else if (e.key === "Escape") { e.preventDefault(); cancel(); }
      });
      box.addEventListener("pointerdown", (e) => e.stopPropagation());
      setTimeout(() => input.focus(), 0);
    }
    function closeVersePicker() {
      if (!versePick) return;
      versePick.box.remove();
      versePick = null;
      setTimeout(() => {
        const a = document.activeElement;
        if (fmtBar && !(a && a.classList && a.classList.contains("write")) && !fmtBar.contains(a)) { fmtBar.remove(); fmtBar = null; fmtFor = null; }
      }, 150);
    }
    const pickOutside = (e) => versePick && !versePick.box.contains(e.target) && closeVersePicker();
    document.addEventListener("pointerdown", pickOutside, true);

    // ---------- scaling & zoom ----------
    // The page is first fitted to the window; zoom then multiplies that (remembered per device).
    let scale = 1, fitScale = 1;
    const ZMIN = 0.5, ZMAX = 3;
    let zoom = 1;
    try { zoom = Math.min(ZMAX, Math.max(ZMIN, +localStorage.getItem("selah.zoom") || 1)); } catch {}
    const zoomLabel = el("button", { title: "Back to fit (100%)", onclick: () => setZoom(1) }, "100%");
    const zoomCtl = el("div.seg.zoom", { title: "Zoom" },
      el("button", { title: "Zoom out", "aria-label": "Zoom out", onclick: () => setZoom(zoom / 1.2) }, "−"),
      zoomLabel,
      el("button", { title: "Zoom in", "aria-label": "Zoom in", onclick: () => setZoom(zoom * 1.2) }, "+"));
    top.insertBefore(zoomCtl, trSeg);

    function fit() {
      const avail = scroller.clientWidth - (window.innerWidth <= 720 ? 16 : 36);
      fitScale = Math.max(0.3, Math.min(window.innerWidth > 1300 ? 1.2 : 1, avail / entry.width));
      scale = fitScale * zoom;
      sheet.style.transform = `scale(${scale})`;
      holder.style.width = entry.width * scale + "px";
      holder.style.height = sheet.offsetHeight * scale + "px";
      zoomLabel.textContent = Math.round(zoom * 100) + "%";
    }
    /** Change zoom, keeping the point under (cx, cy) — or the middle of the view — in place. */
    function setZoom(z, cx, cy) {
      z = Math.min(ZMAX, Math.max(ZMIN, Math.abs(z - 1) < 0.04 ? 1 : z));
      if (z === zoom) return;
      const r = scroller.getBoundingClientRect();
      const px = (cx ?? r.left + r.width / 2) - r.left, py = (cy ?? r.top + r.height / 2) - r.top;
      const hr = holder.getBoundingClientRect();
      const fx = (px + r.left - hr.left) / hr.width, fy = (py + r.top - hr.top) / hr.height;
      zoom = z;
      try { localStorage.setItem("selah.zoom", String(z)); } catch {}
      fit();
      const nr = holder.getBoundingClientRect();
      scroller.scrollLeft += nr.left + fx * nr.width - (px + r.left);
      scroller.scrollTop += nr.top + fy * nr.height - (py + r.top);
      hideBars();
    }
    const sheetRO = new ResizeObserver(fit);
    sheetRO.observe(sheet);
    sheetRO.observe(scroller);

    // pinch: trackpad (Chrome/Electron send ctrl+wheel; Safari sends gesture events) and two fingers on touch screens
    scroller.addEventListener("wheel", (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(zoom * Math.exp(-e.deltaY / 200), e.clientX, e.clientY);
    }, { passive: false });
    let gestureStart = 1;
    scroller.addEventListener("gesturestart", (e) => { e.preventDefault(); gestureStart = zoom; });
    scroller.addEventListener("gesturechange", (e) => { e.preventDefault(); setZoom(gestureStart * e.scale, e.clientX, e.clientY); });
    let pinch = null;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    scroller.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) pinch = { d: dist(e.touches), z: zoom };
    }, { passive: true });
    scroller.addEventListener("touchmove", (e) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const t = e.touches;
      setZoom(pinch.z * (dist(t) / pinch.d), (t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2);
    }, { passive: false });
    scroller.addEventListener("touchend", (e) => { if (e.touches.length < 2) pinch = null; });
    const zoomKeys = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "=" || e.key === "+") { e.preventDefault(); setZoom(zoom * 1.2); }
      else if (e.key === "-") { e.preventDefault(); setZoom(zoom / 1.2); }
      else if (e.key === "0") { e.preventDefault(); setZoom(1); }
    };
    document.addEventListener("keydown", zoomKeys);

    const art = S.art.attach({
      rail, sheet, entry,
      save,
      scale: () => scale,
      viewCenter: () => {
        const sr = scroller.getBoundingClientRect(), r = sheet.getBoundingClientRect();
        return { x: entry.width / 2, y: Math.max(80, (sr.top + sr.height / 2 - r.top) / scale) };
      },
      setBackground: (id) => {
        entry.bg = id;
        applyBg();
        save();
      },
      onMode: (m) => {
        if (m !== "write") {
          hideBars();
          if (fmtBar) {
            fmtBar.remove();
            fmtBar = null;
            fmtFor = null;
          }
        }
      },
    });

    renderScripture();
    fit();
    motionLayer = S.motion.attach({ sheet, scroller, scale: () => scale });
    applyBg();

    side = S.side.mount({
      date, id, entry, art,
      go: app.go,
      setFav,
      setBackground: (id) => { entry.bg = id; applyBg(); save(); },
      scrollToVerse: (k) => {
        const span = scripture.querySelector(`.vt[data-k="${k}"]`);
        if (!span) return;
        span.scrollIntoView({ block: "center", behavior: "smooth" });
        span.classList.add("flash");
        setTimeout(() => span.classList.remove("flash"), 1400);
      },
    });
    dayEl.append(side.node);
    side.init();

    // ---------- prayer points carry over ----------
    // Unchecked checklist items (prayer points) from the last earlier entry come forward to today's
    // first entry; ticking one off (answered) stops it from carrying further.
    async function carryPrayers() {
      if (entry.carried || isNotes || date !== ui.today() || app.idsFor(date)[0] !== id) return;
      entry.carried = true;
      const earlier = app.sortIds(Object.keys(app.index).filter((k) => app.dateOf(k) < date)).reverse().slice(0, 30);
      let from = null, open = [];
      for (const k of earlier) {
        const p = await app.getDay(k);
        if (!p || !p.sections) continue;
        const doc = new DOMParser().parseFromString(`<div>${(p.sections.a || "") + (p.sections.j || "")}</div>`, "text/html");
        const items = [...doc.querySelectorAll("ul.checks li")];
        if (!items.length) continue;
        from = p.date;
        open = items.filter((li) => !li.classList.contains("ok") && li.textContent.trim()).map((li) => clean(li.innerHTML));
        break;
      }
      const target = entry.guide === false ? "j" : "a";
      const have = new Set([...new DOMParser().parseFromString(`<div>${entry.sections[target] || ""}</div>`, "text/html").querySelectorAll("li")].map((li) => li.textContent.trim()));
      open = open.filter((h) => !have.has(new DOMParser().parseFromString(h, "text/html").body.textContent.trim()));
      if (open.length) {
        entry.sections[target] = (entry.sections[target] || "") + `<ul class="checks">${open.map((h) => `<li>${h}</li>`).join("")}</ul>`;
        const w = content.querySelector(`.write[data-k="${target}"]`);
        if (w) w.innerHTML = clean(entry.sections[target]);
        art.resize();
        ui.toast(`Carried ${open.length} prayer point${open.length > 1 ? "s" : ""} from ${ui.shortDate(from)}`);
      }
      app.saveDay(entry);
    }
    carryPrayers().catch((e) => console.warn("carry", e));

    // ---------- copy the page as text ----------
    function htmlText(html) {
      const d = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html").body.firstChild;
      d.querySelectorAll("ul.checks li").forEach((li) => li.prepend(li.classList.contains("ok") ? "☑ " : "☐ "));
      d.querySelectorAll("ol").forEach((ol) => [...ol.children].forEach((li, i) => li.prepend(`${i + 1}. `)));
      d.querySelectorAll("ul:not(.checks) li").forEach((li) => li.prepend("• "));
      d.querySelectorAll("br").forEach((b) => b.replaceWith("\n"));
      d.querySelectorAll("div,p,li,blockquote,h1,h2,h3,h4").forEach((b) => b.append("\n"));
      return d.textContent.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    }
    function pageText() {
      const out = [`${ui.weekday(date)}, ${ui.longDate(date)}`];
      if (isNotes) out.push(entry.title || "Notes");
      if (hasPassage) {
        const vs = (entry.verses[entry.tr] || []).filter((v) => v.t);
        out.push("", `${entry.ref} (${S.bible.trInfo(entry.tr).name})`, vs.map((v) => (vs.length > 1 ? `${v.v} ` : "") + v.t).join(" "));
      }
      const fav = app.favorite(entry);
      if (fav) out.push("", `★ ${fav.r} — “${fav.t}”`);
      if (entry.guide === false || isNotes) {
        const t = htmlText(entry.sections.j);
        if (t) out.push("", t);
      } else {
        for (const sct of SECTIONS) {
          const t = htmlText(entry.sections[sct.k]);
          if (t) out.push("", sct.title.toUpperCase(), t);
        }
      }
      return out.join("\n");
    }
    async function copyPage() {
      save.flush();
      ui.toast((await ui.copyText(pageText())) ? "Page text copied" : "Couldn't copy on this device");
    }

    // ---------- save as photo ----------
    async function savePhoto() {
      if (typeof html2canvas !== "function") return ui.toast("Photo export isn't available");
      ui.toast("Making the picture…", 6000);
      art.deselect();
      hideBars();
      document.activeElement && document.activeElement.blur && document.activeElement.blur();
      const oldT = sheet.style.transform;
      sheet.style.transform = "none";
      sheet.classList.add("capturing");
      try {
        await motionLayer.capture(true);
        // Fit the picture within what the device can make: iPhone/iPad/Safari allow about 16 million pixels
        // per image and 16,384 px per side; long pages are saved a little smaller instead of failing.
        const w = sheet.offsetWidth, h = sheet.offsetHeight;
        const appleLike = S.platform === "apple" || /iPhone|iPad|Macintosh/.test(navigator.userAgent) && "ontouchend" in document || /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const maxArea = appleLike ? 16.0e6 : 60e6, maxSide = appleLike ? 16000 : 30000;
        const scale = Math.max(0.25, Math.min(2.5, 2200 / entry.width, Math.sqrt(maxArea / (w * h)), maxSide / h));
        const canvas = await html2canvas(sheet, {
          scale, backgroundColor: "#ffffff", logging: false,
          width: w, height: h, windowWidth: Math.max(window.innerWidth, entry.width + 40),
        });
        if (!canvas.width || !canvas.height) throw new Error("this page is too long for one picture");
        // saved as JPEG: small files that open everywhere
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const name = `Selah ${date} ${(entry.ref || entry.title || (isNotes ? "Notes" : "Journal")).replace(/[:;,]/g, ".").replace(/[\\/]/g, "-")}.jpg`;
        const ok = await S.store.raw("savePhoto", { name, dataUrl });
        if (ok !== false && S.platform !== "android") ui.toast(S.platform === "apple" ? "Choose where to save the photo" : "Photo saved"); // Android shows its own notice
      } catch (e) {
        console.error(e);
        ui.toast("Couldn't make the picture: " + e.message);
      } finally {
        sheet.style.transform = oldT;
        sheet.classList.remove("capturing");
        motionLayer.capture(false);
      }
    }

    return {
      async flush() {
        await save.flush();
      },
      async leave() {
        save.flush();
        closeVersePicker();
        document.removeEventListener("pointerdown", pickOutside, true);
        art.destroy();
        motionLayer && motionLayer.destroy();
        sheetRO.disconnect();
        document.removeEventListener("keydown", zoomKeys);
        window.removeEventListener("pagehide", flushNow);
        document.removeEventListener("visibilitychange", onHidden);
        side && side.destroy();
        hideBars();
        fmtBar && fmtBar.remove();
        document.removeEventListener("selectionchange", onSelChange);
      },
    };
  }

  S.day = { show };
})();
