/* Small UI helpers: element builder, dates, dialogs, popovers, toast. */
(function () {
  const S = (window.Selah = window.Selah || {});

  function el(tag, attrs, ...kids) {
    const [name, ...classes] = tag.split(".");
    const n = document.createElement(name || "div");
    if (classes.length) n.className = classes.join(" ");
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") n.className += (n.className ? " " : "") + v;
      else if (k === "html") n.innerHTML = v;
      else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.assign(n.dataset, v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat(Infinity)) {
      if (k === null || k === undefined || k === false) continue;
      n.append(k instanceof Node ? k : document.createTextNode(String(k)));
    }
    return n;
  }

  // ---------- dates (always local, as YYYY-MM-DD) ----------
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseIso = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const today = () => iso(new Date());
  const addDays = (s, n) => {
    const d = parseIso(s);
    d.setDate(d.getDate() + n);
    return iso(d);
  };
  const fmt = (s, opts) => parseIso(s).toLocaleDateString(undefined, opts);
  const longDate = (s) => fmt(s, { month: "long", day: "numeric", year: "numeric" });
  const weekday = (s) => fmt(s, { weekday: "long" });
  const shortDate = (s) => fmt(s, { month: "short", day: "numeric" });

  // ---------- toast ----------
  let toastTimer;
  function toast(msg, ms = 2200) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }

  // ---------- modal dialog ----------
  function dialog(build) {
    const overlay = el("div.overlay");
    const box = el("div.dialog", { role: "dialog", "aria-modal": "true" });
    overlay.append(box);
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    };
    const onKey = (e) => e.key === "Escape" && close();
    overlay.addEventListener("mousedown", (e) => e.target === overlay && close());
    document.addEventListener("keydown", onKey);
    build(box, close);
    document.body.append(overlay);
    const f = box.querySelector("[autofocus]");
    if (f) setTimeout(() => f.focus(), 30);
    return close;
  }

  function confirmBox(title, text, okLabel = "OK", danger = false) {
    return new Promise((res) => {
      dialog((box, close) => {
        const done = (v) => {
          close();
          res(v);
        };
        box.append(
          el("h2", {}, title),
          el("p.sub", {}, text),
          el("div.actions", {},
            el("button.btn", { onclick: () => done(false) }, "Cancel"),
            el("button.btn.primary", { class: danger ? "danger" : "", onclick: () => done(true), autofocus: true }, okLabel))
        );
      });
    });
  }

  // ---------- popover anchored to an element ----------
  let openPop = null;
  function popover(anchor, build, { side = "right" } = {}) {
    closePop();
    const p = el("div.pop");
    build(p, closePop);
    document.body.append(p);
    const r = anchor.getBoundingClientRect();
    const pw = p.offsetWidth, ph = p.offsetHeight;
    let x, y;
    if (side === "right" && window.innerWidth > 720) {
      x = r.right + 10;
      y = Math.min(r.top, window.innerHeight - ph - 12);
    } else {
      x = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 12);
      y = r.top - ph - 10;
      if (y < 12) y = r.bottom + 10;
    }
    p.style.left = Math.max(12, x) + "px";
    p.style.top = Math.max(12, y) + "px";
    openPop = { p, anchor };
    setTimeout(() => document.addEventListener("pointerdown", outside, true), 0);
    return p;
  }
  function outside(e) {
    if (!openPop) return;
    if (openPop.p.contains(e.target) || openPop.anchor.contains(e.target)) return;
    closePop();
  }
  function closePop() {
    if (!openPop) return;
    openPop.p.remove();
    openPop = null;
    document.removeEventListener("pointerdown", outside, true);
  }

  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const debounce = (fn, ms) => {
    let t, pending = false;
    const d = (...a) => {
      clearTimeout(t);
      pending = true;
      t = setTimeout(() => { pending = false; fn(...a); }, ms);
    };
    // run now, but only if a call is still waiting (so a stale copy never overwrites newer data)
    d.flush = (...a) => {
      clearTimeout(t);
      if (!pending) return;
      pending = false;
      return fn(...a);
    };
    return d;
  };

  /** Copy text to the clipboard (with a fallback for older web views). */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    const ta = el("textarea", { style: { position: "fixed", top: "-1000px", opacity: "0" }, readonly: true });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand("copy"); } catch {}
    ta.remove();
    return ok;
  }

  /** Small on/off switch with a label. onChange(checked) */
  function toggle(label, checked, onChange, title) {
    const input = el("input", { type: "checkbox", role: "switch" });
    input.checked = !!checked;
    input.addEventListener("change", () => onChange && onChange(input.checked));
    const node = el("label.switch", { title: title || label }, input, el("span.track", {}, el("span.knob")), el("span.lbl", {}, label));
    node.set = (v) => (input.checked = !!v);
    node.get = () => input.checked;
    return node;
  }

  S.ui = { copyText, toggle, el, iso, parseIso, today, addDays, longDate, weekday, shortDate, fmt, toast, dialog, confirmBox, popover, closePop, uid, debounce };
})();
