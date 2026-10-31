/* Companion panel beside a day's page: Today (mini calendar, verse, coming up, this page's highlights),
 * Prayer list and Memory verse.
 * Docked on wide screens; a slide-over drawer on smaller ones. */
(function () {
  const S = window.Selah;
  const { el } = S.ui;
  const ui = S.ui;

  const TABS = [
    { id: "today", name: "Today", icon: '<rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' },
    { id: "prayer", name: "Prayer", icon: '<path d="M12 4c-2 0-3 2-3 4v6l-3 4h12l-3-4V8c0-2-1-4-3-4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 4v14" stroke="currentColor" stroke-width="1.5"/>' },
    { id: "memory", name: "Memory", icon: '<path d="M12 6c-2-2-6-2-8 0v13c2-2 6-2 8 0 2-2 6-2 8 0V6c-2-2-6-2-8 0z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 6v13" stroke="currentColor" stroke-width="1.5"/>' },
  ];
  const svg = (b) => `<svg viewBox="0 0 24 24">${b}</svg>`;
  const pref = (k, d) => { try { return localStorage.getItem("selah." + k) ?? d; } catch { return d; } };
  const setPref = (k, v) => { try { localStorage.setItem("selah." + k, v); } catch {} };

  /**
   * ctx: { date, entry, art, go(hash), scrollToVerse(k) }
   * Returns { node, toggle(), refresh(), destroy() }.
   */
  function mount(ctx) {
    const app = S.app;
    let tab = pref("sideTab", "today");
    if (!["today", "prayer", "memory"].includes(tab)) tab = "today";
    const body = el("div.side-body");
    const tabsRow = el("div.side-tabs", {}, TABS.map((t) =>
      el("button", { class: t.id === tab ? "on" : "", title: t.name, onclick: () => show(t.id), html: svg(t.icon) + `<span>${t.name}</span>` })));
    const closeBtn = el("button.icon-btn.side-close", { title: "Hide panel", "aria-label": "Hide panel", onclick: () => toggle(false), html: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' });
    const node = el("aside.companion", {}, el("div.side-head", {}, tabsRow, closeBtn), body);

    function show(id) {
      tab = id;
      setPref("sideTab", id);
      [...tabsRow.children].forEach((b, i) => b.classList.toggle("on", TABS[i].id === id));
      render();
    }
    function render() {
      body.replaceChildren();
      (({ today: renderToday, prayer: renderPrayer, memory: renderMemory })[tab] || renderToday)();
    }

    // ---------- Today ----------
    let viewYM = ctx.date.slice(0, 7); // month shown in the mini calendar
    function renderToday() {
      const index = app.index;
      const [y, m] = viewYM.split("-").map(Number);
      const first = new Date(y, m - 1, 1);
      const startDow = app.settings.startWeek || 0;
      const lead = (first.getDay() - startDow + 7) % 7;
      const start = ui.addDays(ui.iso(first), -lead);
      const cells = Math.ceil((lead + new Date(y, m, 0).getDate()) / 7) * 7;
      const t = ui.today();
      const grid = el("div.mini-cal", {},
        [...Array(7)].map((_, i) => el("span.dow", {}, ui.fmt(ui.addDays("2023-01-01", (i + startDow) % 7), { weekday: "narrow" }))));
      for (let i = 0; i < cells; i++) {
        const d = ui.addDays(start, i);
        grid.append(el("button", {
          class: [d.slice(0, 7) !== viewYM && "out", index[d] && "has", d === t && "today", d === ctx.date && "cur"].filter(Boolean).join(" "),
          title: index[d] ? `${ui.shortDate(d)} — ${index[d].ref || "Journal"}` : ui.shortDate(d),
          onclick: () => (index[d] ? ctx.go("#/day/" + d) : app.planDialog(d)),
        }, +d.slice(8)));
      }
      const s = index[ctx.date];
      const v = s && (s.vod[ctx.entry.tr] || s.vod[app.settings.tr] || Object.values(s.vod)[0]);
      const upcoming = Object.keys(index).filter((d) => d > ctx.date).sort().slice(0, 5);

      const marks = (ctx.entry.hl[ctx.entry.tr] || []).slice().sort((a, b) => {
        const [ab, ac, av] = a.k.split(":").map(Number), [bb, bc, bv] = b.k.split(":").map(Number);
        return ab - bb || ac - bc || av - bv || a.s - b.s;
      });
      const verses = ctx.entry.verses[ctx.entry.tr] || [];
      const hlList = marks.map((mk) => {
        const [b, c, vv] = mk.k.split(":").map(Number);
        const vs = verses.find((x) => x.b === b && x.c === c && x.v === vv);
        const text = vs ? vs.t.slice(mk.s, mk.e) : "";
        return el("li", {}, el("button", { onclick: () => ctx.scrollToVerse(mk.k) },
          el("span.chip", { style: mk.kind === "ul" ? { borderBottom: "3px solid " + mk.color, background: "none" } : { background: mk.color } }),
          el("span", {}, el("b", {}, `${c}:${vv} `), "“", text, "”")));
      });

      body.append(
        el("section.side-card", {},
          el("div.mini-head", {},
            el("button.icon-btn", { title: "Previous month", "aria-label": "Previous month", onclick: () => stepMonth(-1), html: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' }),
            el("button.side-title.mini-month", { title: "Back to this page's month", onclick: () => { viewYM = ctx.date.slice(0, 7); render(); } }, first.toLocaleDateString(undefined, { month: "long", year: "numeric" })),
            el("button.icon-btn", { title: "Next month", "aria-label": "Next month", onclick: () => stepMonth(1), html: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' })),
          grid),
        v ? el("section.side-card.vod", {},
          el("div.side-title", {}, ctx.entry.key ? "★ Verse of the day" : "Verse of the day"),
          el("p.vt", {}, "“", v.t, "”"), el("div.vr", {}, v.r),
          !ctx.entry.key ? el("p.muted.small", {}, "Tip: select words in the passage and tap ★ to choose a different verse.") : null) : null,
        el("section.side-card", {},
          el("div.side-title", {}, `Highlights on this page`),
          hlList.length ? el("ul.hl-list", {}, hlList) : el("p.muted.small", {}, "Select words in the passage to highlight them — they'll be collected here.")),
        el("section.side-card", {},
          el("div.side-title", {}, "Coming up"),
          upcoming.length
            ? el("ul.up-list", {}, upcoming.map((d) => el("li", {}, el("button", { onclick: () => ctx.go("#/day/" + d) }, el("span.d", {}, ui.fmt(d, { weekday: "short", day: "numeric" })), el("span.r", {}, index[d].ref || "✎ Journal")))))
            : el("p.muted.small", {}, "Nothing planned after this day."),
          el("button.btn", { style: { marginTop: "8px" }, onclick: () => app.planDialog(ui.addDays(ctx.date, 1)) }, "＋ Plan the next day"))
      );
    }

    function stepMonth(n) {
      const [y, m] = viewYM.split("-").map(Number);
      viewYM = ui.iso(new Date(y, m - 1 + n, 1)).slice(0, 7);
      render();
    }

    // ---------- Prayer list (shared by all days) ----------
    async function renderPrayer() {
      const list = (await S.store.get("prayers")) || [];
      const save = () => S.store.set("prayers", list);
      const input = el("textarea.input", { rows: 2, placeholder: "Add a prayer request…" });
      const add = () => {
        const text = input.value.trim();
        if (!text) return;
        list.unshift({ id: ui.uid(), text, added: ctx.date, answered: null });
        save().then(render);
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          add();
        }
      });
      const item = (p) => el("li.prayer", { class: p.answered ? "answered" : "" },
        el("button.check", { title: p.answered ? "Mark as still praying" : "Mark as answered", onclick: () => { p.answered = p.answered ? null : ctx.date; save().then(render); } }, p.answered ? "✓" : ""),
        el("div", {}, el("div.ptext", {}, p.text),
          el("div.pmeta", {}, p.answered ? `Answered ${ui.shortDate(p.answered)} · prayed since ${ui.shortDate(p.added)}` : `Since ${ui.shortDate(p.added)}`)),
        el("button.pdel", { title: "Remove", onclick: async () => { if (await ui.confirmBox("Remove this prayer?", p.text, "Remove", true)) { list.splice(list.indexOf(p), 1); save().then(render); } } }, "×"));
      const open = list.filter((p) => !p.answered), done = list.filter((p) => p.answered);
      body.append(
        el("section.side-card", {},
          el("div.side-title", {}, "Prayer list"),
          el("p.muted.small", { style: { marginTop: 0 } }, "Shared across every day. Tick a request when God answers it."),
          input, el("div", { style: { textAlign: "right", marginTop: "6px" } }, el("button.btn.primary", { onclick: add }, "Add")),
          open.length ? el("ul.prayers", {}, open.map(item)) : el("p.muted.small", {}, "No open requests.")),
        done.length ? el("section.side-card", {}, el("div.side-title", {}, `Answered (${done.length})`), el("ul.prayers", {}, done.map(item))) : null
      );
    }

    // ---------- Memory verse ----------
    async function renderMemory() {
      const mem = await S.store.get("memory");
      const setFrom = async (ref, verses) => {
        const text = verses.map((v) => v.t).filter(Boolean).join(" ");
        if (!text) return ui.toast("That verse isn't in this translation");
        await S.store.set("memory", { ref, text, tr: ctx.entry.tr, since: ctx.date, level: 0 });
        render();
      };
      const fromPage = async () => {
        const vs = ctx.entry.verses[ctx.entry.tr] || [];
        const k = ctx.entry.key;
        const v = (k && vs.find((x) => x.b === k.b && x.c === k.c && x.v === k.v)) || vs.find((x) => x.t);
        if (!v) return;
        await setFrom(`${S.bible.bookName(v.b).replace(/^Psalms$/, "Psalm")} ${v.c}:${v.v}`, [v]);
      };
      const refIn = el("input.input", { placeholder: "or type a reference, e.g. Joshua 1:9" });
      const fromRef = async () => {
        const { ranges, errors } = S.bible.parse(refIn.value);
        if (errors.length || !ranges.length) return ui.toast(errors[0] || "Type a verse reference");
        if (S.bible.verseCount(ranges) > 8) return ui.toast("Pick a short passage (up to 8 verses)");
        await setFrom(S.bible.label(ranges), await S.bible.verses(ranges, ctx.entry.tr));
      };
      refIn.addEventListener("keydown", (e) => e.key === "Enter" && fromRef());
      const chooser = el("div", {},
        el("button.btn", { onclick: fromPage }, ctx.entry.key ? "Use this page's ★ verse" : "Use this page's first verse"),
        el("div.row", { style: { marginTop: "8px" } }, refIn, el("button.btn", { onclick: fromRef }, "Set")));

      if (!mem) {
        body.append(el("section.side-card", {}, el("div.side-title", {}, "Memory verse"),
          el("p.muted.small", { style: { marginTop: 0 } }, "Choose a verse to carry with you. Practice by hiding words until you can say it all."), chooser));
        return;
      }
      let level = mem.level || 0;
      const words = mem.text.split(/\s+/);
      const hidden = (i) => {
        if (!level) return false;
        const w = words[i].replace(/[^\p{L}']/gu, "");
        if (w.length < 2) return false;
        const h = ((i + 1) * 2654435761) % 100;
        return h < level;
      };
      const textBox = el("p.mem-text");
      const draw = () => {
        textBox.replaceChildren(...words.map((w, i) => {
          if (!hidden(i)) return document.createTextNode(w + " ");
          const sp = el("span.blank", { title: "Tap to peek" }, w.replace(/\p{L}/gu, "_"));
          sp.onclick = () => { sp.textContent = w; sp.classList.add("peek"); };
          return [sp, " "];
        }).flat());
      };
      const slider = el("input", { type: "range", min: 0, max: 100, step: 25, value: level, oninput: (e) => { level = +e.target.value; mem.level = level; S.store.set("memory", mem); levelName.textContent = names[level]; draw(); } });
      const names = { 0: "Read it", 25: "A few words hidden", 50: "Half hidden", 75: "Most hidden", 100: "All hidden" };
      const levelName = el("span", {}, names[level]);
      draw();
      body.append(
        el("section.side-card.memory", {},
          el("div.side-title", {}, "Memory verse"),
          el("div.mem-ref", {}, mem.ref, el("span.muted", {}, ` · ${S.bible.trInfo(mem.tr).name}`)),
          textBox,
          el("label.slider", {}, "Practice", slider), el("div.muted.small", {}, levelName),
          el("p.muted.small", {}, `Since ${ui.shortDate(mem.since)}`)),
        el("section.side-card", {}, el("div.side-title", {}, "Choose another verse"), chooser));
    }

    // ---------- open / closed ----------
    const docked = () => window.matchMedia("(min-width: 1180px)").matches;
    let open = docked() ? pref("sideOpen", "1") === "1" : false;
    function toggle(v) {
      open = v === undefined ? !open : v;
      if (docked()) setPref("sideOpen", open ? "1" : "0");
      node.closest(".day") && node.closest(".day").classList.toggle("side-open", open);
      if (open) render();
    }

    // as a slide-over (smaller screens), a tap outside closes it
    const outside = (e) => {
      if (!open || docked() || node.contains(e.target) || e.target.closest(".side-toggle, .overlay, .pop")) return;
      toggle(false);
    };
    document.addEventListener("pointerdown", outside, true);

    return {
      node,
      init() { toggle(open); },
      toggle,
      refresh() { if (open && tab === "today") render(); },
      destroy() { document.removeEventListener("pointerdown", outside, true); },
    };
  }

  S.side = { mount };
})();
