// community-board.js – Figma Design

function isValidDateValue(value) {
  return !!value && !isNaN(new Date(value).getTime());
}

function toDateOrNull(value) {
  return isValidDateValue(value) ? new Date(value) : null;
}

function stringifyValue(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.map(stringifyValue).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    if (typeof value.label === "string") return value.label.trim();
    if (typeof value.value === "string") return value.value.trim();
    if (typeof value.text === "string") return value.text.trim();
    if (typeof value.start === "string" && typeof value.end === "string") {
      return value.start + " - " + value.end;
    }
    try {
      return JSON.stringify(value);
    } catch (err) {
      return String(value);
    }
  }
  return String(value);
}

function isMeaningfulText(value) {
  if (value == null) return false;
  var text = String(value).trim();
  if (!text) return false;
  return !/^(na|n\/a|none|null|undefined)$/i.test(text);
}

function normalizeTextValue(value) {
  if (!isMeaningfulText(value)) return "";
  return String(value).trim();
}

function titleCaseWeekday(key) {
  var names = {
    mon: "Mondays",
    tue: "Tuesdays",
    wed: "Wednesdays",
    thu: "Thursdays",
    fri: "Fridays",
    sat: "Saturdays",
    sun: "Sundays"
  };
  return names[key] || key;
}

function normalizeTimeRangeText(open, close) {
  var start = normalizeTextValue(open);
  var end = normalizeTextValue(close);
  if (start && end) return start + "-" + end;
  return start || end;
}

function joinWithAnd(items) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return items[0] + " and " + items[1];
  return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

function formatScheduleObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";

  var groups = {};
  Object.keys(value).forEach(function(dayKey) {
    var entry = value[dayKey];
    if (!entry || typeof entry !== "object") return;
    var timeRange = normalizeTimeRangeText(entry.open, entry.close);
    if (!timeRange) return;
    if (!groups[timeRange]) groups[timeRange] = [];
    groups[timeRange].push(titleCaseWeekday(dayKey));
  });

  var segments = Object.keys(groups).map(function(timeRange) {
    return joinWithAnd(groups[timeRange]) + ", " + timeRange;
  });

  return segments.join("; ");
}

function formatWhenValue(value) {
  if (typeof value === "object" && value && !Array.isArray(value)) {
    var scheduleText = formatScheduleObject(value);
    if (scheduleText) return scheduleText;
  }
  return stringifyValue(value);
}

function truncateText(value, limit) {
  var text = normalizeTextValue(value);
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.slice(0, limit).trim() + "...";
}

function getVersionedImageSrc(post) {
  var imgSrc = normalizeTextValue(post && post.image);
  if (!imgSrc) return "";

  var versionSeed = normalizeTextValue(
    (post && post.date) ||
    (post && post.expiresDate) ||
    (post && post.title) ||
    "1"
  );

  if (!versionSeed) return imgSrc;

  return imgSrc + (imgSrc.indexOf("?") === -1 ? "?v=" : "&v=") + encodeURIComponent(versionSeed);
}

function extractFirstUrl(value) {
  var text = normalizeTextValue(value);
  if (!text) return "";
  var match = text.match(/https?:\/\/[^\s)]+/i);
  return match ? match[0] : "";
}

