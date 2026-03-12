// TogetherKGO - Resources Page App
window.__RESOURCES_APP = (function () {
    let resources = [];
  
    const el = (id) => document.getElementById(id);
  
    async function loadData() {
      try {
        const resp = await fetch("data/resources.json");
        resources = await resp.json();
        applyFilters();
      } catch (err) {
        console.error("Failed to load resources.json", err);
        const results = el("results");
        if (results) {
          results.innerHTML =
            '<li style="padding: 20px; text-align: center; color: #888;">Unable to load resources. Please refresh the page.</li>';
        }
      }
    }
  
    function listResults(items) {
      const ul = el("results");
      const countEl = el("resultCount");
  
      if (!ul) return;
  
      ul.innerHTML = "";
  
      if (countEl) {
        countEl.textContent = `${items.length} resource${items.length !== 1 ? "s" : ""} found`;
      }
  
      if (items.length === 0) {
        ul.innerHTML =
          '<li style="padding: 20px; text-align: center; color: #888;">No resources match your search criteria. Try adjusting your filters.</li>';
        return;
      }
  
      items.forEach((item) => {
        const li = document.createElement("li");
  
        li.innerHTML = `
          <div><strong>${item.title || ""}</strong></div>
          <div class="subtle">${item.organization || ""}</div>
          <div style="margin: 8px 0;">
            ${(item.tags || [])
              .map((tag) => `<span class="badge">${tag.replace(/_/g, " ")}</span>`)
              .join("")}
          </div>
          <div class="subtle">${item.description || ""}</div>
          <div class="subtle" style="margin-top: 6px;">
            ${item.website ? `<a href="${item.website}" target="_blank" style="color: #22c55e;">🌐 Website</a>` : ""}
            ${item.additional_link ? ` • <a href="${item.additional_link}" target="_blank" style="color: #22c55e;">Additional Link</a>` : ""}
          </div>
        `;
  
        ul.appendChild(li);
      });
    }
  
    function applyFilters() {
      const qEl = el("q");
      const typeEl = el("type");
      const regionEl = el("region");
  
      if (!qEl || !typeEl || !regionEl) return;
  
      const q = qEl.value.toLowerCase().trim();
      const type = typeEl.value;
      const region = regionEl.value;
  
      const filtered = resources.filter((resource) => {
        const searchableText = [
          resource.title || "",
          resource.organization || "",
          ...(resource.tags || []).map((tag) => tag.replace(/_/g, " "))
        ]
          .join(" ")
          .toLowerCase();
  
        const matchesSearch = !q || searchableText.includes(q);
        const matchesType = !type || resource.type === type;
        const matchesRegion = !region || resource.region_served === region;
  
        return matchesSearch && matchesType && matchesRegion;
      });
  
      listResults(filtered);
    }
  
    function resetFilters() {
      const qEl = el("q");
      const typeEl = el("type");
      const regionEl = el("region");
  
      if (qEl) qEl.value = "";
      if (typeEl) typeEl.value = "";
      if (regionEl) regionEl.value = "";
  
      applyFilters();
    }
  
    function setupEvents() {
      const applyBtn = el("applyBtn");
      const resetBtn = el("resetBtn");
      const qEl = el("q");
  
      if (applyBtn) applyBtn.onclick = applyFilters;
      if (resetBtn) resetBtn.onclick = resetFilters;
      if (qEl) qEl.addEventListener("input", applyFilters);
    }
  
    function boot() {
      setupEvents();
      loadData();
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  
    return {};
  })();
