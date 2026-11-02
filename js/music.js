/* Mini music player: the person's own songs (saved on this device) and a Spotify player.
 * It lives outside the pages, so music keeps playing while moving between days.
 */
(function () {
  const S = (window.Selah = window.Selah || {});
  const { el } = S.ui;
  const ui = S.ui;
  const MAX_MB = 30;
  const svg = (b) => `<svg viewBox="0 0 24 24" width="20" height="20">${b}</svg>`;
  const IC = {
    play: svg('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>'),
    pause: svg('<rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor"/>'),
    prev: svg('<path d="M18 6v12l-9-6zM6 6v12" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
    next: svg('<path d="M6 6v12l9-6zM18 6v12" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
    shuffle: svg('<path d="M4 7h3c5 0 5 10 10 10h3M4 17h3c2 0 3-1.5 4-3.5M14 8.5c1-1 2-1.5 3-1.5h3M17 4l3 3-3 3M17 14l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
    repeat: svg('<path d="M5 11V9a3 3 0 0 1 3-3h11M16 3l3 3-3 3M19 13v2a3 3 0 0 1-3 3H5M8 21l-3-3 3-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
    note: svg('<path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="16" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>'),
  };

  let songs = [];          // [{ id, name, size }]
  let prefs = { tab: "mine", repeat: "all", shuffle: false, volume: 0.8, spotify: [], spCur: null };
  let cur = -1;            // index in songs
  const audio = new Audio();
  audio.preload = "auto";
  const urls = new Map();
  let panel, pill, built = false, open = false;
  let headEl, minePane, spPane, spTop, spHost, spFoot; // spHost keeps the Spotify player in place (moving it would restart it)

  const savePrefs = () => S.store.set("music", prefs);
  async function load() {
    songs = (await S.store.get("songs")) || [];
    prefs = Object.assign(prefs, (await S.store.get("music")) || {});
    audio.volume = prefs.volume;
  }

  async function songURL(id) {
    if (!urls.has(id)) {
      const data = await S.store.get("song/" + id);
      if (!data) return "";
      urls.set(id, URL.createObjectURL(await (await fetch(data)).blob()));
    }
    return urls.get(id);
  }

  // ---------- own songs ----------
  async function playAt(i) {
    if (!songs.length) return;
    cur = (i + songs.length) % songs.length;
    const s = songs[cur];
    const u = await songURL(s.id);
    if (!u) return ui.toast("That song couldn't be found on this device");
    audio.src = u;
    try { await audio.play(); } catch {}
    mediaSession();
    render();
  }
  function toggle() {
    if (cur < 0) return playAt(prefs.shuffle ? Math.floor(Math.random() * songs.length) : 0);
    audio.paused ? audio.play().catch(() => {}) : audio.pause();
  }
  function step(n) {
    if (!songs.length) return;
    if (prefs.shuffle && songs.length > 1) {
      let j = cur;
      while (j === cur) j = Math.floor(Math.random() * songs.length);
      return playAt(j);
    }
    playAt(cur + n);
  }
  audio.addEventListener("ended", () => {
    if (prefs.repeat === "one") { audio.currentTime = 0; audio.play().catch(() => {}); }
    else if (prefs.repeat === "all" || prefs.shuffle || cur < songs.length - 1) step(1);
    else render();
  });
  ["play", "pause"].forEach((ev) => audio.addEventListener(ev, () => { render(); if (ev === "play") pauseSpotify(); }));
  audio.addEventListener("timeupdate", () => updateTime());
  audio.addEventListener("loadedmetadata", () => updateTime());

  function mediaSession() {
    if (!("mediaSession" in navigator) || cur < 0) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: songs[cur].name, artist: "Selah", artwork: [{ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }] });
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => step(-1));
      navigator.mediaSession.setActionHandler("nexttrack", () => step(1));
    } catch {}
  }

  function addSongs() {
    const inp = el("input", { type: "file", accept: "audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac", multiple: true });
    inp.onchange = async () => {
      let added = 0;
      for (const f of inp.files) {
        if (f.size > MAX_MB * 1048576) { ui.toast(`“${f.name}” is over ${MAX_MB} MB, so it was skipped`, 4000); continue; }
        const data = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsDataURL(f); });
        if (!data) continue;
        const id = ui.uid();
        try { await S.store.set("song/" + id, data); } catch { ui.toast("There isn't room to save more songs on this device"); break; }
        songs.push({ id, name: f.name.replace(/\.[^.]+$/, ""), size: f.size });
        added++;
      }
      if (added) {
        await S.store.set("songs", songs);
        ui.toast(`Added ${added} song${added > 1 ? "s" : ""}`);
      }
      render();
    };
    inp.click();
  }
  async function removeSong(s) {
    if (!(await ui.confirmBox("Remove this song?", `“${s.name}” will be removed from this device.`, "Remove", true))) return;
    const i = songs.indexOf(s);
    if (i === cur) { audio.pause(); audio.removeAttribute("src"); cur = -1; }
    else if (i < cur) cur--;
    songs.splice(i, 1);
    await S.store.set("songs", songs);
    await S.store.del("song/" + s.id);
    const u = urls.get(s.id);
    if (u) URL.revokeObjectURL(u);
    urls.delete(s.id);
    render();
  }

  // ---------- Spotify ----------
  /** "https://open.spotify.com/playlist/37i9…?si=…" or "spotify:album:…" -> { type, id } */
  function parseSpotify(s) {
    const m = String(s || "").trim().match(/(?:open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?|spotify:)(track|album|playlist|episode|show|artist)[/:]([A-Za-z0-9]{10,40})/);
    return m ? { type: m[1], id: m[2] } : null;
  }
  const TYPE_NAME = { track: "Song", album: "Album", playlist: "Playlist", episode: "Episode", show: "Podcast", artist: "Artist" };
  let spFrame = null, spFor = null;
  function pauseSpotify() {
    // Spotify's player can't be paused from outside without its own controls; reloading it stops it
    if (spFrame && spFor) spFrame.src = spFrame.src;
  }
  async function addSpotify(link) {
    const p = parseSpotify(link);
    if (!p) return ui.toast("Paste a Spotify link to a song, album, playlist or podcast");
    let item = prefs.spotify.find((x) => x.type === p.type && x.id === p.id);
    if (!item) {
      item = { ...p, title: "" };
      prefs.spotify.unshift(item);
      prefs.spotify = prefs.spotify.slice(0, 12);
      // fetch the title if Spotify allows it; the type is used otherwise
      try {
        const r = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/${p.type}/${p.id}`)}`);
        if (r.ok) item.title = ((await r.json()).title || "").slice(0, 80);
      } catch {}
    }
    prefs.spCur = `${item.type}:${item.id}`;
    await savePrefs();
    render();
  }

  // ---------- UI ----------
  const fmtTime = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");
  let timeEls = null;
  function updateTime() {
    if (!timeEls) return;
    timeEls.bar.max = audio.duration || 0;
    if (!timeEls.dragging) timeEls.bar.value = audio.currentTime || 0;
    timeEls.now.textContent = fmtTime(audio.currentTime);
    timeEls.len.textContent = fmtTime(audio.duration);
  }

  function build() {
    if (built) return;
    built = true;
    panel = el("aside.music", { "aria-label": "Music" });
    pill = el("button.music-pill", { hidden: true, title: "Show the music player", onclick: () => setOpen(true) });
    headEl = el("div.music-head");
    minePane = el("div.music-pane");
    spTop = el("div");
    spHost = el("div.sp-host");
    spFoot = el("div");
    spPane = el("div.music-pane", {}, spTop, spHost, spFoot);
    panel.append(headEl, minePane, spPane);
    document.body.append(panel, pill);
    document.addEventListener("pointerdown", (e) => {
      if (!open || panel.contains(e.target) || e.target.closest("#go-music, .overlay, .pop")) return;
      if (window.matchMedia("(max-width: 720px)").matches) setOpen(false);
    }, true);
  }

  function setOpen(v) {
    build();
    open = v;
    panel.classList.toggle("open", v);
    const btn = document.getElementById("go-music");
    if (btn) btn.classList.toggle("on", v);
    render();
  }

  function render() {
    if (!built) return;
    const playing = !audio.paused && cur >= 0;
    // the small pill shows what's playing while the panel is closed
    pill.hidden = open || !playing;
    if (!pill.hidden) pill.innerHTML = IC.note + `<span>${(songs[cur] && songs[cur].name || "").replace(/[&<>]/g, "")}</span>`;
    const btn = document.getElementById("go-music");
    if (btn) btn.classList.toggle("playing", playing);
    if (!open) return;

    const tabs = el("div.seg.music-tabs", {},
      [["mine", "My music"], ["spotify", "Spotify"]].map(([id, n]) => el("button", { class: prefs.tab === id ? "on" : "", onclick: () => { prefs.tab = id; savePrefs(); render(); } }, n)));
    headEl.replaceChildren(tabs, el("span.spacer"), el("button.icon-btn", { title: "Hide player (music keeps playing)", "aria-label": "Hide player", onclick: () => setOpen(false), html: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' }));
    minePane.hidden = prefs.tab !== "mine";
    spPane.hidden = prefs.tab !== "spotify";

    // own songs
    const mine = minePane;
    mine.replaceChildren();
    if (!songs.length) {
      mine.append(el("p.muted.small", {}, "Add songs from this device to play while you journal. They're saved on this device only (up to 30 MB each) and included in Export backup."));
    } else {
      const bar = el("input.music-bar", { type: "range", min: 0, step: 0.1, value: 0, "aria-label": "Position" });
      bar.addEventListener("input", () => { timeEls.dragging = true; timeEls.now.textContent = fmtTime(+bar.value); });
      bar.addEventListener("change", () => { audio.currentTime = +bar.value; timeEls.dragging = false; });
      timeEls = { bar, now: el("span"), len: el("span"), dragging: false };
      const ctl = (html, title, on, fn) => el("button.mctl", { title, "aria-label": title, class: on ? "on" : "", html, onclick: fn });
      const repeatTitle = { all: "Repeat all (tap for repeat one)", one: "Repeat this song (tap to turn off)", off: "Repeat off (tap to repeat all)" }[prefs.repeat];
      mine.append(
        el("div.now", {}, el("b", {}, cur >= 0 ? songs[cur].name : "Nothing playing"), el("span.muted.small", {}, cur >= 0 ? `${cur + 1} of ${songs.length}` : `${songs.length} song${songs.length > 1 ? "s" : ""}`)),
        bar,
        el("div.times", {}, timeEls.now, timeEls.len),
        el("div.controls", {},
          ctl(IC.shuffle, prefs.shuffle ? "Shuffle on" : "Shuffle off", prefs.shuffle, () => { prefs.shuffle = !prefs.shuffle; savePrefs(); render(); }),
          ctl(IC.prev, "Previous", false, () => (audio.currentTime > 3 ? (audio.currentTime = 0) : step(-1))),
          el("button.mctl.big", { title: playing ? "Pause" : "Play", "aria-label": playing ? "Pause" : "Play", html: playing ? IC.pause : IC.play, onclick: toggle }),
          ctl(IC.next, "Next", false, () => step(1)),
          el("button.mctl", { title: repeatTitle, "aria-label": repeatTitle, class: prefs.repeat !== "off" ? "on" : "", onclick: () => { prefs.repeat = { all: "one", one: "off", off: "all" }[prefs.repeat]; savePrefs(); render(); } },
            el("span", { html: IC.repeat }), prefs.repeat === "one" ? el("small", {}, "1") : null)),
        el("label.vol", {}, el("span.muted.small", {}, "Volume"), el("input", { type: "range", min: 0, max: 1, step: 0.05, value: prefs.volume, oninput: (e) => { audio.volume = prefs.volume = +e.target.value; }, onchange: savePrefs })),
        el("ul.tracks", {}, songs.map((s, i) => el("li", { class: i === cur ? "cur" : "" },
          el("button.tname", { onclick: () => (i === cur ? toggle() : playAt(i)) }, i === cur && playing ? "▶ " : "", s.name),
          el("button.pdel", { title: "Remove", onclick: () => removeSong(s) }, "×")))));
      updateTime();
    }
    mine.append(el("button.btn", { style: { marginTop: "8px" }, onclick: addSongs }, "＋ Add songs"));

    // Spotify
    spTop.replaceChildren();
    spFoot.replaceChildren();
    const link = el("input.input", { placeholder: "Paste a Spotify link (playlist, album, song…)", autocomplete: "off", spellcheck: "false" });
    link.addEventListener("keydown", (e) => e.key === "Enter" && addSpotify(link.value));
    const curItem = prefs.spotify.find((x) => `${x.type}:${x.id}` === prefs.spCur) || prefs.spotify[0];
    spTop.append(el("div.row.sp-add", {}, link, el("button.btn.primary", { onclick: () => addSpotify(link.value) }, "Add")));
    if (prefs.spotify.length) {
      spTop.append(el("div.sp-list", {}, prefs.spotify.map((x) => el("span.sp-chip", { class: x === curItem ? "on" : "" },
        el("button", { onclick: () => { prefs.spCur = `${x.type}:${x.id}`; savePrefs(); render(); } }, x.title || `${TYPE_NAME[x.type]} ${x.id.slice(0, 6)}…`),
        el("button.x", { title: "Remove", onclick: () => { prefs.spotify = prefs.spotify.filter((y) => y !== x); if (prefs.spCur === `${x.type}:${x.id}`) prefs.spCur = null; savePrefs(); render(); } }, "×")))));
    }
    // keep the same player across redraws so the music doesn't stop
    const want = curItem ? `${curItem.type}:${curItem.id}` : null;
    if (want !== spFor) {
      spFor = want;
      spFrame = want ? el("iframe.sp-frame", {
        src: `https://open.spotify.com/embed/${curItem.type}/${curItem.id}?utm_source=generator`,
        height: ["track", "episode"].includes(curItem.type) ? 152 : 352,
        allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture", loading: "lazy", title: "Spotify player",
      }) : null;
      spHost.replaceChildren(...(spFrame ? [spFrame] : []));
    }
    if (spFrame) {
      spFoot.append(
        el("div.row.sp-foot", {},
          el("a.btn", { href: `https://open.spotify.com/${curItem.type}/${curItem.id}`, target: "_blank", rel: "noopener" }, "Open in Spotify")),
        el("p.muted.small", {}, "For full songs, sign in with the button inside the player. If it only plays 30-second previews (common on iPhone), tap Open in Spotify: the music keeps playing there while you journal."));
    } else {
      spFoot.append(el("p.muted.small", {}, "In Spotify, tap Share › Copy link on a playlist, album or song, then paste it here."));
    }

  }

  async function init() {
    await load();
    build();
    const btn = document.getElementById("go-music");
    if (btn) btn.onclick = () => setOpen(!open);
  }

  S.music = { init, open: () => setOpen(true), parseSpotify, get audio() { return audio; } };
})();
