(function () {
  const moduleIds = ["persistence", "security", "observability", "notifications", "localization"];
  const toggles = document.querySelectorAll(".lp-toggle");
  const codeModule = document.getElementById("code-module");
  const panel = document.getElementById("code-panel");

  function getKey() {
    return moduleIds.map(function (id) {
      const btn = document.querySelector('[data-module="' + id + '"]');
      return btn && btn.dataset.active === "true" ? "1" : "0";
    }).join("");
  }

  function render() {
    const key = getKey();
    const tpl = panel.querySelector('template[data-combo="' + key + '"]');
    if (tpl) {
      codeModule.innerHTML = tpl.innerHTML;
    }
  }

  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const isActive = btn.dataset.active === "true";
      btn.dataset.active = isActive ? "false" : "true";
      render();
    });
  });

  // Tab switching
  const tabs = document.querySelectorAll(".lp-code-tab");
  const panels = document.querySelectorAll(".lp-code-content > div[data-panel]");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const target = tab.dataset.tab;
      tabs.forEach(function (t) {
        t.setAttribute("aria-selected", "false");
      });
      tab.setAttribute("aria-selected", "true");
      panels.forEach(function (p) {
        p.dataset.visible = p.dataset.panel === target ? "true" : "false";
      });
    });
  });
})();
