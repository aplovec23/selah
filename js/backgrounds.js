/* Page backgrounds. Lines are spaced 32px to match the writing line height. */
(function () {
  const S = (window.Selah = window.Selah || {});
  const L = 32; // line spacing
  const OFF = 26; // puts each rule just under a line of text (page text starts 64px down)

  const plain = (id, name, color, dark = false) => ({ id, name, group: "Plain", css: color, dark });
  const lined = (id, name, paper, line, margin, gap = L) => ({
    id, name, group: "Notebook",
    css: `${margin ? `linear-gradient(90deg,transparent 58px,${margin} 58px,${margin} 60px,transparent 60px),` : ""}` +
      `repeating-linear-gradient(180deg,transparent 0 ${gap - 1}px,${line} ${gap - 1}px ${gap}px) 0 ${OFF}px,${paper}`,
  });

  const LIST = [
    plain("white", "White", "#ffffff"),
    plain("cream", "Cream", "#fbf6ea"),
    plain("ivory", "Ivory", "#fffdf6"),
    plain("blush", "Blush", "#fdeef0"),
    plain("mint", "Mint", "#edf7f0"),
    plain("sky", "Sky", "#ebf4fb"),
    plain("lavender", "Lavender", "#f2effb"),
    plain("butter", "Butter", "#fff8dc"),
    plain("sand", "Sand", "#f3e9da"),
    plain("night", "Night", "#1f2430", true),

    lined("college", "College ruled", "#fffef8", "#a9c7e8", "#e8a0a0"),
    lined("wide", "Wide ruled", "#fffef8", "#a9c7e8", "#e8a0a0", 64),
    lined("plain-lines", "Lines only", "#ffffff", "#d6d6d6", null),
    lined("legal", "Legal pad", "#fff7b8", "#9ec0e0", "#e07a7a"),
    lined("pink-lines", "Pink lines", "#fff6f8", "#f3c2cf", "#e7a0b4"),
    lined("sage-lines", "Sage lines", "#f6faf3", "#c4d9b8", null),
    {
      id: "grid", name: "Grid", group: "Notebook",
      css: "linear-gradient(#dfe7ef 1px,transparent 1px) 0 26px/32px 32px,linear-gradient(90deg,#dfe7ef 1px,transparent 1px) 12px 0/32px 32px,#ffffff",
    },
    {
      id: "graph", name: "Graph paper", group: "Notebook",
      css: "linear-gradient(#b9d7c4 1px,transparent 1px) 0 0/80px 80px,linear-gradient(90deg,#b9d7c4 1px,transparent 1px) 0 0/80px 80px," +
        "linear-gradient(#e3efe7 1px,transparent 1px) 0 0/16px 16px,linear-gradient(90deg,#e3efe7 1px,transparent 1px) 0 0/16px 16px,#fbfefc",
    },
    { id: "dots", name: "Dot grid", group: "Notebook", css: "radial-gradient(circle,#c3c8d0 1.2px,transparent 1.6px) 0 10px/32px 32px,#ffffff" },
    { id: "cream-dots", name: "Cream dots", group: "Notebook", css: "radial-gradient(circle,#cbb994 1.2px,transparent 1.6px) 0 10px/32px 32px,#fbf6ea" },
    {
      id: "kraft", name: "Kraft paper", group: "Paper",
      css: "radial-gradient(circle at 20% 30%,#0000000a 0 2px,transparent 3px) 0 0/37px 41px,radial-gradient(circle at 70% 60%,#ffffff12 0 1.5px,transparent 2.5px) 0 0/23px 29px,#d9b98c",
    },
    {
      id: "parchment", name: "Parchment", group: "Paper",
      css: "radial-gradient(ellipse at center,#fbf1d9 0%,#f3e2bb 70%,#e6cf9c 100%)",
    },
    {
      id: "watercolor", name: "Watercolor wash", group: "Paper",
      css: "radial-gradient(circle at 15% 10%,#f9d8e566 0 160px,transparent 280px),radial-gradient(circle at 90% 30%,#cfe6f766 0 180px,transparent 320px)," +
        "radial-gradient(circle at 30% 85%,#d9f0d866 0 200px,transparent 340px),#fffdf9",
    },
    {
      id: "sunrise", name: "Morning light", group: "Paper",
      css: "linear-gradient(180deg,#fff1d6 0%,#fffaf2 35%,#ffffff 100%)",
    },
  ];

  S.backgrounds = { LIST, byId: Object.fromEntries(LIST.map((b) => [b.id, b])), LINE: L };
})();
