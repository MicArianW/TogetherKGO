// TogetherKGO - Find Resources App
window.__APP = (function () {
  let map,
    markers = [],
    services = [],
    center = { lat: 43.7648, lng: -79.1810 }; // KGO area
  let info;

  const el = (id) => document.getElementById(id);

  /* ------------------------------
     LOAD SERVICES JSON
  ------------------------------ */
  async function loadData() {
  try {
    const resp = await fetch("data/services.json");
    services = (await resp.json()).filter(s => s.type !== "placeholder"); // exclude placeholders

    // Immediately show results list
    applyFilters();

    // If map is already initialized, draw markers now
    if (map) renderMarkers(services);
  } catch (err) {
    console.error("Failed to load services.json", err);
    if (el("results")) {
      el("results").innerHTML = '<li style="padding: 20px; text-align: center; color: #888;">Unable to load resources. Please refresh the page.</li>';
    }
  }
  }

  /* ------------------------------
            INIT MAP
  ------------------------------ */
  function initMap() {
    const mapEl = el("map");
    if (!mapEl) return;

    map = new google.maps.Map(mapEl, {
      center,
      zoom: 13,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    info = new google.maps.InfoWindow();

    // Draw markers if data is already loaded
    if (services.length > 0) {
      renderMarkers(services);
    }
  }

  /* ------------------------------
        DISTANCE CALCULATOR
  ------------------------------ */
  function kmDistance(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * (Math.PI / 180);
    const dLng = (b.lng - a.lng) * (Math.PI / 180);
    const s1 =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * (Math.PI / 180)) *
        Math.cos(b.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s1));
  }

  /* ------------------------------
   Helper to format hours object
  ------------------------------*/

function formatHours(hoursObj) {
  if (!hoursObj) return "Contact for hours";

  const daysOrder = ["mon","tue","wed","thu","fri","sat","sun"];
  const dayNames = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday"
  };

  // Step 1: Normalize hours per day
  const dayTimes = daysOrder
    .filter(d => hoursObj[d] && (hoursObj[d].open || hoursObj[d].close))
    .map(d => {
      const opens = (hoursObj[d].open || "").split(",").map(s => s.trim()).filter(Boolean);
      const closes = (hoursObj[d].close || "").split(",").map(s => s.trim()).filter(Boolean);

      const ranges = [];
      const len = Math.max(opens.length, closes.length);
      for (let i = 0; i < len; i++) {
        const o = opens[i] || "";
        const c = closes[i] || "";
        if (o && c) ranges.push(`${o}-${c}`);
        else if (o) ranges.push(o);
        else if (c) ranges.push(c);
      }

      return { day: d, times: ranges.join(" & ") }; // join multiple ranges with &
    });

  if (!dayTimes.length) return "Contact for hours";

  // Step 2: Group days with identical times
  const grouped = [];
  let lastTimes = null;
  let daysGroup = [];

  dayTimes.forEach(({ day, times }, idx) => {
    if (times === lastTimes) {
      daysGroup.push(day);
    } else {
      if (daysGroup.length > 0) {
        grouped.push({ days: [...daysGroup], times: lastTimes });
      }
      lastTimes = times;
      daysGroup = [day];
    }

    if (idx === dayTimes.length - 1) {
      grouped.push({ days: [...daysGroup], times: lastTimes });
    }
  });

  // Step 3: Format grouped days
  return grouped
    .map(g => {
      const dayLabels = g.days.map(d => dayNames[d]);
      let dayStr = "";
      if (dayLabels.length === 1) dayStr = dayLabels[0];
      else if (dayLabels.length === 2) dayStr = dayLabels.join(" and ");
      else dayStr = dayLabels.slice(0, -1).join(", ") + " and " + dayLabels.slice(-1);
      return `${dayStr}: ${g.times}`;
    })
    .join(" • ");
}

  /* ------------------------------
        RENDER MARKERS
  ------------------------------ */
  function renderMarkers(items) {
    if (!map) return;

    markers.forEach((m) => m.setMap(null));
    markers = [];

    items.forEach((item) => {
      const m = new google.maps.Marker({
        position: item.location,
        map,
        title: item.name,
        animation: google.maps.Animation.DROP,
      });

      m.addListener("click", () => {
        const contactInfo = [];
        if (item.phone) contactInfo.push(`<div>📞 ${item.phone}</div>`);
        if (item.email) contactInfo.push(`<div>📧 ${item.email}</div>`);
        
        // Google Maps directions link
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address)}`;
        contactInfo.push(`<div><a href="${directionsUrl}" target="_blank" style="color: #1e40af;">🗺️ Get Directions</a></div>`);
        
        if (item.website) contactInfo.push(`<div><a href="${item.website}" target="_blank">🌐 Website</a></div>`);

        info.setContent(`
          <div style="max-width:300px; padding: 8px;">
            <strong style="font-size: 16px;">${item.name}</strong><br/>
            <div style="margin: 8px 0; color: #555;">${item.address}</div>
            <div style="margin: 8px 0;">
              <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${item.type.replace('_', ' ')}</span>
            </div>
            <div class="subtle"><strong>Hours:</strong> ${item.hours ? formatHours(item.hours) : "Contact for hours"}</div>
            ${contactInfo.length > 0 ? '<div style="margin: 10px 0; padding-top: 8px; border-top: 1px solid #ddd;">' + contactInfo.join('') + '</div>' : ''}
            <div style="margin-top: 10px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address)}" 
                 target="_blank" 
                 style="background: #22c55e; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; display: inline-block;">
                Get Directions
              </a>
            </div>
          </div>
        `);
        info.open(map, m);
      });

      markers.push(m);
    });

    // Fit map bounds to show all markers
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach(m => bounds.extend(m.getPosition()));
      map.fitBounds(bounds);
      
      // Don't zoom in too much
      const listener = google.maps.event.addListener(map, "idle", function() {
        if (map.getZoom() > 15) map.setZoom(15);
        google.maps.event.removeListener(listener);
      });
    }
  }

  /* ------------------------------
       LIST RESULTS
  ------------------------------ */
  function listResults(items) {
    const ul = el("results");
    const countEl = el("resultCount");
    
    if (!ul) return;

    ul.innerHTML = "";
    
    if (countEl) {
      countEl.textContent = `${items.length} food resource${items.length !== 1 ? 's' : ''} found`;
    }

    if (items.length === 0) {
      ul.innerHTML = '<li style="padding: 20px; text-align: center; color: #888;">No resources match your search criteria. Try adjusting your filters.</li>';
      return;
    }

    items.forEach((it) => {
      const li = document.createElement("li");
      
      const contactInfo = [];
      if (it.phone) contactInfo.push(`📞 ${it.phone}`);
      
      // Google Maps directions link (green, like website)
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(it.address)}`;
      contactInfo.push(`<a href="${directionsUrl}" target="_blank" style="color: #22c55e;">🗺️ Directions</a>`);
      
      if (it.website) contactInfo.push(`<a href="${it.website}" target="_blank" style="color: #22c55e;">🌐 Website</a>`);
      
      li.innerHTML = `
        <div><strong>${it.name}</strong></div>
        <div class="subtle">${it.address}</div>
        <div style="margin: 8px 0;">
          ${(it.tags || [])
            .map((t) => `<span class="badge">${t.replace('_', ' ')}</span>`)
            .join("")}
        </div>
        <div class="subtle"><strong>Hours:</strong> ${it.hours ? formatHours(it.hours) : "Contact for hours"}</div>
        ${contactInfo.length > 0 ? '<div class="subtle" style="margin-top: 6px;">' + contactInfo.join(' • ') + '</div>' : ''}
      `;

      // Click result -> scroll to top, center map, open info window
      li.onclick = () => {
        // Smooth scroll to top of page
        const mapEl = document.getElementById("map");
        if (mapEl) {
          mapEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        if (map) {
          map.panTo(it.location);
          map.setZoom(15);
          
          // Find and click the corresponding marker
          const marker = markers.find(m => 
            m.getPosition().lat() === it.location.lat && 
            m.getPosition().lng() === it.location.lng
          );
          if (marker) {
            google.maps.event.trigger(marker, 'click');
          }
        }
      };

      ul.appendChild(li);
    });
  }

  /* ------------------------------
        FILTER ENGINE
  ------------------------------ */
  function applyFilters() {
    const qEl = el("q"); //search query
    const typeEl = el("type"); //community organization
    const dayEl = el("openDay"); //day open
    const radiusEl = el("radius"); //deprecated
    const serviceEl = el("service");  //hot food, food bank etc.

    //filtering can silently fail if the service dropdown loads later.
    if (!qEl || !typeEl || !dayEl || !radiusEl || !serviceEl) return;

    const q = qEl.value.toLowerCase().trim();
    const type = typeEl.value;
    const day = dayEl.value;
    const radius = parseInt(radiusEl.value, 10);
    const service = serviceEl ? serviceEl.value : "";

    // Safet alternative
    let mapCenter = center;
    if (map && map.getCenter()) {
      mapCenter = map.getCenter().toJSON();
    }

    const filtered = services.filter((s) => {

      const text = [
        s.name,
        s.address,
        s.description,
        ...(s.tags || []).map(t => t.replace(/_/g, " "))
      ]
        .join(" ")
        .toLowerCase();

      if (q && !text.includes(q)) return false;

      if (type && s.type !== type) return false;

      // Day filter
      if (day) {
        if (!s.hours || !s.hours[day]) return false;
      }

      // Service filter / protect against multiple tags 
      if (service) {
        const tags = (s.tags || []).map(t => t.trim().toLowerCase());
        if (!tags.includes(service.toLowerCase())) return false;
      }

      // Radius filter
      if (radius < 90000) {
        if (!s.location) return false;
        const d = kmDistance(mapCenter, s.location);
        if (d * 1000 > radius) return false;
      }

      return true;
    });

    listResults(filtered);

    if (map) renderMarkers(filtered);
  }

  /* ------------------------------
       RESET FILTERS
  ------------------------------ */
  function resetFilters() {
    const qEl = el("q");
    const typeEl = el("type");
    const dayEl = el("openDay");
    const radiusEl = el("radius");

    if (qEl) qEl.value = "";
    if (typeEl) typeEl.value = "";
    if (dayEl) dayEl.value = "";
    if (radiusEl) radiusEl.value = "99999";
    
    applyFilters();
  }

  /* ------------------------------
        EVENT BINDINGS
  ------------------------------ */
  function setupEvents() {
    const applyBtn = el("applyBtn");
    const resetBtn = el("resetBtn");

    if (applyBtn) applyBtn.onclick = applyFilters;
    if (resetBtn) resetBtn.onclick = resetFilters;

    // Real-time search on input
    const qEl = el("q");
    if (qEl) {
      qEl.addEventListener("input", applyFilters);
    }
  }

  /* ------------------------------
        SHARE FUNCTIONALITY
  ------------------------------ */
  function setupShare() {
    const shareBtn = el("shareBtn");
    if (!shareBtn) return;

    shareBtn.onclick = async () => {
      const shareData = {
        title: 'TogetherKGO - Find Resources',
        text: 'Find community resources in the Kingston-Galloway-Orton Park area',
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard!');
        }
      } catch (err) {
        console.log('Share failed:', err);
      }
    };
  }

  /* ------------------------------
              BOOT
  ------------------------------ */
  function boot() {
    setupEvents();
    setupShare();
    loadData();
  }

  // Only boot if we're on a page with the required elements
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  return { initMap };
})();
