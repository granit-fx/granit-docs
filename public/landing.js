(function () {
  var moduleIds = ["persistence", "security", "observability", "notifications", "localization"];
  var toggles = document.querySelectorAll(".lp-toggle");
  var codeModule = document.getElementById("code-module");
  var panel = document.getElementById("code-panel");

  function getKey() {
    return moduleIds.map(function (id) {
      var btn = document.querySelector('[data-module="' + id + '"]');
      return btn && btn.getAttribute("data-active") === "true" ? "1" : "0";
    }).join("");
  }

  function render() {
    var key = getKey();
    var tpl = panel.querySelector('template[data-combo="' + key + '"]');
    if (tpl) {
      codeModule.innerHTML = tpl.innerHTML;
    }
  }

  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var isActive = btn.getAttribute("data-active") === "true";
      btn.setAttribute("data-active", isActive ? "false" : "true");
      render();
    });
  });

  // Tab switching
  var tabs = document.querySelectorAll(".lp-code-tab");
  var panels = document.querySelectorAll(".lp-code-content > div[data-panel]");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");
      tabs.forEach(function (t) {
        t.setAttribute("aria-selected", "false");
      });
      tab.setAttribute("aria-selected", "true");
      panels.forEach(function (p) {
        p.setAttribute(
          "data-visible",
          p.getAttribute("data-panel") === target ? "true" : "false"
        );
      });
    });
  });
})();
