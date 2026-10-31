/* Art layer for a day page: drawing tools, shapes, eraser, stickers, washi tape, photos, backgrounds, undo.
 *
 * Coordinates are in the page's own pixels (the page has a fixed width per day and is
 * scaled to fit the screen), so drawings stay put across window sizes and devices.
 */
(function () {
  const S = window.Selah;
  const { el, ui } = { el: S.ui.el, ui: S.ui };

  const INK = ["#2e2a25", "#5b3a29", "#c0392b", "#e67e22", "#d4a017", "#2f7a46", "#1f6f8b", "#2c4a6e", "#5a46c2", "#b5467f", "#7d8fa3", "#ffffff"];
  const HL = ["#fff176", "#ffd180", "#f8bbd0", "#b9f6ca", "#b3e5fc", "#d1c4e9"];
  const TOOLS = {
    pen: { name: "Pen", size: 3, op: 1, icon: '<path d="M4 20l4-1 11-11-3-3L5 16z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 7l3 3" stroke="currentColor" stroke-width="1.8"/>' },
    pencil: { name: "Pencil", size: 2, op: 0.85, icon: '<path d="M5 19l2-6 9-9 4 4-9 9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 19l2-6 4 4z" fill="currentColor" opacity=".35"/>' },
    marker: { name: "Marker", size: 8, op: 0.95, icon: '<path d="M7 17l-2 4h5l1-2M7 17l9-12 4 3-9 12z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' },
    highlighter: { name: "Highlighter", size: 20, op: 0.5, hl: true, icon: '<path d="M6 15l9-10 4 4-10 9zM6 15l-2 5 5-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 22h10" stroke="#e5b800" stroke-width="3" stroke-linecap="round"/>' },
    calligraphy: { name: "Calligraphy pen", size: 9, op: 1, icon: '<path d="M12 3l5 7-5 11-5-11z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="11" r="1.5" fill="currentColor"/>' },
    brush: { name: "Paint brush", size: 12, op: 0.9, icon: '<path d="M14 4l6 6-7 4-3-3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 11c-4 0-6 3-6 9 4 0 8-2 8-6" fill="currentColor" opacity=".4" stroke="currentColor" stroke-width="1.5"/>' },
    shape: { name: "Shapes", size: 3, op: 1, icon: '<rect x="3" y="11" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/>' },
    eraser: { name: "Eraser", size: 22, op: 1, icon: '<path d="M8 20l-4-4 10-10 6 6-8 8zM8 20h12M9 11l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' },
  };
  const SHAPES = ["line", "arrow", "rect", "ellipse", "heart", "star"];
  const ICON = {
    write: '<path d="M5 4h14M12 4v16M8 20h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
    color: "",
    sticker: '<path d="M5 4h10l4 4v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15 4v4h4M9 13c1 1.5 5 1.5 6 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9.5" cy="10" r="1" fill="currentColor"/><circle cx="14.5" cy="10" r="1" fill="currentColor"/>',
    tape: '<path d="M3 9l16-4 2 8-16 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 9l1 6M11 8l1.5 6M15 7l1.5 6" stroke="currentColor" stroke-width="1" opacity=".6"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="2" fill="currentColor"/><path d="M4 18l6-5 4 3 3-2 4 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    bg: '<rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 8h16M4 12h16M4 16h16" stroke="currentColor" stroke-width="1" opacity=".55"/>',
    undo: '<path d="M9 7L4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    redo: '<path d="M15 7l5 5-5 5M20 12H9a5 5 0 0 0 0 10h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  const svgIcon = (body) => `<svg viewBox="0 0 24 24">${body}</svg>`;

  // remembered per device (a convenience only)
  const PREF_KEY = "selah.art";
  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(PREF_KEY)) || {};
    } catch {
      return {};
    }
  }
  function savePrefs(p) {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(p));
    } catch {}
  }

  // ---------- stroke geometry ----------
  const r1 = (n) => Math.round(n * 10) / 10;

  function seeded(id) {
    let h = 0;
    for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return () => ((h = (h * 1103515245 + 12345) | 0), ((h >>> 16) & 0x7fff) / 0x7fff);
  }

  function shapePoints(s) {
    const { x1, y1, x2, y2 } = s;
    const out = [];
    const N = 48;
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
    switch (s.shape) {
      case "line":
      case "arrow":
        for (let i = 0; i <= 12; i++) out.push([x1 + ((x2 - x1) * i) / 12, y1 + ((y2 - y1) * i) / 12]);
        break;
      case "rect":
        for (const [a, b] of [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]) out.push([a, b]);
        break;
      case "ellipse":
        for (let i = 0; i <= N; i++) out.push([cx + rx * Math.cos((i / N) * 2 * Math.PI), cy + ry * Math.sin((i / N) * 2 * Math.PI)]);
        break;
      case "heart":
        for (let i = 0; i <= N; i++) {
          const t = (i / N) * 2 * Math.PI;
          const hx = 16 * Math.sin(t) ** 3, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          out.push([cx + (hx / 17) * rx, cy + ((hy + 2) / 17) * ry]);
        }
        break;
      case "star":
        for (let i = 0; i <= 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5, k = i % 2 ? 0.45 : 1;
          out.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]);
        }
        break;
    }
    return out;
  }

  function drawStroke(ctx, s) {
    ctx.save();
    ctx.globalAlpha = s.op ?? 1;
    ctx.strokeStyle = ctx.fillStyle = s.color;
    ctx.lineCap = ctx.lineJoin = "round";
    if (s.tool === "shape") {
      const pts = shapePoints(s);
      ctx.lineWidth = s.size;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (s.shape === "rect" || s.shape === "star") ctx.closePath();
      ctx.stroke();
      if (s.shape === "arrow") {
        const a = Math.atan2(s.y2 - s.y1, s.x2 - s.x1), L = Math.max(12, s.size * 4);
        ctx.beginPath();
        ctx.moveTo(s.x2 - L * Math.cos(a - 0.45), s.y2 - L * Math.sin(a - 0.45));
        ctx.lineTo(s.x2, s.y2);
        ctx.lineTo(s.x2 - L * Math.cos(a + 0.45), s.y2 - L * Math.sin(a + 0.45));
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    const p = s.pts;
    if (!p.length) return ctx.restore();
    if (p.length === 1) {
      ctx.beginPath();
      ctx.arc(p[0][0], p[0][1], s.size / 2, 0, Math.PI * 2);
      ctx.fill();
      return ctx.restore();
    }
    const smoothPath = () => {
      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length - 1; i++) {
        const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
        ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my);
      }
      ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
    };
    switch (s.tool) {
      case "marker":
      case "highlighter":
        ctx.lineWidth = s.size;
        if (s.tool === "highlighter") ctx.lineCap = "butt";
        smoothPath();
        ctx.stroke();
        break;
      case "pencil": {
        ctx.lineWidth = s.size;
        smoothPath();
        ctx.stroke();
        const rnd = seeded(s.id);
        ctx.globalAlpha = (s.op ?? 1) * 0.3;
        ctx.lineWidth = Math.max(0.6, s.size * 0.5);
        for (let k = 0; k < 2; k++) {
          ctx.beginPath();
          p.forEach(([x, y], i) => {
            const jx = x + (rnd() - 0.5) * s.size, jy = y + (rnd() - 0.5) * s.size;
            i ? ctx.lineTo(jx, jy) : ctx.moveTo(jx, jy);
          });
          ctx.stroke();
        }
        break;
      }
      case "calligraphy": {
        const nx = Math.cos(-Math.PI / 4) * (s.size / 2), ny = Math.sin(-Math.PI / 4) * (s.size / 2);
        ctx.lineWidth = 1;
        for (let i = 1; i < p.length; i++) {
          const [ax, ay] = p[i - 1], [bx, by] = p[i];
          ctx.beginPath();
          ctx.moveTo(ax + nx, ay + ny);
          ctx.lineTo(bx + nx, by + ny);
          ctx.lineTo(bx - nx, by - ny);
          ctx.lineTo(ax - nx, ay - ny);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        break;
      }
      case "brush":
      case "pen":
      default: {
        let w = s.size;
        for (let i = 1; i < p.length; i++) {
          const [ax, ay, ap = 0.5, at = 0] = p[i - 1], [bx, by, bp = 0.5, bt = 0] = p[i];
          let target;
          if (s.tool === "brush") {
            const speed = Math.hypot(bx - ax, by - ay) / Math.max(1, bt - at);
            target = s.size * Math.min(1.5, Math.max(0.3, 1.5 - speed * 0.6)) * (0.6 + bp * 0.8);
          } else target = s.size * (0.55 + ((ap + bp) / 2) * 0.9);
          w = w * 0.6 + target * 0.4;
          ctx.lineWidth = w;
          ctx.beginPath();
          if (i === 1) ctx.moveTo(ax, ay);
          else ctx.moveTo((p[i - 2][0] + ax) / 2, (p[i - 2][1] + ay) / 2);
          ctx.quadraticCurveTo(ax, ay, (ax + bx) / 2, (ay + by) / 2);
          if (i === p.length - 1) ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function hitsStroke(s, x, y, rad) {
    const pts = s.tool === "shape" ? shapePoints(s) : s.pts;
    const r = rad + (s.size || 2) / 2;
    for (let i = 0; i < pts.length; i++) {
      if (Math.hypot(pts[i][0] - x, pts[i][1] - y) < r) return true;
      if (i && distSeg(x, y, pts[i - 1], pts[i]) < r) return true;
    }
    return false;
  }
  function distSeg(x, y, [ax, ay], [bx, by]) {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
    return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
  }

  // ---------- photos ----------
  const photoCache = new Map();
  async function photoURL(id) {
    if (!photoCache.has(id)) photoCache.set(id, (await S.store.get("photo/" + id)) || "");
    return photoCache.get(id);
  }
  function shrinkImage(file, max = 1400, type = "image/jpeg") {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * k);
        c.height = Math.round(img.naturalHeight * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res({ data: type === "image/png" ? c.toDataURL("image/png") : c.toDataURL(type, 0.85), w: c.width, h: c.height });
      };
      img.onerror = () => rej(new Error("Couldn't open that image"));
      img.src = url;
    });
  }

  // ---------- "My stickers": PNGs the person adds ----------
  // List in "mystickers" ([{id, name, w, h}]), each image in "sticker/<id>". On a page an item's ref is "u:<id>".
  const myCache = new Map();
  async function myStickers() {
    return (await S.store.get("mystickers")) || [];
  }
  async function myStickerURL(id) {
    if (!myCache.has(id)) myCache.set(id, (await S.store.get("sticker/" + id)) || "");
    return myCache.get(id);
  }
  async function addMyStickers(files) {
    const list = await myStickers();
    const added = [];
    for (const f of files) {
      if (!/^image\//.test(f.type)) continue;
      const { data, w, h } = await shrinkImage(f, 600, "image/png");
      const id = ui.uid();
      await S.store.set("sticker/" + id, data);
      myCache.set(id, data);
      const st = { id, name: f.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Sticker", w, h };
      list.push(st);
      added.push(st);
    }
    await S.store.set("mystickers", list);
    return added;
  }
  async function removeMySticker(id) {
    await S.store.set("mystickers", (await myStickers()).filter((s) => s.id !== id));
    await S.store.del("sticker/" + id);
    myCache.delete(id);
  }

  /**
   * Attach the art layer to a page.
   * opts: { rail, sheet, entry, save(), viewCenter() -> {x,y}, scale() -> number, setBackground(id) }
   */
  function attach(opts) {
    const { rail, sheet, entry } = opts;
    entry.strokes = entry.strokes || [];
    entry.items = entry.items || [];
    const prefs = Object.assign(
      { tool: "write", ink: INK[0], hl: HL[0], shape: "rect", sizes: {}, ops: {} },
      loadPrefs()
    );
    let mode = prefs.tool;
    const sizeOf = (t) => prefs.sizes[t] ?? TOOLS[t].size;
    const opOf = (t) => prefs.ops[t] ?? TOOLS[t].op;
    const colorOf = (t) => (TOOLS[t] && TOOLS[t].hl ? prefs.hl : prefs.ink);

    // canvases
    const under = el("canvas.under");
    const ink = el("canvas.ink");
    const live = el("canvas.ink", { style: { zIndex: 5 } });
    const items = el("div.items");
    sheet.append(under, items, ink, live);
    const ctxU = under.getContext("2d"), ctxI = ink.getContext("2d"), ctxL = live.getContext("2d");
    let W = 0, H = 0, dpr = 1;

    // Drawings and items are pinned to the page section they start in ("top", "s", "e", "l", "a", "h"),
    // stored relative to that section's top, so they move along when text above them grows.
    let tops = {}, topsSig = "";
    function measureTops() {
      const t = {};
      sheet.querySelectorAll("[data-anchor]").forEach((n) => {
        if (!n.offsetParent && n !== sheet) return; // hidden section (e.g. guide turned off)
        let y = 0;
        for (let e = n; e && e !== sheet; e = e.offsetParent) y += e.offsetTop;
        t[n.dataset.anchor] = y;
      });
      tops = t;
      const sig = JSON.stringify(t);
      const changed = sig !== topsSig;
      topsSig = sig;
      return changed;
    }
    const topOf = (a) => (a && tops[a] !== undefined ? tops[a] : 0);
    const shown = (a) => !a || tops[a] !== undefined; // pinned to a section that is on screen
    function anchorAt(y) {
      let best = null, bestTop = -Infinity;
      for (const [a, t] of Object.entries(tops)) if (t <= y && t > bestTop) (best = a), (bestTop = t);
      return best || "top";
    }

    function resize() {
      const w = sheet.offsetWidth, h = sheet.offsetHeight;
      const moved = measureTops();
      if (w === W && h === H) {
        if (moved) {
          redraw();
          renderItems();
        }
        return;
      }
      W = w;
      H = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5, Math.sqrt(14e6 / (w * h)));
      for (const c of [under, ink, live]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
        c.style.width = w + "px";
        c.style.height = h + "px";
      }
      redraw();
    }
    function redraw() {
      for (const c of [ctxU, ctxI]) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, c.canvas.width, c.canvas.height);
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      for (const s of entry.strokes) drawPinned(s.tool === "highlighter" ? ctxU : ctxI, s);
    }
    function drawPinned(ctx, s) {
      if (!shown(s.a)) return;
      const dy = topOf(s.a);
      if (dy) {
        ctx.save();
        ctx.translate(0, dy);
        drawStroke(ctx, s);
        ctx.restore();
      } else drawStroke(ctx, s);
    }

    // ---------- history ----------
    const past = [], future = [];
    const snap = () => JSON.stringify({ s: entry.strokes, i: entry.items });
    function remember() {
      past.push(snap());
      if (past.length > 60) past.shift();
      future.length = 0;
      updateUndo();
    }
    function restore(json) {
      const o = JSON.parse(json);
      entry.strokes = o.s;
      entry.items = o.i;
      redraw();
      renderItems();
      opts.save();
    }
    function undo() {
      if (!past.length) return;
      future.push(snap());
      restore(past.pop());
      updateUndo();
    }
    function redo() {
      if (!future.length) return;
      past.push(snap());
      restore(future.pop());
      updateUndo();
    }

    // ---------- pointer drawing ----------
    let cur = null, erasing = false, penSeen = false, activeId = null;
    const pos = (e) => {
      const r = sheet.getBoundingClientRect(), k = opts.scale();
      return [(e.clientX - r.left) / k, (e.clientY - r.top) / k];
    };
    live.addEventListener("pointerdown", (e) => {
      if (mode === "write") return;
      if (e.pointerType === "pen") {
        penSeen = true;
        live.style.touchAction = "pan-x pan-y"; // fingers scroll, the pencil draws
      }
      if (e.pointerType === "touch" && penSeen) return;
      if (e.pointerType === "touch" && !e.isPrimary) {
        // a second finger means pinch, not drawing: drop the stroke just started
        cur = null;
        activeId = null;
        clearLive();
        return;
      }
      if (e.button > 0) return;
      e.preventDefault();
      live.setPointerCapture(e.pointerId);
      activeId = e.pointerId;
      const [x, y] = pos(e);
      if (mode === "eraser") {
        erasing = true;
        remember();
        eraseAt(x, y);
        return;
      }
      if (mode === "shape") cur = { id: ui.uid(), tool: "shape", shape: prefs.shape, color: prefs.ink, size: sizeOf("shape"), op: opOf("shape"), x1: r1(x), y1: r1(y), x2: r1(x), y2: r1(y) };
      else cur = { id: ui.uid(), tool: mode, color: colorOf(mode), size: sizeOf(mode), op: opOf(mode), pts: [[r1(x), r1(y), r1(e.pressure || 0.5), Math.round(e.timeStamp)]] };
      drawLive();
    });
    live.addEventListener("pointermove", (e) => {
      if (e.pointerId !== activeId) return;
      if (erasing) {
        const [x, y] = pos(e);
        eraseAt(x, y);
        return;
      }
      if (!cur) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      if (cur.tool === "shape") {
        let [x, y] = pos(e);
        if (e.shiftKey && cur.shape !== "line" && cur.shape !== "arrow") {
          const d = Math.max(Math.abs(x - cur.x1), Math.abs(y - cur.y1));
          x = cur.x1 + Math.sign(x - cur.x1 || 1) * d;
          y = cur.y1 + Math.sign(y - cur.y1 || 1) * d;
        }
        cur.x2 = r1(x);
        cur.y2 = r1(y);
      } else {
        for (const ev of evs.length ? evs : [e]) {
          const [x, y] = pos(ev);
          const last = cur.pts[cur.pts.length - 1];
          if (Math.hypot(x - last[0], y - last[1]) < 0.8) continue;
          cur.pts.push([r1(x), r1(y), r1(ev.pressure || (ev.pointerType === "mouse" ? 0.5 : 0.5)), Math.round(ev.timeStamp)]);
        }
      }
      drawLive();
    });
    const end = (e) => {
      if (e.pointerId !== activeId) return;
      activeId = null;
      if (erasing) {
        erasing = false;
        hideEraser();
        opts.save();
        return;
      }
      if (!cur) return;
      const s = cur;
      cur = null;
      clearLive();
      if (s.tool === "shape" && Math.hypot(s.x2 - s.x1, s.y2 - s.y1) < 4) return;
      remember();
      if (s.pts) {
        // only the brush needs timings (its width follows speed); keep them relative to the start
        const t0 = s.pts[0][3] || 0;
        s.pts = s.pts.map(([x, y, p, t]) => (s.tool === "brush" ? [x, y, p, t - t0] : [x, y, p]));
      }
      measureTops();
      s.a = anchorAt(s.tool === "shape" ? Math.min(s.y1, s.y2) : s.pts[0][1]);
      const dy = topOf(s.a);
      if (s.tool === "shape") {
        s.y1 = r1(s.y1 - dy);
        s.y2 = r1(s.y2 - dy);
      } else s.pts = s.pts.map(([x, y, ...rest]) => [x, r1(y - dy), ...rest]);
      entry.strokes.push(s);
      drawPinned(s.tool === "highlighter" ? ctxU : ctxI, s);
      opts.save();
    };
    live.addEventListener("pointerup", end);
    live.addEventListener("pointercancel", end);
    // iPad/iPhone Safari can still turn a drawing stroke into a scroll on a scaled page;
    // block that while drawing (fingers still scroll once an Apple Pencil has been used).
    const stopScroll = (e) => {
      if (mode === "write" || e.touches.length > 1) return; // two fingers = pinch zoom
      if (penSeen && [...e.touches].every((t) => t.touchType !== "stylus")) return;
      e.preventDefault();
    };
    live.addEventListener("touchstart", stopScroll, { passive: false });
    live.addEventListener("touchmove", stopScroll, { passive: false });

    function clearLive() {
      ctxL.setTransform(1, 0, 0, 1, 0, 0);
      ctxL.clearRect(0, 0, live.width, live.height);
      ctxL.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function drawLive() {
      clearLive();
      if (cur) {
        if (cur.tool === "highlighter") {
          ctxL.save();
          ctxL.globalCompositeOperation = "multiply";
          drawStroke(ctxL, cur);
          ctxL.restore();
        } else drawStroke(ctxL, cur);
      }
    }
    function eraseAt(x, y) {
      const rad = sizeOf("eraser") / 2;
      const before = entry.strokes.length;
      entry.strokes = entry.strokes.filter((s) => !shown(s.a) || !hitsStroke(s, x, y - topOf(s.a), rad));
      if (entry.strokes.length !== before) redraw();
      clearLive();
      ctxL.save();
      ctxL.strokeStyle = "#0006";
      ctxL.setLineDash([4, 3]);
      ctxL.beginPath();
      ctxL.arc(x, y, rad, 0, Math.PI * 2);
      ctxL.stroke();
      ctxL.restore();
    }
    const hideEraser = clearLive;

    // ---------- items (stickers, tape, photos) ----------
    let selected = null;
    function renderItems() {
      items.replaceChildren();
      for (const it of entry.items) items.append(itemNode(it));
    }
    function itemNode(it) {
      const n = el("div.item", { class: it.kind + (it.frame ? " frame-" + it.frame : "") + (selected === it.id ? " sel" : ""), dataset: { id: it.id } });
      Object.assign(n.style, { left: it.x + "px", top: topOf(it.a) + it.y + "px", width: it.w + "px", height: it.h + "px", transform: `rotate(${it.rot || 0}deg)` });
      if (!shown(it.a)) n.style.display = "none";
      if (it.kind === "sticker" && String(it.ref).startsWith("u:")) {
        const img = el("img", { alt: "sticker", draggable: "false" });
        myStickerURL(it.ref.slice(2)).then((u) => (u ? (img.src = u) : (n.style.display = "none"))); // removed sticker: hide
        n.append(img);
      } else if (it.kind === "sticker") {
        const st = S.stickers.byId[it.ref];
        n.append(el("img", { src: st ? S.stickers.url(st.svg) : "", alt: st ? st.name : "sticker", draggable: "false" }));
      } else if (it.kind === "tape") {
        const tp = S.stickers.tapeById[it.ref];
        n.style.background = tp ? tp.css : "#eee";
      } else if (it.kind === "photo") {
        const img = el("img", { alt: "photo", draggable: "false" });
        photoURL(it.ref).then((u) => (img.src = u));
        n.append(img);
      }
      const del = el("span.h.del", { title: "Remove" }, "×");
      const rs = el("span.h.rs", { title: "Resize" }, "⤡");
      const rt = el("span.h.rt", { title: "Rotate" }, "↻");
      n.append(del, rs, rt);
      if (it.kind === "photo") {
        const fr = el("span.h", { title: "Change frame", style: { left: "-15px", top: "-15px" } }, "▢");
        fr.addEventListener("pointerdown", (e) => {
          e.stopPropagation();
          remember();
          const order = ["plain", "polaroid", "round"];
          it.frame = order[(order.indexOf(it.frame || "plain") + 1) % order.length];
          renderItems();
          opts.save();
        });
        n.append(fr);
      }
      del.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        removeItem(it);
      });
      n.addEventListener("pointerdown", (e) => startDrag(e, it, e.target === rs ? "resize" : e.target === rt ? "rotate" : "move"));
      return n;
    }
    function select(id) {
      selected = id;
      items.querySelectorAll(".item").forEach((n) => n.classList.toggle("sel", n.dataset.id === id));
    }
    function removeItem(it) {
      remember();
      entry.items = entry.items.filter((x) => x !== it); // photo data stays stored so Undo can bring it back
      selected = null;
      renderItems();
      opts.save();
    }
    function startDrag(e, it, kind) {
      if (mode !== "write") return;
      e.preventDefault();
      e.stopPropagation();
      const node = e.currentTarget;
      node.setPointerCapture(e.pointerId);
      // bring to front
      if (entry.items[entry.items.length - 1] !== it) {
        entry.items = entry.items.filter((x) => x !== it).concat(it);
        items.append(node);
      }
      select(it.id);
      const k = opts.scale();
      const sx = e.clientX, sy = e.clientY;
      const o = { x: it.x, y: it.y, w: it.w, h: it.h, rot: it.rot || 0, a: it.a };
      const base = topOf(it.a);
      const cx = it.x + it.w / 2, cy = base + it.y + it.h / 2;
      let moved = false, saved = false;
      const mv = (ev) => {
        const dx = (ev.clientX - sx) / k, dy = (ev.clientY - sy) / k;
        if (!moved && Math.hypot(dx, dy) < 2) return;
        if (!saved) {
          saved = true;
          past.push(JSON.stringify({ s: entry.strokes, i: entry.items.map((x) => (x === it ? { ...x, ...o } : x)) }));
          future.length = 0;
          updateUndo();
        }
        moved = true;
        if (kind === "move") {
          it.x = r1(o.x + dx);
          it.y = r1(o.y + dy);
        } else if (kind === "resize") {
          const ratio = o.h / o.w;
          const nw = Math.max(24, o.w + Math.max(dx, dy / ratio));
          it.w = r1(nw);
          it.h = r1(it.kind === "tape" ? Math.max(14, o.h + dy) : nw * ratio);
          if (it.kind === "tape") it.w = r1(Math.max(30, o.w + dx));
        } else {
          const r = sheet.getBoundingClientRect();
          const px = (ev.clientX - r.left) / k, py = (ev.clientY - r.top) / k;
          let a = (Math.atan2(py - cy, px - cx) * 180) / Math.PI + 90;
          if (ev.shiftKey) a = Math.round(a / 15) * 15;
          it.rot = Math.round(a);
        }
        Object.assign(node.style, { left: it.x + "px", top: base + it.y + "px", width: it.w + "px", height: it.h + "px", transform: `rotate(${it.rot || 0}deg)` });
      };
      const up = () => {
        node.removeEventListener("pointermove", mv);
        node.removeEventListener("pointerup", up);
        node.removeEventListener("pointercancel", up);
        if (moved) {
          // re-pin to whichever section the item now sits in
          const absY = base + it.y;
          it.a = anchorAt(absY + it.h / 2);
          it.y = r1(absY - topOf(it.a));
          opts.save();
        }
      };
      node.addEventListener("pointermove", mv);
      node.addEventListener("pointerup", up);
      node.addEventListener("pointercancel", up);
    }
    const deselect = (e) => {
      if (selected && !e.target.closest(".item")) select(null);
    };
    document.addEventListener("pointerdown", deselect, true);
    const onKey = (e) => {
      const typing = e.target.closest && e.target.closest("[contenteditable],input,textarea,select");
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !typing) {
        const it = entry.items.find((x) => x.id === selected);
        if (it) {
          e.preventDefault();
          removeItem(it);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
    };
    document.addEventListener("keydown", onKey);

    /** Put a sticker/tape/photo on the page: at a screen point (drag from the tray) or near the middle of the view. */
    function addItem(it, at) {
      let c, jitter = 40;
      if (at) {
        const r = sheet.getBoundingClientRect(), k = opts.scale();
        c = { x: (at.clientX - r.left) / k, y: (at.clientY - r.top) / k };
        jitter = 0;
      } else c = opts.viewCenter();
      it.id = ui.uid();
      it.x = r1(Math.max(4, Math.min(W - it.w - 4, c.x - it.w / 2 + (Math.random() - 0.5) * jitter)));
      const absY = Math.max(4, c.y - it.h / 2 + (Math.random() - 0.5) * jitter);
      measureTops();
      it.a = anchorAt(absY + it.h / 2);
      it.y = r1(absY - topOf(it.a));
      it.rot = it.rot ?? Math.round((Math.random() - 0.5) * 12);
      remember();
      entry.items.push(it);
      setMode("write");
      renderItems();
      select(it.id);
      opts.save();
    }

    // ---------- rail ----------
    const toolBtns = {};
    const tool = (id, tip, body, onclick) => {
      const b = el("button.tool", { "data-tip": tip, "aria-label": tip, html: svgIcon(body), onclick });
      toolBtns[id] = b;
      return b;
    };
    const colorDot = el("span.dot");
    const colorBtn = el("button.tool", { "data-tip": "Color & size", "aria-label": "Color and size", html: svgIcon('<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.6" fill="currentColor"/><circle cx="14" cy="9" r="1.6" fill="currentColor"/><circle cx="15.5" cy="13.5" r="1.6" fill="currentColor"/>') }, colorDot);
    colorBtn.onclick = () => colorPop(colorBtn);
    const undoBtn = tool("undo", "Undo", ICON.undo, undo);
    const redoBtn = tool("redo", "Redo", ICON.redo, redo);
    const photoIn = el("input", { type: "file", accept: "image/*", hidden: true, multiple: true });
    photoIn.onchange = async () => {
      for (const f of photoIn.files) {
        try {
          const { data, w, h } = await shrinkImage(f);
          const id = ui.uid();
          await S.store.set("photo/" + id, data);
          photoCache.set(id, data);
          const bw = Math.min(260, W * 0.5);
          addItem({ kind: "photo", ref: id, w: bw, h: r1((bw * h) / w), frame: "polaroid" });
        } catch (err) {
          ui.toast(err.message);
        }
      }
      photoIn.value = "";
    };

    rail.replaceChildren(
      tool("write", "Type & select", ICON.write, () => setMode("write")),
      ...Object.entries(TOOLS).map(([id, t]) => tool(id, t.name, t.icon, () => (mode === id && id === "shape" ? shapePop(toolBtns.shape) : setMode(id)))),
      el("div.sep"),
      colorBtn,
      tool("sticker", "Stickers", ICON.sticker, (e) => stickerPop(e.currentTarget)),
      tool("tape", "Washi tape", ICON.tape, (e) => tapePop(e.currentTarget)),
      tool("photo", "Attach photo", ICON.photo, () => photoIn.click()),
      tool("bg", "Page background", ICON.bg, (e) => bgPop(e.currentTarget)),
      el("div.sep"),
      undoBtn,
      redoBtn,
      photoIn
    );

    function setMode(m) {
      mode = m;
      prefs.tool = m === "eraser" ? prefs.tool : m;
      savePrefs(prefs);
      for (const [id, b] of Object.entries(toolBtns)) if (id in TOOLS || id === "write") b.classList.toggle("on", id === m);
      sheet.classList.toggle("drawing", m !== "write");
      live.style.pointerEvents = m === "write" ? "none" : "auto";
      if (m !== "write") {
        select(null);
        if (document.activeElement && document.activeElement.isContentEditable) document.activeElement.blur();
      }
      colorDot.style.background = m in TOOLS ? (m === "eraser" ? "transparent" : colorOf(m)) : prefs.ink;
      opts.onMode && opts.onMode(m);
    }
    function updateUndo() {
      undoBtn.disabled = !past.length;
      redoBtn.disabled = !future.length;
      undoBtn.style.opacity = past.length ? 1 : 0.35;
      redoBtn.style.opacity = future.length ? 1 : 0.35;
    }

    // ---------- popovers ----------
    function colorPop(anchor) {
      const t = mode in TOOLS && mode !== "eraser" ? mode : "pen";
      const isHL = !!TOOLS[t].hl;
      ui.popover(anchor, (p) => {
        const list = isHL ? HL : INK;
        const cur = isHL ? prefs.hl : prefs.ink;
        const sws = el("div.swatches", {}, list.map((c) => el("button.sw", { class: c === cur ? "on" : "", style: { background: c }, title: c, onclick: () => pick(c) })),
          el("label.sw.custom", { title: "Any color" }, el("input", { type: "color", value: cur, oninput: (e) => pick(e.target.value) })));
        function pick(c) {
          if (isHL) prefs.hl = c;
          else prefs.ink = c;
          savePrefs(prefs);
          sws.querySelectorAll(".sw").forEach((b) => b.classList.toggle("on", b.title === c));
          colorDot.style.background = c;
          if (!(mode in TOOLS) || mode === "eraser") setMode(isHL ? "highlighter" : "pen");
        }
        const size = el("input", { type: "range", min: 1, max: t === "highlighter" ? 48 : 40, value: sizeOf(t), oninput: (e) => { prefs.sizes[t] = +e.target.value; savePrefs(prefs); sizeVal.textContent = e.target.value; } });
        const sizeVal = el("span", {}, sizeOf(t));
        const op = el("input", { type: "range", min: 10, max: 100, value: Math.round(opOf(t) * 100), oninput: (e) => { prefs.ops[t] = +e.target.value / 100; savePrefs(prefs); opVal.textContent = e.target.value + "%"; } });
        const opVal = el("span", {}, Math.round(opOf(t) * 100) + "%");
        p.append(el("h4", {}, `${TOOLS[t].name} color`), sws,
          el("h4", { style: { marginTop: "14px" } }, "Size & opacity"),
          el("label.slider", {}, "Size", size, sizeVal),
          el("label.slider", {}, "Opacity", op, opVal));
        if (mode === "eraser") p.prepend(el("p.muted", { style: { margin: "0 0 8px" } }, "Eraser size:"), el("label.slider", {}, el("input", { type: "range", min: 6, max: 80, value: sizeOf("eraser"), oninput: (e) => { prefs.sizes.eraser = +e.target.value; savePrefs(prefs); } })));
      });
    }
    function shapePop(anchor) {
      ui.popover(anchor, (p, close) => {
        p.append(el("h4", {}, "Shape"), el("div.shape-row", {}, SHAPES.map((s) => el("button.btn", { class: s === prefs.shape ? "primary" : "", onclick: () => { prefs.shape = s; savePrefs(prefs); setMode("shape"); close(); } }, { line: "╱ Line", arrow: "→ Arrow", rect: "▭ Box", ellipse: "◯ Circle", heart: "♡ Heart", star: "☆ Star" }[s]))),
          el("p.muted", { style: { margin: 0, fontSize: "12px" } }, "Drag on the page. Hold Shift for a perfect square or circle."));
      });
    }
    function stickerPop(anchor) {
      ui.popover(anchor, (p, close) => {
        // My stickers first: the person's own PNGs, plus a tile to add more
        const mine = el("div.grid-pick");
        const fileIn = el("input", { type: "file", accept: "image/png,image/*", multiple: true, hidden: true });
        fileIn.onchange = async () => {
          try {
            const added = await addMyStickers([...fileIn.files]);
            if (added.length) ui.toast(`Added ${added.length} sticker${added.length > 1 ? "s" : ""}`);
          } catch (err) {
            ui.toast(err.message);
          }
          fileIn.value = "";
          fillMine();
        };
        async function fillMine() {
          const list = await myStickers();
          mine.replaceChildren(
            el("button.add-sticker", { title: "Add your own PNG stickers", onclick: () => fileIn.click() }, el("span.plus", {}, "+"), "Add PNG"),
            ...list.map((st) => {
              const img = el("img", { alt: "" });
              myStickerURL(st.id).then((u) => (img.src = u));
              const del = el("span.mine-del", { title: "Remove from My stickers", role: "button" }, "×");
              del.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (await ui.confirmBox("Remove this sticker?", `“${st.name}” will be removed from My stickers and from any page that uses it.`, "Remove", true)) {
                  await api.forgetMySticker(st.id);
                  fillMine();
                }
              });
              return el("button.mine", { title: st.name, onclick: () => {
                close();
                addItem({ kind: "sticker", ref: "u:" + st.id, w: 110, h: Math.round((110 * st.h) / st.w) });
              } }, img, st.name, del);
            })
          );
        }
        p.append(el("h4", {}, "My stickers"), mine, fileIn,
          el("p.muted", { style: { margin: "6px 0 0", fontSize: "12px" } }, "PNGs with a see-through background work best."));
        fillMine();
        for (const g of [...new Set(S.stickers.LIST.map((s) => s.group))]) {
          p.append(el("h4", {}, g), el("div.grid-pick", { class: g === "Words" ? "words" : "" },
            S.stickers.LIST.filter((s) => s.group === g).map((s) => el("button", { title: s.name, onclick: () => { close(); addItem({ kind: "sticker", ref: s.id, w: g === "Words" ? 150 : 96, h: g === "Words" ? 56 : 96 }); } },
              el("img", { src: S.stickers.url(s.svg), alt: "" }), g === "Words" ? null : s.name))));
        }
      });
    }
    function tapePop(anchor) {
      ui.popover(anchor, (p, close) => {
        p.append(el("h4", {}, "Washi tape"), el("div.grid-pick", {}, S.stickers.TAPES.map((t) =>
          el("button", { title: t.name, onclick: () => { close(); addItem({ kind: "tape", ref: t.id, w: 180, h: 30, rot: Math.round((Math.random() - 0.5) * 20) }); } }, el("span.tape-swatch", { style: { background: t.css } }), t.name))),
          el("p.muted", { style: { margin: "8px 0 0", fontSize: "12px" } }, "Drag to place it over a photo's corner or across the page."));
      });
    }
    function bgPop(anchor) {
      ui.popover(anchor, (p, close) => {
        for (const g of ["Plain", "Notebook", "Paper"]) {
          p.append(el("h4", {}, g), el("div.grid-pick", {}, S.backgrounds.LIST.filter((b) => b.group === g).map((b) =>
            el("button", { class: entry.bg === b.id ? "on" : "", title: b.name, onclick: () => { opts.setBackground(b.id); close(); } }, el("span.bg-swatch", { style: { background: b.css } }), b.name))));
        }
      });
    }

    // start
    renderItems();
    updateUndo();
    setMode(mode in TOOLS || mode === "write" ? mode : "write");
    if (mode === "eraser") setMode("write");
    const ro = new ResizeObserver(() => resize());
    ro.observe(sheet);
    resize();

    const api = {
      resize,
      redraw,
      setMode,
      addItem,
      /** Pick a pen color from outside the rail (the side tray). */
      setInk(c) {
        prefs.ink = c;
        savePrefs(prefs);
        if (!(mode in TOOLS) || mode === "eraser" || TOOLS[mode].hl) setMode("pen");
        colorDot.style.background = c;
      },
      get ink() { return prefs.ink; },
      /** Delete one of "My stickers" from the library and from this page. */
      async forgetMySticker(id) {
        await removeMySticker(id);
        if (entry.items.some((i) => i.ref === "u:" + id)) {
          entry.items = entry.items.filter((i) => i.ref !== "u:" + id);
          opts.save();
        }
        renderItems();
      },
      get mode() { return mode; },
      deselect: () => select(null),
      destroy() {
        ro.disconnect();
        document.removeEventListener("pointerdown", deselect, true);
        document.removeEventListener("keydown", onKey);
        ui.closePop();
      },
    };
    return api;
  }

  S.art = { attach, HL, INK, myStickers, myStickerURL, addMyStickers };
})();