function stripUrlsFromText(value) {
  var text = normalizeTextValue(value);
  if (!text) return "";
  return text
    .replace(/https?:\/\/[^\s)]+/gi, "")
    .replace(/\(\s*Example\s*\)/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function getCardAboutPreview(post) {
  var preview = truncateText(stripUrlsFromText(post.message), 110);
  return preview ? "About information: " + preview : "More details available in this post.";
}

function getCardDetail(post) {
  var whenText = getWhenText(post);
  if (whenText) {
    return { label: "When", value: whenText };
  }

  return {
    label: "About",
    value: truncateText(stripUrlsFromText(post.message), 90) || "More details available in this post."
  };
}

function getNextOccurrenceDate(post) {
  if (post.type !== "recurring_event" || !post.recurringDates) return null;

  // Checking schedule
  //var today = new Date("2026-04-29")
  var today = new Date(); // keep real date now
  today.setHours(0, 0, 0, 0);

  var startBoundary = toDateOrNull(post.startRecurringDates);
  if (startBoundary) startBoundary.setHours(0, 0, 0, 0);

  var weekdayMap = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
  };

  var candidates = [];

  Object.keys(post.recurringDates).forEach(function(dayKey) {
    if (!weekdayMap.hasOwnProperty(dayKey)) return;

    var targetDay = weekdayMap[dayKey];
    var currentDay = today.getDay();
    var diff = targetDay - currentDay;

    if (diff < 0) diff += 7;

    var nextDate = new Date(today);
    nextDate.setDate(today.getDate() + diff);
    nextDate.setHours(0, 0, 0, 0);

    if (startBoundary && nextDate < startBoundary) return;

    candidates.push(nextDate);

  });

  if (!candidates.length) {
    return null;
  }

  var winner = new Date(Math.min.apply(null, candidates));

  return winner;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setDisplayById(id, value) {
  var element = document.getElementById(id);
  if (element) element.style.display = value;
}

function isTranslatedLanguageActive() {
  var match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!match) return false;
  return !/\/en\/en$/i.test(match[1]);
}

function ensurePostTranslationCache() {
  var cache = document.getElementById("postTranslationCache");
  if (cache) return cache;

  cache = document.createElement("div");
  cache.id = "postTranslationCache";
  cache.setAttribute("aria-hidden", "true");
  cache.style.position = "absolute";
  cache.style.left = "-99999px";
  cache.style.top = "0";
  cache.style.width = "1px";
  cache.style.height = "1px";
  cache.style.overflow = "hidden";
  cache.style.opacity = "0";
  cache.style.pointerEvents = "none";
  document.body.appendChild(cache);
  return cache;
}

function parsePost(raw) {
  var type = (raw.post && raw.post.type) || "update";
  var base = {
    type: type,
    title: (raw.post && raw.post.title) || "Untitled",
    message: normalizeTextValue(stringifyValue(raw.post && raw.post.message)),
    date: (raw.post && raw.post.date) || null,
    expiresDate: (raw.post && raw.post.expiresDate) || null,
    contactInfo: normalizeTextValue(stringifyValue(raw.post && raw.post.contactInfo)),
    foodBankId: (raw.organization && raw.organization.foodBankId) || "fb0",
    orgOther: normalizeTextValue(stringifyValue(raw.organization && raw.organization.foodBankOther)),
    location: normalizeTextValue(stringifyValue(raw.location && raw.location.location)),
    locationLink: normalizeTextValue(stringifyValue(raw.location && raw.location.link)),
    image: normalizeTextValue(stringifyValue(raw.post && raw.post.thumbnail)),
    rawData: raw
  };

  switch(type) {
    case "recurring_event":
      base.recurringDates = raw.recurringEvent && raw.recurringEvent.recurringDates;
      base.startRecurringDates = (raw.recurringEvent && raw.recurringEvent.startRecurringDates) || null;
      break;
    case "event":
      base.eventDate = (raw.uniqueEvent && raw.uniqueEvent.eventDate) || null;
      break;
    case "food_available":
      base.timeWindow = raw.food && raw.food.timeWindow;
      base.availableItems = normalizeTextValue(stringifyValue(raw.food && raw.food.availableItems));
      break;
  }
  return base;
}

var allPosts = [];
var services = [];
var currentOpenModalIndex = -1;

function populateServicesDropdown(servicesList) {
  var select = document.getElementById("filterOrganization");
  if (!select) return;
  select.innerHTML = '<option value="">All Organizations</option>';
  servicesList.sort(function(a, b) { return a.name.localeCompare(b.name); })
    .forEach(function(service) {
      var option = document.createElement("option");
      option.value = service.id;
      option.textContent = service.name;
      select.appendChild(option);
    });
}

function loadServices() {
  return fetch("data/services.json")
    .then(function(resp) { return resp.json(); })
    .then(function(data) {
      services = data;
      populateServicesDropdown(services);
    })
    .catch(function(err) { console.error("Error loading services:", err); });
}

