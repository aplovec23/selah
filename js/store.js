/* Storage shared by every platform.
 *
 * Keys are short strings like "day/2026-11-01" or "photo/abc123"; values are JSON.
 * - Windows/Electron: window.selahNative (preload.js) writes files in the app's data folder.
 * - Mac/iPad/iPhone: the Swift shell answers window.webkit.messageHandlers.selah.
 * - Plain browser (for testing): IndexedDB.
 */
(function () {
  const S = (window.Selah = window.Selah || {});

  function appleBridge() {
    const h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.selah;
    if (!h) return null;
    return (op, args) => h.postMessage(Object.assign({ op }, args || {}));
  }

  function androidBridge() {
    const A = window.SelahAndroid;
    if (!A) return null;
    const waiting = new Map();
    let next = 1;
    window.__selahReply = (id, value) => {
      const done = waiting.get(id);
      waiting.delete(id);
      if (done) done(value);
    };
    return (op, args) =>
      new Promise((resolve) => {
        const id = String(next++);
        waiting.set(id, resolve);
        A.call(id, op, JSON.stringify(args || {}));
      });
  }

  function electronBridge() {
    return window.selahNative ? (op, args) => window.selahNative.call(op, args || {}) : null;
  }

  function idbBridge() {
    let dbp;
    const db = () =>
      (dbp =
        dbp ||
        new Promise((res, rej) => {
          const r = indexedDB.open("selah", 1);
          r.onupgradeneeded = () => r.result.createObjectStore("kv");
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        }));
    const tx = async (mode, fn) => {
      const d = await db();
      return new Promise((res, rej) => {
        const t = d.transaction("kv", mode);
        const req = fn(t.objectStore("kv"));
        t.oncomplete = () => res(req && req.result);
        t.onerror = () => rej(t.error);
      });
    };
    return async (op, a) => {
      switch (op) {
        case "get":
          return (await tx("readonly", (s) => s.get(a.key))) ?? null;
        case "set":
          return tx("readwrite", (s) => s.put(a.value, a.key));
        case "del":
          return tx("readwrite", (s) => s.delete(a.key));
        case "list":
          return ((await tx("readonly", (s) => s.getAllKeys())) || []).filter((k) => k.startsWith(a.prefix || ""));
        case "setWidget":
          return null;
        case "saveFile": {
          const url = URL.createObjectURL(new Blob([a.text], { type: "application/json" }));
          const link = Object.assign(document.createElement("a"), { href: url, download: a.name });
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          return true;
        }
        case "savePhoto": {
          Object.assign(document.createElement("a"), { href: a.dataUrl, download: a.name }).click();
          return true;
        }
        default:
          return null;
      }
    };
  }

  const call = appleBridge() || androidBridge() || electronBridge() || idbBridge();
  S.platform = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.selah
    ? "apple"
    : window.SelahAndroid
    ? "android"
    : window.selahNative
    ? "electron"
    : "browser";

  S.store = {
    get: (key) => call("get", { key }),
    set: (key, value) => call("set", { key, value }),
    del: (key) => call("del", { key }),
    list: (prefix) => call("list", { prefix }),
    /** Hand today's and upcoming verses to the widget (native platforms only). */
    setWidget: (data) => call("setWidget", { value: data }),
    /** Save a text file where the person chooses (export). */
    saveFile: (name, text) => call("saveFile", { name, text }),
    raw: call,
  };
})();
