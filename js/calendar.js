/* Month calendar: the reading plan. Click a planned day to open it, an empty day to plan it. */
(function () {
  const S = window.Selah;
  const { el } = S.ui;
  const ui = S.ui;

  async function show(host, arg) {
    const app = S.app;
    const index = app.index;
    const t = ui.today();
    const ym = arg && /^\d{4}-\d{2}/.test(arg) ? arg.slice(0, 7) : t.slice(0, 7);
    const [y, m] = ym.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const startDow = app.settings.startWeek || 0;
    const lead = (first.getDay() - startDow + 7) % 7;
    const gridStart = ui.addDays(ui.iso(first), -lead);
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells = Math.ceil((lead + daysInMonth) / 7) * 7;
    const monthHash = (dy, dm) => {
      const d = new Date(y, m - 1 + dm, 1);
      return "#/cal/" + ui.iso(d).slice(0, 7);
    };

    const dows = [...Array(7)].map((_, i) => ui.fmt(ui.addDays("2023-01-01", (i + startDow) % 7), { weekday: "short" }));
    const grid = el("div.cal-grid", {}, dows.map((d) => el("div.cal-dow", {}, d)));
    for (let i = 0; i < cells; i++) {
      const d = ui.addDays(gridStart, i);
      const s = index[d];
      const inMonth = d.slice(0, 7) === ym;
      grid.append(
        el("button.cal-day", {
          class: [!inMonth && "out", d === t && "today"].filter(Boolean).join(" "),
          title: s ? `${ui.longDate(d)} — ${s.ref}` : `Plan ${ui.longDate(d)}`,
          onclick: () => (s ? app.go("#/day/" + d) : app.planDialog(d)),
        },
          el("span.num", {}, +d.slice(8)),
          s ? el("span.ref", {}, s.ref) : el("span.add", {}, "+ plan"),
          s && s.done ? el("span.done", { title: "Reflection written" }) : null)
      );
    }

    const cal = el("section.card.cal", {},
      el("div.cal-head", {},
        el("h2.cal-title", {}, first.toLocaleDateString(undefined, { month: "long" }), el("small", {}, y)),
        el("div.cal-nav", {},
          el("button.icon-btn", { title: "Previous month", "aria-label": "Previous month", onclick: () => app.go(monthHash(0, -1)), html: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' }),
          el("button.btn.ghost", { onclick: () => app.go("#/cal/" + t.slice(0, 7)) }, "This month"),
          el("button.icon-btn", { title: "Next month", "aria-label": "Next month", onclick: () => app.go(monthHash(0, 1)), html: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' }))),
      grid);

    // side: today's verse, upcoming, S.E.L.A.H. key
    const todayS = index[t];
    const tr = app.settings.tr;
    const vod = todayS && (todayS.vod[tr] || Object.values(todayS.vod)[0]);
    const verseCard = el("section.card.verse-card", {},
      el("h3", {}, "Verse of the day"),
      vod
        ? [el("p.vt", {}, "“", vod.t, "”"), el("div.vr", {}, vod.r), el("div", { style: { marginTop: "12px" } }, el("button.btn.primary", { onclick: () => app.go("#/day/" + t) }, "Open today's page"))]
        : [el("p.muted", {}, "Nothing planned for today yet."), el("button.btn.primary", { onclick: () => app.planDialog(t) }, "Plan today")]);

    const upcoming = Object.keys(index).filter((d) => d >= t).sort().slice(0, 7);
    const upCard = el("section.card", {},
      el("h3", {}, "Coming up"),
      upcoming.length
        ? el("ul.up-list", {}, upcoming.map((d) => el("li", {}, el("button", { onclick: () => app.go("#/day/" + d) }, el("span.d", {}, d === t ? "Today" : ui.fmt(d, { weekday: "short", day: "numeric" })), el("span.r", {}, index[d].ref)))))
        : el("p.muted", { style: { margin: 0 } }, "Plan readings by clicking a date, or use “Plan many days” to read through a book."),
      el("div", { style: { marginTop: "10px" } }, el("button.btn", { onclick: () => app.bulkDialog() }, "Plan many days…")));

    const key = el("section.card", {},
      el("h3", {}, "Each day's page"),
      el("div.selah-key", {},
        el("div", {}, el("b", {}, "S"), "Scripture — let the word be set before you"),
        el("div", {}, el("b", {}, "E"), "Examine — ponder the truth revealed"),
        el("div", {}, el("b", {}, "L"), "Lesson — take hold of the teaching"),
        el("div", {}, el("b", {}, "A"), "Acknowledge — thanksgiving, confession, praise"),
        el("div", {}, el("b", {}, "H"), "Heart — meditate on it day and night")));

    host.append(el("div.cal-wrap", {}, cal, el("aside.side", {}, verseCard, upCard, key)));
    return {};
  }

  S.calendar = { show };
})();