function loadPosts() {
  // Fork testing: keep post JSON and deployed assets sourced from the same repo.
  var repoOwner = "MicArianW";
  var repoName = "TogetherKGO";
  var branch = "main";
  var postsPath = "data/posts";
  var apiUrl = "https://api.github.com/repos/" + repoOwner + "/" + repoName + "/contents/" + postsPath + "?ref=" + branch;

  return fetch(apiUrl)
    .then(function(response) {
      if (!response.ok) {
        displayPosts([]);
        setDisplayById("loading", "none");
        return;
      }
      return response.json();
    })
    .then(function(files) {
      if (!files) return;
      var jsonFiles = files.filter(function(f) { return f.name.endsWith(".json"); });
      return Promise.all(jsonFiles.map(function(file) {
        return fetch(file.download_url)
          .then(function(r) { return r.json(); })
          .catch(function() { return null; });
      }));
    })
    .then(function(posts) {
      if (!posts) return;
      allPosts = posts.filter(function(p) { return p !== null; }).map(parsePost);
      allPosts = allPosts.filter(function(p) { return !p.expiresDate || new Date(p.expiresDate) > new Date(); });
      allPosts.sort(comparePosts);
      displayPosts(allPosts);
      setDisplayById("loading", "none");
    })
    .catch(function(err) {
      console.error("Error loading posts:", err);
      displayPosts([]);
      setDisplayById("loading", "none");
    });
}

function getTypeLabel(type) {
  return (window.CONSTANTS && window.CONSTANTS.UPDATE_TYPES && window.CONSTANTS.UPDATE_TYPES[type]) || "Update";
}

function formatDateForDisplay(value, includeTime) {
  if (!isValidDateValue(value)) return "";
  var date = new Date(value);
  var options = includeTime
    ? { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }
    : { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleString("en-US", options);
}

function getNextRelevantDate(post) {
  if (post.type === "event") return toDateOrNull(post.eventDate);
  if (post.type === "recurring_event") return getNextOccurrenceDate(post);
  return null;
}

function comparePosts(a, b) {
  var aNext = getNextRelevantDate(a);
  var bNext = getNextRelevantDate(b);

  if (aNext && bNext) {
    return aNext - bNext; // pure date comparison
  }

  if (aNext) return -1;
  if (bNext) return 1;

  return new Date(b.date || 0) - new Date(a.date || 0);
}

function getWhenText(post) {
  if (post.type === "recurring_event" && post.recurringDates) return formatWhenValue(post.recurringDates);
  if (post.type === "event" && post.eventDate && isValidDateValue(post.eventDate)) {
    return formatDateForDisplay(post.eventDate, true);
  }
  if (post.type === "food_available" && post.timeWindow) return formatWhenValue(post.timeWindow);
  return "";
}

function displayPosts(posts) {
  var grid = document.getElementById("postsGrid");
  var noPosts = document.getElementById("noPosts");
  var countEl = document.getElementById("resultCount");

  if (!grid) return;

  if (countEl) countEl.textContent = "We found " + posts.length + " results:";

  if (!posts.length) {
    grid.style.display = "none";
    noPosts.style.display = "block";
    return;
  }

  grid.innerHTML = "";
  grid.style.display = "grid";
  noPosts.style.display = "none";

  posts.forEach(function(post, index) {
    var service = services.find(function(s) { return s.id === post.foodBankId; });
    var serviceName = service ? normalizeTextValue(service.name) : "";
    var orgName = post.foodBankId === "fb0" ? post.orgOther : (serviceName || "Unknown Organization");
    var dateText = isValidDateValue(post.date) ? new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
    var detail = getCardDetail(post);
    var imgSrc = getVersionedImageSrc(post);

    var card = document.createElement("div");
    card.className = "post-card";
    card.dataset.orgType = service ? service.type : "organization";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Open details for " + post.title);
    card.onclick = function() { openPostModal(index); };
    card.onkeydown = function(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPostModal(index);
      }
    };

    var html =
      '<div class="card-number"><span>' + (index + 1) + '</span></div>' +
      '<div class="card-title notranslate" title="' + escapeHtml(post.title) + '">' + escapeHtml(post.title) + '</div>' +
      '<div class="card-org notranslate" title="' + escapeHtml(orgName) + '">' + escapeHtml(orgName) + '</div>' +
      '<div class="card-separator" aria-hidden="true"></div>' +
      '<span class="card-tag">' + escapeHtml(getTypeLabel(post.type)) + '</span>' +
      '<div class="card-separator" aria-hidden="true"></div>';

    html += '<div class="card-when"><span class="when-label">' + escapeHtml(detail.label) + '</span><span class="when-value">' + escapeHtml(detail.value) + '</span></div>' +
      '<div class="card-separator" aria-hidden="true"></div>';

    html +=
      '<div class="card-footer">' +
        '<span class="card-posted">Posted: ' + dateText + '</span>' +
        '<button class="card-toggle" onclick="openPostModal(' + index + ', event)">Show details &nbsp;+</button>' +
      '</div>';

    if (imgSrc) {
      html += '<div class="card-image"><img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(post.title) + '" loading="lazy"></div>';
    } else {
      html += '<div class="card-image card-image-empty"><div class="card-image-empty-pill">No Media</div></div>';
    }

    card.innerHTML = html;
    grid.appendChild(card);
  });

  renderPostTranslationCache(posts);
}

