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
    var ul = el("results");
    var countEl = el("resultCount");
    if (!ul) return;
    ul.innerHTML = "";
    if (countEl) countEl.textContent = "We found " + items.length + " results:";

    if (items.length === 0) {
      ul.innerHTML = '<li class="result-empty">No resources match your search criteria. Try adjusting your filters.</li>';
      return;
    }

    items.forEach(function(it, index) {
      var li = document.createElement("li");
      li.className = "result-item";
      var directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(it.address);
      var detailsId = "details-" + index;

      li.innerHTML =
        '<div class="result-number"><span>' + (index + 1) + '</span></div>' +
        '<div class="result-name notranslate">' + it.name + '</div>' +
        '<div class="result-address notranslate">' + it.address + '</div>' +
        '<div class="result-toggle" onclick="document.getElementById(\'' + detailsId + '\').classList.toggle(\'show\'); this.querySelector(\'span\').textContent = document.getElementById(\'' + detailsId + '\').classList.contains(\'show\') ? \'Hide details  −\' : \'Show details  +\'">' +
          '<span>Show details  +</span>' +
        '</div>' +
        '<div class="result-details" id="' + detailsId + '">' +
          '<hr style="border:none;border-top:2px solid #fff;margin:0;">' +
          '<div class="result-tags">' +
            (it.tags || []).map(function(t) { return '<span class="tag">' + t.replace(/_/g, ' ') + '</span>'; }).join('') +
          '</div>' +
          '<hr style="border:none;border-top:2px solid #fff;margin:0;">' +
          '<div class="result-hours"><strong>Hours:</strong> ' + (it.hours ? formatHours(it.hours) : 'Contact for hours') + '</div>' +
          '<hr style="border:none;border-top:2px solid #fff;margin:0;">' +
          '<div class="result-contact">' +
            (it.phone ? '<a class="result-btn notranslate" href="tel:' + it.phone + '">📞 ' + it.phone + '</a>' : '') +
            (it.website ? '<a class="result-btn" href="' + it.website.trim() + '" target="_blank">🌐 Website</a>' : '') +
            '<a class="result-btn result-btn-green" href="' + directionsUrl + '" target="_blank">🗺️ Directions</a>' +
          '</div>' +
        '</div>';

      li.onclick = function(e) {
        if (e.target.closest('.result-toggle') || e.target.closest('.result-btn')) return;
        if (map) {
          map.panTo(it.location);
          map.setZoom(15);
          var marker = markers.find(function(m) {
            return m.getPosition().lat() === it.location.lat && m.getPosition().lng() === it.location.lng;
          });
          if (marker) google.maps.event.trigger(marker, 'click');
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

      // Service filter – match tags OR text for HOME_TAGS
      if (service) {
        var sTags = (s.tags || []).map(function(t) { return t.trim().toLowerCase(); });
        var serviceKey = service.toLowerCase();
        var serviceText = service.replace(/_/g, ' ').toLowerCase();
        var tagMatch = sTags.includes(serviceKey);
        var textMatch = text.includes(serviceText);
        if (!tagMatch && !textMatch) return false;
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
    var qEl = el("q");
    var typeEl = el("type");
    var dayEl = el("openDay");
    var radiusEl = el("radius");
    var serviceEl = el("service");

    if (qEl) qEl.value = "";
    if (typeEl) typeEl.value = "";
    if (dayEl) dayEl.value = "";
    if (radiusEl) radiusEl.value = "99999";
    if (serviceEl) serviceEl.value = "";
    
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
        URL PARAM HANDLING
  ------------------------------ */
  function applyUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var tag = params.get('tag');
    if (tag) {
      var serviceEl = el('service');
      if (serviceEl) {
        var tagKey = tag.replace(/-/g, '_');
        var options = serviceEl.options;
        for (var i = 0; i < options.length; i++) {
          if (options[i].value === tagKey || options[i].value === tag) {
            serviceEl.value = options[i].value;
            break;
          }
        }
        if (!serviceEl.value && el('q')) {
          el('q').value = tag.replace(/[-_]/g, ' ');
        }
      }
    }
  }

  /* ------------------------------
              BOOT
  ------------------------------ */
  function boot() {
    setupEvents();
    setupShare();
    loadData();
    setTimeout(function() {
      applyUrlParams();
      applyFilters();
    }, 300);
  }

  // Only boot if we're on a page with the required elements
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  return { initMap };
})();