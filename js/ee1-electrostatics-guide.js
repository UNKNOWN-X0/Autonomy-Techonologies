
      var KEY = "ee1-checks",
        saved = {};
      try {
        saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      } catch (e) {}
      document.querySelectorAll("li.check input").forEach(function (cb) {
        cb.checked = !!saved[cb.dataset.k];
        cb.addEventListener("change", function () {
          saved[cb.dataset.k] = cb.checked;
          try {
            localStorage.setItem(KEY, JSON.stringify(saved));
          } catch (e) {}
        });
      });
    