// Modal
function openPostModal(index, event) {
  if (event) event.stopPropagation();
  var posts = getCurrentFilteredPosts();
  var post = posts[index];
  if (!post) return;
  currentOpenModalIndex = index;

  var service = services.find(function(s) { return s.id === post.foodBankId; });
  var serviceName = service ? normalizeTextValue(service.name) : "";
  var serviceAddress = service ? normalizeTextValue(service.address) : "";
  var servicePhone = service ? normalizeTextValue(service.phone) : "";
  var serviceWebsite = service ? normalizeTextValue(service.website) : "";
  var orgName = post.foodBankId === "fb0" ? post.orgOther : (serviceName || "Unknown Organization");
  var dateText = isValidDateValue(post.date) ? new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

  document.getElementById("modalPostedDate").textContent = "Posted: " + dateText;
  document.getElementById("modalNumber").textContent = (index + 1);
  document.getElementById("modalTitle").textContent = post.title;
  document.getElementById("modalOrg").textContent = orgName;
  document.getElementById("modalTag").textContent = getTypeLabel(post.type);
  document.getElementById("modalDetails").innerHTML = buildModalDetailsHtml(post, serviceAddress);
  document.getElementById("modalContact").innerHTML = buildModalContactHtml(post, servicePhone, serviceWebsite, serviceAddress);

  // Image
  var imgEl = document.getElementById("modalImage");
  var imgButton = document.querySelector(".post-modal-image-button");
  var imgHint = document.querySelector(".post-modal-image-hint");
  var fallbackEl = document.getElementById("modalImageFallback");
  var fallbackTextEl = document.getElementById("modalImageFallbackText");
  var modalRight = document.querySelector(".post-modal-right");
  var modalImageSrc = getVersionedImageSrc(post);
  if (modalImageSrc) {
    imgEl.src = modalImageSrc;
    imgEl.alt = post.title;
    imgEl.style.display = "block";
    if (imgButton) imgButton.style.display = "block";
    if (imgHint) imgHint.style.display = "inline-flex";
    if (fallbackEl) fallbackEl.style.display = "none";
    if (fallbackTextEl) fallbackTextEl.textContent = "";
    if (modalRight) modalRight.classList.remove("is-empty");
  } else {
    imgEl.removeAttribute("src");
    imgEl.alt = "";
    imgEl.style.display = "none";
    if (imgButton) imgButton.style.display = "none";
    if (imgHint) imgHint.style.display = "none";
    if (fallbackEl) fallbackEl.style.display = "block";
    if (fallbackTextEl) fallbackTextEl.textContent = "";
    if (modalRight) modalRight.classList.add("is-empty");
  }

  document.getElementById("postModal").style.display = "flex";
  document.body.style.overflow = "hidden";

  if (isTranslatedLanguageActive()) {
    window.setTimeout(function() {
      applyTranslatedModalContent(index);
    }, 180);

    window.setTimeout(function() {
      applyTranslatedModalContent(index);
    }, 420);
  }
}

function closePostModal() {
  document.getElementById("postModal").style.display = "none";
  document.body.style.overflow = "";
  currentOpenModalIndex = -1;
}

