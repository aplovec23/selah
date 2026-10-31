/* One day's page: date, S.E.L.A.H. sections (Scripture + four writing areas), highlights, art layer. */
(function () {
  const S = window.Selah;
  const { el } = S.ui;
  const ui = S.ui;
  // translations saved with a day, in a steady order (older days may also have NIV/ESV/NLT from before)
  const ORDER = ["web", "kjv", "esv", "nlt", "niv"];
  const savedTr = (entry) => Object.keys(entry.verses || {}).sort((a, b) => (ORDER.indexOf(a) + 99) % 99 - (ORDER.indexOf(b) + 99) % 99);

  // The S.E.L.A.H. devotional flow (S is the passage itself, shown above these).
  const SCRIPTURE_HINT = "Let the word be set before you, that it may guide your steps.";
  const SECTIONS = [
    { k: "e", letter: "E", title: "Examine", hint: "Consider the meaning, and ponder the truth revealed.", ph: "What does this passage say? What truth stands out to you?" },
    { k: "l", letter: "L", title: "Lesson", hint: "Take hold of the teaching, that wisdom may dwell within you.", ph: "The lesson I'm taking hold of today…" },
    { k: "a", letter: "A", title: "Acknowledge", hint: "Lift up your prayer in thanksgiving, confession, and praise.", ph: "Lord, I thank you for…  I confess…  I praise you because…" },
    { k: "h", letter: "H", title: "Heart", hint: "Plant this truth deep within, and meditate upon it day and night.", ph: "Write, draw, or sit quietly with the words to carry in your heart…" },
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

  async function show(host, date) {
    const app = S.app;
    let entry = await app.getDay(date);
    if (!entry) {
      // nothing planned for this day yet: offer the three ways to start
      const isToday = date === ui.today();
      const choice = (icon, title, text, onclick, primary) =>
        el("button.start-choice", { class: primary ? "primary" : "", onclick }, el("span.ic", {}, icon), el("span", {}, el("b", {}, title), el("small", {}, text)));
      host.append(el("div.cal-wrap", { style: { display: "block", maxWidth: "560px" } },
        el("div.card.start-card", {},
          el("p.muted", { style: { margin: "0 0 2px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", fontSize: "12px" } }, ui.weekday(date)),
          el("h2", {}, ui.longDate(date)),
          el("p.muted", {}, isToday ? "Nothing planned for today yet. How would you like to start?" : "Nothing planned for this day yet."),
          el("div.start-choices", {},
            choice("📖", "Choose a passage", "Type a reference and download it (needs internet).", () => app.planDialog(date), true),
            choice("📋", "Paste a passage", "Paste from your Bible app or a website — works offline.", () => app.planDialog(date, null, { paste: true })),
            choice("✎", "Just journal", "A blank page to write freely, no passage.", async () => { await app.journalDay(date); app.go("#/day/" + date); })),
          el("div", { style: { marginTop: "14px" } }, el("button.btn.ghost", { onclick: () => app.go("#/cal/" + date.slice(0, 7)) }, "‹ Back to calendar")))));
      return {};
    }
    entry.sections = entry.sections || { e: "", l: "", a: "", h: "" };
    entry.hl = entry.hl || {};
    if (!entry.verses[entry.tr]) entry.tr = entry.verses[app.settings.tr] ? app.settings.tr : savedTr(entry)[0];
    const TR = savedTr(entry).map((id) => ({ id, name: S.bible.trInfo(id).name }));
    entry.sections.j = entry.sections.j || "";

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
    const planned = Object.keys(app.index).sort();
    const at = planned.indexOf(date);
    const prev = planned[at - 1], next = planned[at + 1];

    const guideSwitch = ui.toggle("S.E.L.A.H.", entry.guide !== false, (on) => setGuide(on), "S.E.L.A.H. guide on/off — off gives one open writing area");
    const trSeg = el("div.seg", { title: "Translation", hidden: TR.length < 2 }, TR.map((t) =>
      el("button", { class: t.id === entry.tr ? "on" : "", onclick: () => setTr(t.id) }, t.name)));
    const menuBtn = el("button.icon-btn", { title: "More", "aria-label": "More", html: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>' });
    menuBtn.onclick = () => ui.popover(menuBtn, (p, close) => {
      p.append(el("div", { style: { display: "grid", gap: "4px", minWidth: "200px" } },
        el("button.btn.ghost", { onclick: () => { close(); app.planDialog(date, entry); } }, "Change passage"),
        el("button.btn.ghost", { onclick: () => { close(); app.planDialog(date, entry, { paste: true }); } }, "Paste my own text"),
        el("button.btn.ghost", { onclick: () => { close(); setGuide(entry.guide === false); } },
          entry.guide === false ? "Use the S.E.L.A.H. guide" : "Free journal (turn off guide)"),
        el("button.btn.ghost", { onclick: () => { close(); savePhoto(); } }, "Save page as photo"),
        el("button.btn.ghost", { onclick: () => { close(); clearKey(); } }, "Clear verse of the day"),
        el("button.btn.ghost.danger", { onclick: async () => { close(); if (await ui.confirmBox("Delete this day?", `${ui.longDate(date)} — the passage, reflection, drawings and photos will be removed.`, "Delete", true)) { await app.removeDay(date); app.go("#/cal/" + date.slice(0, 7)); } } }, "Delete day")));
    }, { side: "below" });

    const top = el("div.day-top", {},
      el("button.btn.ghost", { onclick: () => app.go("#/cal/" + date.slice(0, 7)) }, "‹ Calendar"),
      el("button.icon-btn", { title: prev ? "Previous reading" : "", disabled: !prev, style: { opacity: prev ? 1 : 0.3 }, onclick: () => prev && app.go("#/day/" + prev), html: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' }),
      el("button.icon-btn", { title: next ? "Next reading" : "", disabled: !next, style: { opacity: next ? 1 : 0.3 }, onclick: () => next && app.go("#/day/" + next), html: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' }),
      el("span.spacer"),
      guideSwitch,
      trSeg,
      menuBtn,
      el("button.icon-btn.side-toggle", { title: "Companion panel: today, prayer list, memory verse", "aria-label": "Companion panel", onclick: () => side && side.toggle(), html: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14.5 4.5v15" stroke="currentColor" stroke-width="1.8"/></svg>' }));
    let side = null;
    // saving the page as a picture lives at the very bottom, out of the way while writing
    const bottom = el("div.day-bottom", {},
      el("button.btn.download", { onclick: () => savePhoto(), title: "Save this whole page as a picture",
        html: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Download page as photo' }));
    scroller.append(top, holder, bottom);
    const dayEl = el("div.day", {}, rail, scroller);
    host.append(dayEl);

    // ---------- page content ----------
    const scripture = el("div.scripture");
    const hasPassage = Object.keys(entry.verses || {}).length > 0;
    // Free journal style: one open writing area instead of E/L/A/H (both are kept; only one shows)
    function journalSection() {
      const w = el("div.write.journal-write", { contenteditable: "true", "data-ph": hasPassage ? "Write freely — thoughts, prayers, notes, anything on your heart…" : "Write freely…", "data-k": "j", spellcheck: "true", html: clean(entry.sections.j) });
      w.addEventListener("input", () => { entry.sections.j = w.innerHTML; save(); art.resize(); });
      w.addEventListener("paste", (e) => { e.preventDefault(); document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain")); });
      return el("section.sec.journal", { "data-anchor": "j" }, el("div.sec-h.plain", {}, el("h3", {}, "Journal")), w);
    }
    function applyGuide() {
      sheet.classList.toggle("free", entry.guide === false);
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
        el("div.sec-h", {}, el("span.letter", {}, "S"), el("div", {}, el("h3", {}, "Scripture ", el("span.ref-line", {}, "· " + entry.ref)), el("div.hint", {}, SCRIPTURE_HINT))),
        scripture,
        el("div.copyright", { "data-tr": "" })),
      SECTIONS.map((s) => {
        const w = el("div.write", { contenteditable: "true", "data-ph": s.ph, "data-k": s.k, spellcheck: "true", html: clean(entry.sections[s.k]) });
        w.addEventListener("input", () => {
          entry.sections[s.k] = w.innerHTML;
          save();
          art.resize(); // pinned drawings below follow the text
        });
        w.addEventListener("paste", (e) => {
          e.preventDefault();
          document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain"));
        });
        w.addEventListener("click", (e) => {
          const li = e.target.closest("ul.checks li");
          if (li && e.offsetX < 26) {
            li.classList.toggle("ok");
            entry.sections[s.k] = w.innerHTML;
            save();
          }
        });
        return el("section.sec.guided", { "data-anchor": s.k },
          el("div.sec-h", {}, el("span.letter", {}, s.letter), el("div", {}, el("h3", {}, s.title), el("div.hint", {}, s.hint))),
          w);
      }).concat(journalSection()));
    sheet.append(content);
    applyGuide();

    function applyBg() {
      const b = S.backgrounds.byId[entry.bg] || S.backgrounds.byId.cream;
      sheet.style.background = b.css;
      sheet.classList.toggle("dark-paper", !!b.dark);
    }
    applyBg();

    // ---------- scripture & highlights ----------
    const keyOf = (v) => `${v.b}:${v.c}:${v.v}`;
    function renderScripture() {
      const vs = entry.verses[entry.tr] || [];
      const marks = entry.hl[entry.tr] || [];
      const multiChapter = new Set(vs.map((v) => v.b + ":" + v.c)).size > 1;
      scripture.replaceChildren();
      let lastCh = null;
      for (const v of vs) {
        const chKey = v.b + ":" + v.c;
        if (multiChapter && chKey !== lastCh) scripture.append(el("span.chap", {}, `${S.bible.bookName(v.b).replace(/^Psalms$/, "Psalm")} ${v.c}`));
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
    function setKey(k) {
      const [b, c, v] = k.split(":").map(Number);
      entry.key = { b, c, v };
      window.getSelection().removeAllRanges();
      hideBars();
      renderScripture();
      app.saveDay(entry).then(() => side && side.refresh());
      ui.toast("Set as verse of the day — it shows in the widget");
    }
    function clearKey() {
      entry.key = null;
      renderScripture();
      app.saveDay(entry).then(() => side && side.refresh());
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
      hlBar = el("div.fmt", { onmousedown: keep },
        HL_COLORS.map((c) => el("button.hl", { title: "Highlight", style: { background: c }, onclick: () => applyMark(s.parts, c, "hl") })),
        el("span.sep"),
        el("button", { title: "Underline", onclick: () => applyMark(s.parts, HL_COLORS[0], "ul"), html: "<u>U</u>" }),
        el("button", { title: "Remove highlight", onclick: () => applyMark(s.parts, null) }, "⌫"),
        el("span.sep"),
        el("button", { title: "Make this the verse of the day (widget)", onclick: () => setKey(s.parts[0].k) }, "★ Verse of the day"));
      place(hlBar, s.rect);
    }
    const onSel = ui.debounce(showHlBar, 120);
    scripture.addEventListener("mouseup", onSel);
    scripture.addEventListener("touchend", onSel);
    document.addEventListener("selectionchange", onSelChange);
    function onSelChange() {
      const sel = window.getSelection();
      if (hlBar && (sel.isCollapsed || !scripture.contains(sel.anchorNode))) hideBars();
      if (sel.rangeCount && scripture.contains(sel.anchorNode) && !sel.isCollapsed && (window.matchMedia("(pointer: coarse)").matches)) onSel();
    }

    // reflection text tools
    function showFmt(w) {
      fmtBar && fmtBar.remove();
      const cmd = (c, v) => () => {
        document.execCommand("styleWithCSS", false, true);
        document.execCommand(c, false, v);
        w.dispatchEvent(new Event("input"));
      };
      const font = el("select", { title: "Font", onchange: (e) => { cmd("fontName", e.target.value)(); w.focus(); } },
        el("option", { value: "" }, "Font"), FONTS.map(([n, f]) => el("option", { value: f.replace(/"/g, "'") }, n)));
      const size = el("select", { title: "Size", onchange: (e) => { cmd("fontSize", e.target.value)(); w.focus(); } },
        el("option", { value: "" }, "Size"), [["2", "Small"], ["3", "Normal"], ["4", "Large"], ["5", "Larger"], ["6", "Title"]].map(([v, n]) => el("option", { value: v }, n)));
      fmtBar = el("div.fmt", { onmousedown: (e) => e.target.tagName !== "SELECT" && keep(e) },
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
        el("button", { title: "Clear formatting", onclick: cmd("removeFormat") }, "Tx"));
      document.body.append(fmtBar);
      positionFmt(w);
    }
    function positionFmt(w) {
      if (!fmtBar) return;
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
      if (fmtBar && !(document.activeElement && document.activeElement.classList.contains("write")) && !fmtBar.contains(document.activeElement)) {
        fmtBar.remove();
        fmtBar = null;
      }
    }, 150));
    scroller.addEventListener("scroll", () => {
      const w = document.activeElement;
      if (w && w.classList && w.classList.contains("write")) positionFmt(w);
      hideBars();
    });

    // ---------- scaling ----------
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
          }
        }
      },
    });

    renderScripture();
    fit();

    side = S.side.mount({
      date, entry, art,
      go: app.go,
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
        const canvas = await html2canvas(sheet, {
          scale: Math.min(2.5, 2200 / entry.width), backgroundColor: null, logging: false,
          width: sheet.offsetWidth, height: sheet.offsetHeight, windowWidth: Math.max(window.innerWidth, entry.width + 40),
        });
        const dataUrl = canvas.toDataURL("image/png");
        const name = `Selah ${date} ${entry.ref.replace(/[:;,]/g, ".").replace(/[\\/]/g, "-")}.png`;
        const ok = await S.store.raw("savePhoto", { name, dataUrl });
        if (ok !== false && S.platform !== "android") ui.toast(S.platform === "apple" ? "Choose where to save the photo" : "Photo saved"); // Android shows its own notice
      } catch (e) {
        console.error(e);
        ui.toast("Couldn't make the picture: " + e.message);
      } finally {
        sheet.style.transform = oldT;
        sheet.classList.remove("capturing");
      }
    }

    return {
      async leave() {
        save.flush();
        art.destroy();
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
