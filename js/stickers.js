/* Bible-reflection sticker set, drawn as SVG (100×100 unless noted). */
(function () {
  const S = (window.Selah = window.Selah || {});
  const svg = (body, vb = "0 0 100 100") =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;

  const word = (text, fill, ink, font = "Georgia, serif", italic = true, size = 30) =>
    svg(
      `<rect x="4" y="10" width="152" height="40" rx="20" fill="${fill}" stroke="${ink}" stroke-width="2.5" stroke-dasharray="${italic ? "0" : "5 4"}"/>
       <text x="80" y="38" text-anchor="middle" font-family="${font}" font-size="${size}" ${italic ? 'font-style="italic"' : 'font-weight="700"'} fill="${ink}">${text}</text>`,
      "0 0 160 60"
    );

  const LIST = [
    { id: "cross", name: "Cross", group: "Symbols", svg: svg(`
      <circle cx="50" cy="50" r="44" fill="#fdf1d6"/>
      <g fill="#f6c453" opacity=".7"><circle cx="50" cy="38" r="22"/></g>
      <path d="M44 14h12v22h20v12H56v40H44V48H24V36h20z" fill="#7a4a24" stroke="#4e2c12" stroke-width="2" stroke-linejoin="round"/>
      <path d="M47 17v68M27 39h46" stroke="#a46b3c" stroke-width="2" opacity=".6"/>`) },
    { id: "dove", name: "Dove", group: "Symbols", svg: svg(`
      <path d="M18 58c10-2 20-10 26-22 4-8 12-14 22-12 6 1 10 5 12 9l8 1-7 5c-1 16-14 28-32 30l-8 10-2-11c-8-1-15-5-19-10z" fill="#fff" stroke="#4a6fa5" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M44 40c-6-12-18-20-30-20 4 12 14 22 28 26" fill="#eaf2ff" stroke="#4a6fa5" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="70" cy="31" r="2.2" fill="#2b3a55"/>
      <path d="M84 34c6 2 8 6 7 10-5-1-8-3-9-6" fill="#7bb661" stroke="#3f7d3a" stroke-width="1.5"/>
      <path d="M82 36c4 4 6 9 5 14" stroke="#3f7d3a" stroke-width="1.5" fill="none"/>`) },
    { id: "olive", name: "Olive branch", group: "Nature", svg: svg(`
      <path d="M15 85C35 65 55 45 85 15" stroke="#6b4f2a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g fill="#8db36b" stroke="#557a3c" stroke-width="1.5">
      <ellipse cx="28" cy="62" rx="12" ry="5" transform="rotate(-70 28 62)"/><ellipse cx="38" cy="70" rx="12" ry="5" transform="rotate(10 38 70)"/>
      <ellipse cx="44" cy="44" rx="12" ry="5" transform="rotate(-70 44 44)"/><ellipse cx="54" cy="52" rx="12" ry="5" transform="rotate(10 54 52)"/>
      <ellipse cx="60" cy="28" rx="12" ry="5" transform="rotate(-70 60 28)"/><ellipse cx="70" cy="36" rx="12" ry="5" transform="rotate(10 70 36)"/>
      <ellipse cx="82" cy="20" rx="10" ry="4.5" transform="rotate(-40 82 20)"/></g>
      <g fill="#4b3a6b"><circle cx="34" cy="55" r="4"/><circle cx="62" cy="44" r="4"/><circle cx="48" cy="60" r="3.5"/></g>`) },
    { id: "lamp", name: "Oil lamp", group: "Symbols", svg: svg(`
      <path d="M50 18c6 8 8 14 4 20-2 3-6 3-8 0-4-6-2-12 4-20z" fill="#ffb627" stroke="#e07a1f" stroke-width="2"/>
      <path d="M50 26c2 4 3 7 1 10-1 1-2 1-3 0-1-3 0-6 2-10z" fill="#fff3c4"/>
      <path d="M14 58c0-8 16-14 36-14s36 6 36 14c0 10-16 18-36 18S14 68 14 58z" fill="#c8794a" stroke="#7a3f1d" stroke-width="2.5"/>
      <path d="M44 46l6-6 6 6" fill="#c8794a" stroke="#7a3f1d" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M86 56c8-2 10 8 2 10" fill="none" stroke="#7a3f1d" stroke-width="3" stroke-linecap="round"/>
      <path d="M26 60c8 4 40 4 48 0" stroke="#f0b48a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <rect x="36" y="74" width="28" height="8" rx="3" fill="#a35d34" stroke="#7a3f1d" stroke-width="2"/>`) },
    { id: "bible", name: "Open Bible", group: "Symbols", svg: svg(`
      <path d="M50 30C38 22 22 22 10 26v48c12-4 28-4 40 4 12-8 28-8 40-4V26c-12-4-28-4-40 4z" fill="#fffaf0" stroke="#5b3a29" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M50 30v48" stroke="#5b3a29" stroke-width="2"/>
      <path d="M18 38c8-2 16-2 24 2M18 46c8-2 16-2 24 2M18 54c8-2 16-2 24 2M58 40c8-4 16-4 24-2M58 48c8-4 16-4 24-2M58 56c8-4 16-4 24-2" stroke="#b9a68f" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M52 76l3 14 3-6 3 6 1-14" fill="#c0392b"/>`) },
    { id: "hands", name: "Praying hands", group: "Prayer", svg: svg(`
      <path d="M50 12c-4 0-6 4-6 10v34l-12 14c-4 5-2 12 4 14l14 4z" fill="#f4c9a4" stroke="#8a5a3c" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M50 12c4 0 6 4 6 10v34l12 14c4 5 2 12-4 14l-14 4z" fill="#f8d7b8" stroke="#8a5a3c" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M50 14v74" stroke="#8a5a3c" stroke-width="2"/>
      <path d="M30 86h40" stroke="#8a5a3c" stroke-width="3" stroke-linecap="round"/>
      <g stroke="#f6c453" stroke-width="2.5" stroke-linecap="round"><path d="M22 20l6 6M78 20l-6 6M50 2v6M14 40h7M86 40h-7"/></g>`) },
    { id: "heart", name: "Heart", group: "Love", svg: svg(`
      <path d="M50 86C22 66 10 50 10 34c0-12 9-22 21-22 8 0 15 5 19 12 4-7 11-12 19-12 12 0 21 10 21 22 0 16-12 32-40 52z" fill="#ef6f8a" stroke="#a83252" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M26 30c2-6 8-8 12-6" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>
      <path d="M50 34v26M38 46h24" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`) },
    { id: "crown", name: "Crown", group: "Symbols", svg: svg(`
      <path d="M14 72l-4-40 20 18 20-30 20 30 20-18-4 40z" fill="#f6c453" stroke="#b07d12" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="14" y="72" width="72" height="12" rx="3" fill="#e5a823" stroke="#b07d12" stroke-width="2.5"/>
      <circle cx="50" cy="56" r="6" fill="#c0392b" stroke="#8e1f17" stroke-width="1.5"/>
      <circle cx="30" cy="62" r="4" fill="#2e86c1"/><circle cx="70" cy="62" r="4" fill="#27ae60"/>
      <g fill="#f6c453" stroke="#b07d12" stroke-width="2"><circle cx="10" cy="30" r="4"/><circle cx="50" cy="18" r="4"/><circle cx="90" cy="30" r="4"/></g>`) },
    { id: "ichthys", name: "Fish", group: "Symbols", svg: svg(`
      <path d="M8 50c18-24 50-28 74-4l12-12-4 16 4 16-12-12C58 78 26 74 8 50z" fill="#9fd3e8" stroke="#1f6f8b" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="26" cy="46" r="3" fill="#1f6f8b"/>
      <text x="48" y="56" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="#1f6f8b" letter-spacing="1">ΙΧΘΥΣ</text>`) },
    { id: "bread", name: "Bread", group: "Communion", svg: svg(`
      <path d="M12 60c0-18 18-30 38-30s38 12 38 30c0 10-6 16-16 16H28c-10 0-16-6-16-16z" fill="#e2a65a" stroke="#8a5320" stroke-width="2.5"/>
      <path d="M30 44c4 6 4 12 2 18M48 40c4 7 4 14 2 22M66 44c4 6 4 12 2 18" stroke="#b8732f" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M20 54c6-14 22-18 30-18" stroke="#f6d39b" stroke-width="3" fill="none" stroke-linecap="round"/>`) },
    { id: "cup", name: "Cup", group: "Communion", svg: svg(`
      <path d="M24 16h52c0 26-10 40-26 42-16-2-26-16-26-42z" fill="#d4af37" stroke="#8c6d12" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M28 22h44c-1 8-3 14-6 18H34c-3-4-5-10-6-18z" fill="#8e1f3d"/>
      <path d="M46 58h8v18h-8z" fill="#c9a12c" stroke="#8c6d12" stroke-width="2"/>
      <path d="M30 86c0-6 8-10 20-10s20 4 20 10z" fill="#d4af37" stroke="#8c6d12" stroke-width="2.5" stroke-linejoin="round"/>`) },
    { id: "lily", name: "Lily", group: "Nature", svg: svg(`
      <path d="M50 92V48" stroke="#4f8a3b" stroke-width="3"/>
      <path d="M50 70c-10-10-22-10-28-4 8 2 18 6 28 10M50 78c10-10 22-10 28-4-8 2-18 6-28 10" fill="#7bb661" stroke="#4f8a3b" stroke-width="2"/>
      <path d="M50 50C40 40 28 40 20 30c14-2 24 2 30 10 6-8 16-12 30-10-8 10-20 10-30 20z" fill="#fff" stroke="#c48aa0" stroke-width="2" stroke-linejoin="round"/>
      <path d="M50 50c-6-14-4-28 0-38 4 10 6 24 0 38z" fill="#fdf2f6" stroke="#c48aa0" stroke-width="2"/>
      <g stroke="#e0a43a" stroke-width="2" stroke-linecap="round"><path d="M50 40l-6-10M50 40l6-10M50 40V28"/></g>`) },
    { id: "sunrise", name: "Sunrise", group: "Nature", svg: svg(`
      <defs><linearGradient id="sr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27f"/><stop offset="1" stop-color="#ff9a76"/></linearGradient></defs>
      <rect x="6" y="14" width="88" height="66" rx="14" fill="url(#sr)"/>
      <circle cx="50" cy="66" r="20" fill="#fff4c9"/>
      <g stroke="#fff4c9" stroke-width="3" stroke-linecap="round"><path d="M50 24v10M24 40l7 6M76 40l-7 6M14 60h8M86 60h-8"/></g>
      <path d="M6 66c14-6 26 0 36 4 12 4 22-4 34-6 8-1 14 2 18 4v12H6z" fill="#7a9e7e"/>`) },
    { id: "sheep", name: "Lamb", group: "Nature", svg: svg(`
      <g fill="#fff" stroke="#8b8b8b" stroke-width="2">
      <circle cx="34" cy="50" r="12"/><circle cx="48" cy="42" r="13"/><circle cx="62" cy="48" r="12"/><circle cx="44" cy="58" r="12"/><circle cx="60" cy="60" r="11"/><circle cx="30" cy="62" r="9"/></g>
      <path d="M36 70v14M44 70v14M58 70v14M66 68v14" stroke="#4a4a4a" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="76" cy="44" rx="11" ry="9" fill="#4a4a4a"/><circle cx="79" cy="42" r="2" fill="#fff"/>
      <path d="M70 38c-4-4-8-4-10-2" stroke="#4a4a4a" stroke-width="4" stroke-linecap="round"/>`) },
    { id: "star", name: "Star", group: "Symbols", svg: svg(`
      <path d="M50 8l10 30h32l-26 18 10 32-26-20-26 20 10-32L8 38h32z" fill="#ffd54f" stroke="#c99a06" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M50 22l5 16" stroke="#fff6c4" stroke-width="3" stroke-linecap="round"/>`) },
    { id: "rainbow", name: "Rainbow", group: "Nature", svg: svg(`
      <g fill="none" stroke-width="7" stroke-linecap="round">
      <path d="M10 76a40 40 0 0 1 80 0" stroke="#e74c3c"/><path d="M17 76a33 33 0 0 1 66 0" stroke="#f39c12"/>
      <path d="M24 76a26 26 0 0 1 52 0" stroke="#f1c40f"/><path d="M31 76a19 19 0 0 1 38 0" stroke="#27ae60"/>
      <path d="M38 76a12 12 0 0 1 24 0" stroke="#3498db"/></g>
      <g fill="#fff" stroke="#b9c6d6" stroke-width="2"><circle cx="14" cy="78" r="8"/><circle cx="24" cy="80" r="7"/><circle cx="86" cy="78" r="8"/><circle cx="76" cy="80" r="7"/></g>`) },
    { id: "mountain", name: "Mountain", group: "Nature", svg: svg(`
      <path d="M6 84l30-52 14 20 12-16 32 48z" fill="#7d8fa3" stroke="#4b5a6b" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M36 32l-9 16 6-3 4 5 4-6 4 4z" fill="#fff"/><path d="M62 36l-7 9 5-1 3 4 3-4 4 2z" fill="#fff"/>
      <circle cx="80" cy="22" r="9" fill="#ffd54f"/>`) },
    { id: "anchor", name: "Anchor (hope)", group: "Symbols", svg: svg(`
      <circle cx="50" cy="18" r="8" fill="none" stroke="#2c4a6e" stroke-width="5"/>
      <path d="M50 26v62M34 40h32" stroke="#2c4a6e" stroke-width="6" stroke-linecap="round"/>
      <path d="M16 60c2 18 16 28 34 28s32-10 34-28" fill="none" stroke="#2c4a6e" stroke-width="6" stroke-linecap="round"/>
      <path d="M10 64l6-8 6 8M78 64l6-8 6 8" fill="none" stroke="#2c4a6e" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`) },
    { id: "flame", name: "Flame (Spirit)", group: "Symbols", svg: svg(`
      <path d="M50 8c4 16 26 26 26 50 0 18-12 32-26 32S24 76 24 58c0-12 6-18 12-24 0 10 4 14 8 16-2-16 2-30 6-42z" fill="#ff7b2e" stroke="#c4421a" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M50 44c2 10 14 14 14 28 0 10-6 16-14 16s-14-6-14-16c0-6 4-10 6-12 0 6 2 8 4 8 0-8 2-16 4-24z" fill="#ffd166"/>`) },
    { id: "tree", name: "Mustard tree", group: "Nature", svg: svg(`
      <path d="M46 92V60c-6-4-12-6-18-6M54 92V58c6-4 12-8 20-8M50 66V44" stroke="#7a5230" stroke-width="5" stroke-linecap="round" fill="none"/>
      <g fill="#79b55a" stroke="#4f8a3b" stroke-width="2"><circle cx="50" cy="32" r="18"/><circle cx="30" cy="44" r="14"/><circle cx="70" cy="42" r="15"/><circle cx="42" cy="22" r="10"/><circle cx="60" cy="22" r="10"/></g>
      <g fill="#ffe08a"><circle cx="44" cy="30" r="2.5"/><circle cx="62" cy="38" r="2.5"/><circle cx="30" cy="44" r="2.5"/><circle cx="56" cy="22" r="2"/></g>
      <path d="M30 92h40" stroke="#7a5230" stroke-width="3" stroke-linecap="round"/>`) },
    { id: "wheat", name: "Wheat (harvest)", group: "Nature", svg: svg(`
      <path d="M50 92V20" stroke="#b8862b" stroke-width="3"/>
      <g fill="#e8b84a" stroke="#a8761c" stroke-width="1.5">
      ${[22, 34, 46, 58].map((y) => `<ellipse cx="42" cy="${y}" rx="8" ry="4.5" transform="rotate(-35 42 ${y})"/><ellipse cx="58" cy="${y}" rx="8" ry="4.5" transform="rotate(35 58 ${y})"/>`).join("")}
      <ellipse cx="50" cy="14" rx="4.5" ry="8"/></g>
      <path d="M50 70c-10-4-18-2-22 4M50 76c10-4 18-2 22 4" stroke="#7bb661" stroke-width="3" fill="none" stroke-linecap="round"/>`) },
    { id: "staff", name: "Shepherd's staff", group: "Symbols", svg: svg(`
      <path d="M46 92V30c0-14 8-22 18-22s16 8 16 16c0 8-6 12-10 12" fill="none" stroke="#7a5230" stroke-width="7" stroke-linecap="round"/>
      <path d="M46 92V30c0-14 8-22 18-22" fill="none" stroke="#a87444" stroke-width="2.5" stroke-linecap="round"/>`) },
    { id: "scroll", name: "Scroll", group: "Symbols", svg: svg(`
      <rect x="20" y="20" width="60" height="60" fill="#f6e7c1" stroke="#8a6a3a" stroke-width="2.5"/>
      <rect x="12" y="14" width="10" height="72" rx="5" fill="#a87444" stroke="#6b4423" stroke-width="2"/>
      <rect x="78" y="14" width="10" height="72" rx="5" fill="#a87444" stroke="#6b4423" stroke-width="2"/>
      <g stroke="#b59a6a" stroke-width="2.5" stroke-linecap="round"><path d="M30 34h40M30 44h40M30 54h32M30 64h36"/></g>`) },
    { id: "butterfly", name: "Butterfly (new life)", group: "Nature", svg: svg(`
      <path d="M50 50C40 26 16 18 12 30c-4 12 10 22 38 20zM50 50c10-24 34-32 38-20 4 12-10 22-38 20z" fill="#9b8cf0" stroke="#5a46c2" stroke-width="2"/>
      <path d="M50 52c-10 4-26 14-22 24 4 8 16 0 22-24zM50 52c10 4 26 14 22 24-4 8-16 0-22-24z" fill="#f29bc8" stroke="#b5467f" stroke-width="2"/>
      <path d="M50 30v44" stroke="#3b2f6b" stroke-width="4" stroke-linecap="round"/>
      <path d="M50 30c-2-8-6-12-10-14M50 30c2-8 6-12 10-14" stroke="#3b2f6b" stroke-width="2" fill="none" stroke-linecap="round"/>`) },
    { id: "candle", name: "Candle", group: "Prayer", svg: svg(`
      <path d="M50 10c5 7 7 12 3 17-1 2-5 2-6 0-4-5-2-10 3-17z" fill="#ffb627" stroke="#e07a1f" stroke-width="2"/>
      <path d="M50 26v8" stroke="#333" stroke-width="2"/>
      <rect x="38" y="34" width="24" height="48" rx="4" fill="#fffaf0" stroke="#b9a68f" stroke-width="2.5"/>
      <path d="M44 34c0 6 4 6 4 12" stroke="#e8dcc6" stroke-width="3" fill="none"/>
      <ellipse cx="50" cy="86" rx="22" ry="6" fill="#d4af37" stroke="#8c6d12" stroke-width="2"/>`) },
    { id: "tablets", name: "Stone tablets", group: "Symbols", svg: svg(`
      <path d="M14 86V30c0-10 8-16 17-16s17 6 17 16v56zM52 86V30c0-10 8-16 17-16s17 6 17 16v56z" fill="#c9c3b6" stroke="#6f6a5f" stroke-width="2.5"/>
      <g font-family="Georgia, serif" font-size="11" fill="#6f6a5f" text-anchor="middle"><text x="31" y="40">I</text><text x="31" y="54">II</text><text x="31" y="68">III</text><text x="31" y="82">IV</text>
      <text x="69" y="40">V</text><text x="69" y="54">VI</text><text x="69" y="68">VII</text><text x="69" y="82">VIII</text></g>`) },
    { id: "w-amen", name: "Amen", group: "Words", svg: word("Amen", "#fff4d6", "#9a6b12") },
    { id: "w-selah", name: "Selah", group: "Words", svg: word("Selah", "#eaf2ff", "#2c4a6e") },
    { id: "w-grace", name: "Grace", group: "Words", svg: word("Grace", "#fde8ef", "#a83252") },
    { id: "w-faith", name: "Faith", group: "Words", svg: word("Faith", "#e9f6ec", "#2f7a46") },
    { id: "w-hope", name: "Hope", group: "Words", svg: word("Hope", "#eef0ff", "#4a46a8") },
    { id: "w-love", name: "Love", group: "Words", svg: word("Love", "#ffe9e4", "#c0392b") },
    { id: "w-pray", name: "Pray", group: "Words", svg: word("PRAY", "#fff", "#5b3a29", "Arial, sans-serif", false, 26) },
    { id: "w-blessed", name: "Blessed", group: "Words", svg: word("Blessed", "#fdf1d6", "#7a4a24") },
    { id: "w-hallelujah", name: "Hallelujah", group: "Words", svg: word("Hallelujah", "#fff7c2", "#a07a00", "Georgia, serif", true, 24) },
    { id: "w-bestill", name: "Be still", group: "Words", svg: word("Be still", "#e8f4f8", "#1f6f8b") },
    { id: "w-trust", name: "Trust", group: "Words", svg: word("TRUST", "#f3ecff", "#5a46c2", "Arial, sans-serif", false, 26) },
    { id: "w-thanks", name: "Thank You", group: "Words", svg: word("Thank You", "#fdeee0", "#b0561a", "Georgia, serif", true, 24) },
    { id: "w-answered", name: "Answered!", group: "Words", svg: word("Answered!", "#e9f6ec", "#2f7a46", "Arial, sans-serif", false, 22) },
    { id: "w-promise", name: "Promise", group: "Words", svg: word("Promise", "#fff", "#8e1f3d") },
  ];

  const byId = Object.fromEntries(LIST.map((s) => [s.id, s]));
  const url = (svgText) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText);

  // Washi tape patterns: drawn as CSS backgrounds on a tape item.
  const TAPES = [
    { id: "t-cream", name: "Cream", css: "repeating-linear-gradient(90deg,#f6e7c1 0 12px,#efdcae 12px 24px)" },
    { id: "t-rose", name: "Rose dots", css: "radial-gradient(circle at 6px 6px,#fff 2px,transparent 2.5px) 0 0/14px 14px,#f2a7b8" },
    { id: "t-sky", name: "Sky stripes", css: "repeating-linear-gradient(45deg,#a9d3ef 0 8px,#d7ecfa 8px 16px)" },
    { id: "t-sage", name: "Sage", css: "repeating-linear-gradient(90deg,#b7cfa6 0 6px,#a5c291 6px 8px)" },
    { id: "t-gold", name: "Gold grid", css: "linear-gradient(#e7c96b55 1px,transparent 1px) 0 0/8px 8px,linear-gradient(90deg,#e7c96b55 1px,transparent 1px) 0 0/8px 8px,#f7e3a1" },
    { id: "t-lav", name: "Lavender", css: "repeating-linear-gradient(-45deg,#cbbcf2 0 6px,#e3dafa 6px 12px)" },
    { id: "t-kraft", name: "Kraft", css: "repeating-linear-gradient(0deg,#c8a477 0 2px,#bf9a6c 2px 4px)" },
    { id: "t-cross", name: "Little crosses", css: `url("${url(svg('<path d="M9 4h2v4h4v2h-4v6H9v-6H5V8h4z" fill="#b07d12" opacity=".55"/>', "0 0 20 20"))}") 0 0/20px 20px,#fbefd0` },
  ];

  S.stickers = { LIST, byId, url, TAPES, tapeById: Object.fromEntries(TAPES.map((t) => [t.id, t])) };
})();