function openImageZoom() {
  var imgEl = document.getElementById("modalImage");
  var zoomModal = document.getElementById("imageZoomModal");
  var zoomImg = document.getElementById("zoomedImage");
  if (!imgEl || !zoomModal || !zoomImg || imgEl.style.display === "none" || !imgEl.src) return;

  zoomImg.src = imgEl.src;
  zoomImg.alt = imgEl.alt || "";
  zoomModal.style.display = "flex";
}

function closeImageZoom() {
  var zoomModal = document.getElementById("imageZoomModal");
  var zoomImg = document.getElementById("zoomedImage");
  if (!zoomModal || !zoomImg) return;
  zoomModal.style.display = "none";
  zoomImg.removeAttribute("src");
}

var currentFilteredPosts = [];

function getCurrentFilteredPosts() {
  return currentFilteredPosts.length ? currentFilteredPosts : allPosts;
}

function buildModalDetailsHtml(post, serviceAddress) {
  var whenText = getWhenText(post);
  var detailsHtml = "";

  if (whenText) {
    detailsHtml += '<div class="post-modal-separator" aria-hidden="true"></div>' +
      '<div class="post-modal-detail-row"><span class="detail-label">When</span><span class="detail-value">' + escapeHtml(whenText) + '</span></div>';
  }
  if (post.message) {
    detailsHtml += '<div class="post-modal-separator" aria-hidden="true"></div>' +
      '<div class="post-modal-detail-row"><span class="detail-label">About</span><span class="detail-value">' + escapeHtml(stripUrlsFromText(post.message)) + '</span></div>';
  }
  if (post.type === "recurring_event" && post.startRecurringDates && isValidDateValue(post.startRecurringDates)) {
    detailsHtml += '<div class="post-modal-separator" aria-hidden="true"></div>' +
      '<div class="post-modal-detail-row"><span class="detail-label">Starts</span><span class="detail-value">' + escapeHtml(formatDateForDisplay(post.startRecurringDates, false)) + '</span></div>';
  }
  if (post.type === "food_available" && post.availableItems) {
    detailsHtml += '<div class="post-modal-separator" aria-hidden="true"></div>' +
      '<div class="post-modal-detail-row"><span class="detail-label">Available</span><span class="detail-value">' + escapeHtml(post.availableItems) + '</span></div>';
  }
  if (serviceAddress) {
    detailsHtml += '<div class="post-modal-separator" aria-hidden="true"></div>' +
      '<div class="post-modal-detail-row"><span class="detail-label">Where</span><span class="detail-value">' + escapeHtml(serviceAddress) + '</span></div>';
  } else if (post.location) {
    detailsHtml += '<div class="post-modal-separator" aria-hidden="true"></div>' +
      '<div class="post-modal-detail-row"><span class="detail-label">Where</span><span class="detail-value">' + escapeHtml(post.location) + '</span></div>';
  }

  return detailsHtml;
}

function buildModalContactHtml(post, servicePhone, serviceWebsite, serviceAddress) {
  var postWebsite = post.locationLink || extractFirstUrl(post.message);
  var phone = servicePhone || post.contactInfo;
  var contactHtml = "";

  if (post.contactInfo || servicePhone || postWebsite || serviceWebsite || serviceAddress) {
    contactHtml += '<div class="post-modal-separator" aria-hidden="true"></div>' +
      '<div class="post-modal-detail-row"><span class="detail-label">Contact</span><span class="detail-value"></span></div>' +
      '<div class="post-modal-contact-buttons">';
    if (phone) {
      contactHtml += '<a class="post-modal-contact-btn" href="tel:' + escapeHtml(phone.replace(/\s+/g, "")) + '">📞 ' + escapeHtml(phone) + '</a>';
    }
    if (postWebsite || serviceWebsite) {
      var website = postWebsite || serviceWebsite;
      contactHtml += '<a class="post-modal-contact-btn" href="' + escapeHtml(website) + '" target="_blank" rel="noopener noreferrer">🌐 Website</a>';
    }
    if (serviceAddress) {
      var dirUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(serviceAddress);
      contactHtml += '<a class="post-modal-contact-btn green" href="' + dirUrl + '" target="_blank" rel="noopener noreferrer">🗺️ Directions</a>';
    }
    contactHtml += '</div>';
  }

  return contactHtml;
}

