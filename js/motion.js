/* Moving page backgrounds: gentle scenes drawn live (no GIF files), and the person's own looping
 * videos/GIFs. The moving layer sits behind the writing and covers the part of the page on screen,
 * like a window behind the paper. "Download page as photo" gets one still frame.
 */
(function () {
  const S = (window.Selah = window.Selah || {});
  const { el } = S.ui || {};
  const TAU = Math.PI * 2;
  const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  // ---------- scenes ----------
  // draw(c, w, h, t, st, k): w/h in page pixels, t in seconds, k = size of small figures
  const SCENES = {
    light: {
      name: "Let there be light", ref: "Genesis 1:3", still: "linear-gradient(180deg,#fff1d2,#fffaf0 50%,#fffdf8)",
      draw(c, w, h, t) {
        const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#fff1d2"); g.addColorStop(.5, "#fffaf0"); g.addColorStop(1, "#fffdf8");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        const ox = w * .12, oy = -Math.min(h, w * 1.3) * .08, L = Math.max(w, h) * 2;
        for (let i = 0; i < 9; i++) {
          const a = .25 + i * .14 + Math.sin(t * .18 + i) * .035, s = .045;
          c.beginPath(); c.moveTo(ox, oy);
          c.lineTo(ox + Math.cos(a - s) * L, oy + Math.sin(a - s) * L);
          c.lineTo(ox + Math.cos(a + s) * L, oy + Math.sin(a + s) * L);
          c.closePath();
          c.fillStyle = `rgba(255,214,140,${.10 + .06 * Math.sin(t * .5 + i * 1.7)})`; c.fill();
        }
        const R = Math.min(h, w * 1.3) * .5;
        const r = c.createRadialGradient(ox, oy, 0, ox, oy, R); r.addColorStop(0, "rgba(255,226,170,.55)"); r.addColorStop(1, "rgba(255,226,170,0)");
        c.fillStyle = r; c.fillRect(0, 0, w, h);
      },
    },
    dove: {
      name: "Like a dove", ref: "Matthew 3:16", still: "linear-gradient(180deg,#e4f0f8,#fbfdff)",
      setup(w, h) { const r = rnd(7); return { clouds: [...Array(Math.max(5, Math.round(h / 140)))].map(() => ({ x: r() * w, y: h * (.05 + r() * .9), s: 50 + r() * 80, v: 3 + r() * 4 })) }; },
      draw(c, w, h, t, st, k) {
        const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#e4f0f8"); g.addColorStop(1, "#fbfdff");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        for (const cl of st.clouds) {
          const x = ((cl.x + t * cl.v) % (w + cl.s * 4)) - cl.s * 2;
          for (const [dx, dy, m] of [[0, 0, 1], [cl.s * .7, cl.s * .1, .8], [-cl.s * .7, cl.s * .15, .75]]) {
            const r = c.createRadialGradient(x + dx, cl.y + dy, 0, x + dx, cl.y + dy, cl.s * m);
            r.addColorStop(0, "rgba(255,255,255,.85)"); r.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = r;
            c.fillRect(x + dx - cl.s, cl.y + dy - cl.s, cl.s * 2, cl.s * 2);
          }
        }
        const dove = (x, y, s, ph) => {
          const f = Math.sin(t * 1.6 + ph);
          c.save(); c.translate(x, y); c.scale(s, s);
          c.fillStyle = "rgba(255,255,255,.96)"; c.strokeStyle = "rgba(110,130,150,.45)"; c.lineWidth = 1 / s; c.lineJoin = "round";
          // far wing
          c.beginPath(); c.moveTo(2, -3); c.quadraticCurveTo(8, -16 - f * 6, 18, -20 - f * 8); c.quadraticCurveTo(12, -8, 8, -2); c.closePath(); c.fill(); c.stroke();
          // body, head, tail
          c.beginPath(); c.moveTo(-20, 1); c.lineTo(-28, -3); c.lineTo(-27, 5); c.closePath(); c.fill(); c.stroke();
          c.beginPath(); c.moveTo(-20, 1); c.quadraticCurveTo(-6, -7, 10, -4); c.quadraticCurveTo(16, -9, 20, -5); c.lineTo(24, -4); c.lineTo(20, -2);
          c.quadraticCurveTo(14, 6, 0, 6); c.quadraticCurveTo(-12, 6, -20, 1); c.closePath(); c.fill(); c.stroke();
          // near wing
          c.beginPath(); c.moveTo(-4, -2); c.quadraticCurveTo(-2, -24 - f * 9, 12, -30 - f * 12); c.quadraticCurveTo(10, -14, 6, -1); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = "rgba(60,70,80,.6)"; c.beginPath(); c.arc(17, -6, .9, 0, TAU); c.fill();
          c.restore();
        };
        const span = w + 160;
        dove(((t * 12) % span) - 80, h - Math.min(h * .22, 150 * k) + Math.sin(t * .4) * 8, 1.1 * k, 0);
        dove(((t * 12 + w * .55) % span) - 80, h - Math.min(h * .12, 80 * k) + Math.sin(t * .5 + 2) * 6, .8 * k, 1.3);
      },
    },
    waters: {
      name: "Still waters", ref: "Psalm 23:2", still: "linear-gradient(180deg,#f7fbf8,#eef6f3 55%,#d9ebe8)",
      draw(c, w, h, t) {
        const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#f7fbf8"); g.addColorStop(.55, "#eef6f3"); g.addColorStop(1, "#d9ebe8");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        const top = h * .5, n = Math.max(10, Math.round((h - top) / 18));
        for (let i = 0; i < n; i++) {
          const y = top + i * (h - top) / n, a = .07 + (i / n) * .17;
          c.beginPath();
          for (let x = 0; x <= w; x += 6) c.lineTo(x, y + Math.sin(x * .025 + t * .6 + i * .9) * (2 + i * .25) + Math.sin(x * .011 - t * .3) * 2);
          c.strokeStyle = `rgba(79,130,135,${a})`; c.lineWidth = 1.4; c.stroke();
        }
      },
    },
    stars: {
      name: "Count the stars", ref: "Genesis 15:5", dark: true, still: "linear-gradient(180deg,#141a33,#262d4d)",
      setup(w, h) { const r = rnd(42); return { s: [...Array(Math.round((w * h) / 1400))].map(() => ({ x: r(), y: r(), z: .4 + r() * 1.3, p: r() * TAU, v: .6 + r() * 1.6 })) }; },
      draw(c, w, h, t, st) {
        const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#141a33"); g.addColorStop(1, "#262d4d");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        for (const s of st.s) {
          const a = .25 + .75 * (.5 + .5 * Math.sin(t * s.v + s.p));
          c.fillStyle = `rgba(255,246,220,${a * .9})`; c.beginPath(); c.arc(s.x * w, s.y * h, s.z, 0, TAU); c.fill();
        }
      },
    },
    candle: {
      name: "A lamp unto my feet", ref: "Psalm 119:105", dark: true, still: "radial-gradient(circle at 84% 92%,#6b4a2c 0,#231a14 70%)",
      draw(c, w, h, t, st, k) {
        c.fillStyle = "#231a14"; c.fillRect(0, 0, w, h);
        const fl = 1 + Math.sin(t * 7) * .03 + Math.sin(t * 11.3) * .02 + Math.sin(t * 2.1) * .04;
        const cx = w - 48 * k, cy = h - 60 * k;
        const r = c.createRadialGradient(cx, cy - 20, 0, cx, cy - 20, Math.max(w, Math.min(h, w * 1.4)) * .75 * fl);
        r.addColorStop(0, "rgba(255,190,110,.42)"); r.addColorStop(.4, "rgba(200,120,60,.14)"); r.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = r; c.fillRect(0, 0, w, h);
        c.fillStyle = "#efe2c8"; c.fillRect(cx - 7 * k, cy - 4 * k, 14 * k, 70 * k);
        c.save(); c.translate(cx, cy - 6 * k); c.rotate(Math.sin(t * 3) * .05); c.scale(k, k * fl);
        const f = c.createRadialGradient(0, -8, 0, 0, -8, 14); f.addColorStop(0, "#fff7d6"); f.addColorStop(.5, "#ffc14d"); f.addColorStop(1, "rgba(255,120,30,0)");
        c.fillStyle = f; c.beginPath(); c.moveTo(0, -26); c.quadraticCurveTo(9, -8, 0, 2); c.quadraticCurveTo(-9, -8, 0, -26); c.fill(); c.restore();
      },
    },
    wheat: {
      name: "Fields white to harvest", ref: "John 4:35", still: "linear-gradient(180deg,#fffdf6,#f6ecd2)",
      setup(w) { const r = rnd(11); const n = Math.round(w / 6.5); return { s: [...Array(n)].map((_, i) => ({ x: (i + r() * .8) / n, hh: .6 + r() * .5, p: r() * 2 })) }; },
      draw(c, w, h, t, st, k) {
        const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#fffdf6"); g.addColorStop(1, "#f6ecd2");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        for (const s of st.s) {
          const bx = s.x * w, by = h + 4, len = s.hh * 110 * k;
          const sway = Math.sin(t * .9 + s.x * 5 + s.p) * len * .12 + Math.sin(t * .37) * len * .05;
          const tx = bx + sway, ty = by - len;
          c.strokeStyle = "rgba(176,140,70,.38)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx, by - len * .6, tx, ty); c.stroke();
          c.fillStyle = "rgba(196,154,74,.42)";
          for (let j = 0; j < 6; j++) for (const sd of [-1, 1]) {
            c.beginPath(); c.ellipse(tx + sd * 2.5 - sway * .02 * j, ty + j * 4.5 - 2, 1.8, 3.6, sd * .5, 0, TAU); c.fill();
          }
        }
      },
    },
    lilies: {
      name: "Consider the lilies", ref: "Matthew 6:28", still: "linear-gradient(135deg,#fff7f8,#fdeef1)",
      setup(w, h) { const r = rnd(5); return { p: [...Array(Math.max(12, Math.round((w * h) / 16000)))].map(() => ({ x: r(), y: r(), s: 4 + r() * 5, v: 6 + r() * 8, p: r() * TAU, c: r() < .5 ? "248,196,210" : "255,236,240" })) }; },
      draw(c, w, h, t, st) {
        const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#fff7f8"); g.addColorStop(1, "#fdeef1");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        for (const p of st.p) {
          const y = ((p.y * h + t * p.v) % (h + 40)) - 20, x = p.x * w + Math.sin(t * .5 + p.p) * 18;
          c.save(); c.translate(x, y); c.rotate(Math.sin(t * .7 + p.p) * 1.2);
          c.fillStyle = `rgba(${p.c},.75)`; c.strokeStyle = "rgba(214,140,160,.35)";
          c.beginPath(); c.ellipse(0, 0, p.s, p.s * .55, 0, 0, TAU); c.fill(); c.stroke(); c.restore();
        }
      },
    },
    olive: {
      name: "A green olive tree", ref: "Psalm 52:8", still: "#f5f8f1",
      draw(c, w, h, t, st, k) {
        c.fillStyle = "#f5f8f1"; c.fillRect(0, 0, w, h);
        c.save(); c.translate(w + 8, h - Math.min(h * .45, 200 * k)); c.rotate(Math.sin(t * .45) * .035 + .1); c.scale(k, k);
        c.strokeStyle = "rgba(110,95,70,.45)"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-70, 20, -150, 90); c.stroke();
        for (let i = 1; i < 12; i++) {
          const u = i / 12, x = -150 * u, y = 90 * u * u + 40 * u * (1 - u);
          for (const sd of [-1, 1]) {
            c.save(); c.translate(x, y); c.rotate(sd * (.9 + Math.sin(t * .8 + i) * .06) + 2.4);
            c.fillStyle = sd < 0 ? "rgba(122,150,110,.42)" : "rgba(150,172,132,.38)";
            c.beginPath(); c.ellipse(13, 0, 14, 3.6, 0, 0, TAU); c.fill(); c.restore();
          }
          if (i % 4 === 2) { c.fillStyle = "rgba(90,105,70,.45)"; c.beginPath(); c.ellipse(x - 4, y + 9, 4, 5.2, .3, 0, TAU); c.fill(); }
        }
        c.restore();
      },
    },
    dawn: {
      name: "He is risen", ref: "Matthew 28:6", still: "linear-gradient(180deg,#fde8de,#fffaf3 60%,#fffdf9)",
      draw(c, w, h, t, st, k) {
        const b = .5 + .5 * Math.sin(t * .35);
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, `rgb(253,${232 + b * 8},${222 + b * 6})`); g.addColorStop(.6, "#fffaf3"); g.addColorStop(1, "#fffdf9");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        const cx = w * .5, cy = Math.min(h * .58, h - 120 * k);
        const R = Math.min(h, w * 1.33) * (.32 + b * .08);
        const r = c.createRadialGradient(cx, cy, 0, cx, cy, R); r.addColorStop(0, `rgba(255,215,150,${.30 + b * .15})`); r.addColorStop(1, "rgba(255,215,150,0)");
        c.fillStyle = r; c.fillRect(0, 0, w, h);
        c.fillStyle = `rgba(179,138,58,${.10 + b * .05})`;
        c.fillRect(cx - 4 * k, cy - 52 * k, 8 * k, 104 * k); c.fillRect(cx - 30 * k, cy - 26 * k, 60 * k, 8 * k);
      },
    },
  };

  /** Background entries for the picker (group "Moving"); their css is the still version. */
  const LIST = Object.entries(SCENES).map(([id, s]) => ({ id: "m-" + id, name: s.name, group: "Moving", css: s.still, dark: !!s.dark, scene: id, ref: s.ref }));

  // ---------- the person's own looping videos / GIFs ----------
  const MAX_MB = 30;
  const mediaURLs = new Map(); // id -> blob url
  async function mediaURL(id) {
    if (!mediaURLs.has(id)) {
      const data = await S.store.get("bgmedia/" + id);
      if (!data) return "";
      const blob = await (await fetch(data)).blob();
      mediaURLs.set(id, URL.createObjectURL(blob));
    }
    return mediaURLs.get(id);
  }
  async function myList() { return (await S.store.get("mybgs")) || []; }

  // ---------- motion preference ----------
  const reduceMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const moving = () => !reduceMQ.matches && !(S.app && S.app.settings && S.app.settings.motion === false);

  /**
   * Put a moving layer behind a page.
   * opts: { sheet, scroller, scale() }. Returns { set(bgId, myInfo), capture(on), destroy() }.
   */
  function attach({ sheet, scroller, scale }) {
    const layer = el("div.bg-live", { hidden: true });
    const canvas = el("canvas.bg-canvas");
    const veil = el("div.bg-veil");
    layer.append(canvas, veil);
    sheet.prepend(layer);
    const ctx = canvas.getContext("2d");
    let scene = null, st = {}, media = null, mediaEl = null, raf = 0, last = 0, t = 8;
    let W = 0, Hh = 0, top = 0, capturing = false, sizeSig = "";

    function visibleWindow() {
      const k = scale() || 1;
      const sr = scroller.getBoundingClientRect(), pr = sheet.getBoundingClientRect();
      const H = sheet.offsetHeight;
      const a = Math.max(0, Math.min(H, (sr.top - pr.top) / k));
      const b = Math.max(a, Math.min(H, (sr.bottom - pr.top) / k));
      return { top: a, height: Math.max(1, b - a) };
    }
    function place() {
      if (layer.hidden || capturing) return;
      W = sheet.offsetWidth;
      const v = visibleWindow();
      top = v.top;
      Hh = Math.max(200, v.height);
      layer.style.top = top + "px";
      layer.style.height = Hh + "px";
      if (scene) {
        const d = Math.min(2, window.devicePixelRatio || 1) * Math.min(2, scale() || 1);
        const sig = `${W}x${Math.round(Hh)}@${d}`;
        if (sig !== sizeSig) {
          sizeSig = sig;
          canvas.width = Math.round(W * d);
          canvas.height = Math.round(Hh * d);
          ctx.setTransform(d, 0, 0, d, 0, 0);
          st = SCENES[scene].setup ? SCENES[scene].setup(W, Hh) : {};
        }
        draw();
      }
    }
    const kOf = (w) => Math.min(w, 520) / 300;
    function draw() {
      if (!scene) return;
      SCENES[scene].draw(ctx, W, Hh, t, st, kOf(W));
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!scene || capturing || document.hidden || !moving()) return;
      if (now - last < 33) return; // about 30 frames a second is plenty for slow scenes
      t += Math.min(0.1, (now - (last || now)) / 1000);
      last = now;
      draw();
    }

    async function set(bgId, info) {
      scene = null;
      sizeSig = "";
      if (mediaEl) { mediaEl.remove(); mediaEl = null; }
      media = null;
      veil.style.background = "none";
      const b = S.backgrounds.byId[bgId];
      if (b && b.scene) {
        scene = b.scene;
        canvas.hidden = false;
        layer.hidden = false;
      } else if (info) {
        media = info;
        canvas.hidden = true;
        layer.hidden = false;
        const url = await mediaURL(info.id);
        if (media !== info) return;
        mediaEl = info.kind === "video"
          ? el("video.bg-media", { muted: true, loop: true, playsinline: true, autoplay: true, "webkit-playsinline": true, src: url })
          : el("img.bg-media", { alt: "", src: url, draggable: "false" });
        if (info.kind === "video") {
          mediaEl.muted = true;
          mediaEl.play().catch(() => {});
          if (!moving()) mediaEl.addEventListener("loadeddata", () => mediaEl && mediaEl.pause(), { once: true });
        }
        layer.prepend(mediaEl);
        const v = Math.max(0, Math.min(0.9, info.veil ?? 0.35));
        veil.style.background = info.dark ? `rgba(20,18,16,${v})` : `rgba(255,253,248,${v})`;
      } else {
        layer.hidden = true;
      }
      place();
      if (!raf) raf = requestAnimationFrame(loop);
    }

    /** Before a photo: one still frame across the whole page. After: back to live. */
    async function capture(on) {
      if (layer.hidden) return;
      if (on) {
        capturing = true;
        const H = sheet.offsetHeight, w = sheet.offsetWidth;
        const d = Math.max(1, Math.min(2, Math.sqrt(12e6 / (w * H))));
        layer.style.top = "0px";
        layer.style.height = H + "px";
        canvas.hidden = false;
        canvas.width = Math.round(w * d);
        canvas.height = Math.round(H * d);
        ctx.setTransform(d, 0, 0, d, 0, 0);
        if (scene) {
          const s2 = SCENES[scene].setup ? SCENES[scene].setup(w, H) : {};
          SCENES[scene].draw(ctx, w, H, t, s2, kOf(w));
        } else if (mediaEl) {
          // the picture repeats down the page, as it looks while scrolling
          const src = mediaEl, sw = src.videoWidth || src.naturalWidth, sh = src.videoHeight || src.naturalHeight;
          const block = Math.max(200, Hh || w * 1.4);
          if (sw && sh) {
            for (let y = 0; y < H; y += block) {
              const k = Math.max(w / sw, block / sh), dw = sw * k, dh = sh * k;
              ctx.save(); ctx.beginPath(); ctx.rect(0, y, w, block); ctx.clip();
              try { ctx.drawImage(src, (w - dw) / 2, y + (block - dh) / 2, dw, dh); } catch {}
              ctx.restore();
            }
          }
          mediaEl.style.visibility = "hidden";
        }
      } else {
        capturing = false;
        sizeSig = "";
        if (mediaEl) { mediaEl.style.visibility = ""; canvas.hidden = true; }
        place();
      }
    }

    const onScroll = () => place();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => place());
    ro.observe(sheet);
    ro.observe(scroller);
    const onVis = () => { if (!document.hidden && mediaEl && mediaEl.play && moving()) mediaEl.play().catch(() => {}); };
    document.addEventListener("visibilitychange", onVis);

    return {
      set,
      place,
      capture,
      destroy() {
        cancelAnimationFrame(raf);
        raf = 0;
        scroller.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", onVis);
        ro.disconnect();
        if (mediaEl && mediaEl.pause) mediaEl.pause();
        layer.remove();
      },
    };
  }

  // ---------- upload ----------
  const readAsDataURL = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });

  /** Ask for a looping video or GIF, then how the writing should look on it. Resolves to the saved info or null. */
  function upload() {
    return new Promise((resolve) => {
      const ui = S.ui;
      const inp = el("input", { type: "file", accept: "video/mp4,video/webm,video/quicktime,video/*,image/gif,image/webp,image/png,image/jpeg" });
      inp.onchange = async () => {
        const f = inp.files[0];
        if (!f) return resolve(null);
        if (f.size > MAX_MB * 1024 * 1024) {
          ui.toast(`That file is ${(f.size / 1048576).toFixed(0)} MB. Pick one under ${MAX_MB} MB (a short loop works best).`, 5000);
          return resolve(null);
        }
        const kind = f.type.startsWith("video/") || /\.(mp4|mov|m4v|webm)$/i.test(f.name) ? "video" : "image";
        ui.toast("Loading…", 4000);
        let data;
        try { data = await readAsDataURL(f); } catch { ui.toast("Couldn't read that file"); return resolve(null); }
        const previewURL = URL.createObjectURL(f);
        ui.dialog((box, close) => {
          let dark = false, veil = 0.35, done = false;
          const media = kind === "video"
            ? el("video", { src: previewURL, muted: true, loop: true, autoplay: true, playsinline: true })
            : el("img", { src: previewURL, alt: "" });
          if (kind === "video") { media.muted = true; media.play().catch(() => {}); }
          const veilEl = el("div.bg-veil");
          const sample = el("div.up-sample", {}, el("b", {}, "Psalm 46:10"), el("span", {}, "Be still, and know that I am God."));
          const prev = el("div.up-prev", {}, media, veilEl, sample);
          const paint = () => {
            veilEl.style.background = dark ? `rgba(20,18,16,${veil})` : `rgba(255,253,248,${veil})`;
            sample.style.color = dark ? "#f1ead9" : "#2e2a25";
          };
          const name = el("input.input", { value: f.name.replace(/\.[^.]+$/, "").slice(0, 40), maxlength: 40 });
          const textSeg = el("div.seg", {},
            el("button.on", { type: "button", onclick: (e) => { dark = false; [...textSeg.children].forEach((b) => b.classList.toggle("on", b === e.currentTarget)); paint(); } }, "Dark writing"),
            el("button", { type: "button", onclick: (e) => { dark = true; [...textSeg.children].forEach((b) => b.classList.toggle("on", b === e.currentTarget)); paint(); } }, "Light writing"));
          const slider = el("input", { type: "range", min: 0, max: 85, value: 35, oninput: (e) => { veil = +e.target.value / 100; paint(); } });
          paint();
          const finish = (v) => { if (done) return; done = true; URL.revokeObjectURL(previewURL); close(); resolve(v); };
          box.append(
            el("h2", {}, kind === "video" ? "Your looping video" : "Your background"),
            el("p.sub", {}, "It plays silently on a loop behind your writing. Soften it until the words are easy to read."),
            prev,
            el("label.field", {}, el("span", {}, "Name"), name),
            el("div.row", { style: { alignItems: "end" } },
              el("label.field", {}, el("span", {}, "Writing color"), textSeg),
              el("label.field", {}, el("span", {}, "Soften"), slider)),
            el("p.muted", { style: { fontSize: "12.5px" } }, "Saved on this device and included in Export backup."),
            el("div.actions", {},
              el("button.btn", { onclick: () => finish(null) }, "Cancel"),
              el("button.btn.primary", { onclick: async () => {
                const id = ui.uid();
                try {
                  await S.store.set("bgmedia/" + id, data);
                } catch {
                  ui.toast("There isn't room to save that file on this device");
                  return finish(null);
                }
                const info = { id, name: name.value.trim() || "My background", kind, type: f.type, dark, veil };
                const list = await myList();
                list.unshift(info);
                await S.store.set("mybgs", list);
                finish(info);
              } }, "Use it")));
        });
      };
      inp.click();
    });
  }

  async function remove(id) {
    const list = (await myList()).filter((x) => x.id !== id);
    await S.store.set("mybgs", list);
    await S.store.del("bgmedia/" + id);
    const u = mediaURLs.get(id);
    if (u) URL.revokeObjectURL(u);
    mediaURLs.delete(id);
  }

  // add the moving scenes to the background choices
  if (S.backgrounds) for (const b of LIST) { S.backgrounds.LIST.push(b); S.backgrounds.byId[b.id] = b; }

  S.motion = { SCENES, LIST, attach, upload, remove, myList, mediaURL, MAX_MB };
})();
