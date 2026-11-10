/*!
 * Threadflank try-on widget — drop on any product page:
 *
 *   <script src="https://YOUR-APP/widget.js" data-threadflank-key="tfw_…" async></script>
 *
 * Optional: put data-threadflank-tryon on your own button (with data-image="…" for the
 * garment photo). Without it, a floating "Try it on" button is added and the page's
 * og:image is used as the garment.
 */
(function () {
  var script = document.currentScript || document.querySelector("script[data-threadflank-key]");
  if (!script) return;
  var key = script.getAttribute("data-threadflank-key");
  if (!key) return;
  var appOrigin = new URL(script.src).origin;

  function garmentImage(el) {
    var explicit = el && el.getAttribute("data-image");
    if (explicit) return explicit;
    var og = document.querySelector('meta[property="og:image"]');
    return og ? og.getAttribute("content") : "";
  }

  function open(el) {
    var params = new URLSearchParams({
      key: key,
      image: garmentImage(el) || "",
      product: location.href,
      origin: location.origin,
      title: document.title.slice(0, 80),
    });
    var overlay = document.createElement("div");
    overlay.setAttribute("style", "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:12px");
    var frame = document.createElement("iframe");
    frame.src = appOrigin + "/embed/try-on?" + params.toString();
    frame.title = "Virtual try-on";
    frame.allow = "camera";
    frame.setAttribute("style", "width:min(440px,100%);height:min(760px,100%);border:0;border-radius:20px;background:#0b0b1e");
    overlay.appendChild(frame);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    function close() {
      overlay.remove();
      window.removeEventListener("message", onMessage);
    }
    function onMessage(e) {
      if (e.origin === appOrigin && e.data === "threadflank:close") close();
    }
    window.addEventListener("message", onMessage);
    document.body.appendChild(overlay);
  }

  function init() {
    var targets = document.querySelectorAll("[data-threadflank-tryon]");
    if (targets.length) {
      targets.forEach(function (el) {
        el.addEventListener("click", function (e) {
          e.preventDefault();
          open(el);
        });
      });
      return;
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "✨ Try it on";
    btn.setAttribute(
      "style",
      "position:fixed;right:20px;bottom:20px;z-index:2147483646;padding:12px 20px;border:0;border-radius:999px;background:#6645eb;color:#fff;font:600 14px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);cursor:pointer"
    );
    btn.addEventListener("click", function () {
      open(null);
    });
    document.body.appendChild(btn);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