function renderPostTranslationCache(posts) {
  var cache = ensurePostTranslationCache();
  cache.innerHTML = "";

  posts.forEach(function(post, index) {
    var service = services.find(function(s) { return s.id === post.foodBankId; });
    var serviceAddress = service ? normalizeTextValue(service.address) : "";
    var servicePhone = service ? normalizeTextValue(service.phone) : "";
    var serviceWebsite = service ? normalizeTextValue(service.website) : "";
    var item = document.createElement("div");

    item.setAttribute("data-post-index", String(index));
    item.innerHTML =
      '<div data-cache-part="tag">' + escapeHtml(getTypeLabel(post.type)) + '</div>' +
      '<div data-cache-part="details">' + buildModalDetailsHtml(post, serviceAddress) + '</div>' +
      '<div data-cache-part="contact">' + buildModalContactHtml(post, servicePhone, serviceWebsite, serviceAddress) + '</div>';

    cache.appendChild(item);
  });
}

function applyTranslatedModalContent(index) {
  if (!isTranslatedLanguageActive()) return;

  var cache = document.getElementById("postTranslationCache");
  var modal = document.getElementById("postModal");
  if (!cache || !modal || modal.style.display !== "flex" || currentOpenModalIndex !== index) return;

  var item = cache.querySelector('[data-post-index="' + index + '"]');
  if (!item) return;

  var tagPart = item.querySelector('[data-cache-part="tag"]');
  var detailsPart = item.querySelector('[data-cache-part="details"]');
  var contactPart = item.querySelector('[data-cache-part="contact"]');

  if (tagPart) document.getElementById("modalTag").innerHTML = tagPart.innerHTML;
  if (detailsPart) document.getElementById("modalDetails").innerHTML = detailsPart.innerHTML;
  if (contactPart) document.getElementById("modalContact").innerHTML = contactPart.innerHTML;
}

function filterPosts() {
  var orgFilter = document.getElementById("filterOrganization") ? document.getElementById("filterOrganization").value : "";
  var orgTypeFilter = document.getElementById("orgType") ? document.getElementById("orgType").value : "";
  var postTypeFilter = document.getElementById("postType") ? document.getElementById("postType").value : "";
  var urgencyFilter = document.getElementById("urgencyFilter") ? document.getElementById("urgencyFilter").checked : false;

  var filtered = allPosts.filter(function(p) {
    if (orgFilter && p.foodBankId !== orgFilter) return false;

    if (orgTypeFilter) {
      var service = services.find(function(s) { return s.id === p.foodBankId; });
      var orgType = (!service || service.type === "placeholder") ? "individual" : service.type;
      if (orgType !== orgTypeFilter) return false;
    }

    if (postTypeFilter && p.type !== postTypeFilter) return false;

    if (urgencyFilter && p.type !== "urgent" && p.type !== "food_available") return false;

    return true;
  });

  currentFilteredPosts = filtered;
  displayPosts(filtered);
}

function resetFilters() {
  var orgEl = document.getElementById("filterOrganization");
  var orgTypeEl = document.getElementById("orgType");
  var postTypeEl = document.getElementById("postType");
  var urgencyEl = document.getElementById("urgencyFilter");

  if (orgEl) orgEl.value = "";
  if (orgTypeEl) orgTypeEl.value = "";
  if (postTypeEl) postTypeEl.value = "";
  if (urgencyEl) urgencyEl.checked = false;

  currentFilteredPosts = [];
  displayPosts(allPosts);
}

function setupFilters() {
  ["filterOrganization", "orgType", "postType"].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("change", filterPosts);
  });
  var urgencyEl = document.getElementById("urgencyFilter");
  if (urgencyEl) urgencyEl.addEventListener("change", filterPosts);
}

// Close modal on Escape key
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    closeImageZoom();
    closePostModal();
  }
});

// Init
document.addEventListener("DOMContentLoaded", function() {
  setupFilters();
  loadServices().then(function() { return loadPosts(); });
});
