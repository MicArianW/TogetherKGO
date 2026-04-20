// ================================
// Constants Loader / Dropdown Populator
// ================================
// This script dynamically populates select dropdowns using window.CONSTANTS
// so you don't have to hardcode options in HTML and can maintain a single source of truth.
// ================================


// --------------------------------
// Generic function to populate any dropdown from a constants object
// --------------------------------
function populateDropdown(selectId, constantsObj, placeholder = "Select...") {
  const select = document.getElementById(selectId);
  if (!select) return; // Exit if select element is not found

  // Reset options with a default placeholder
  select.innerHTML = `<option value="">${placeholder}</option>`;

  // Sort entries alphabetically by label if desired (optional)
  const entries = Object.entries(constantsObj).sort((a, b) => a[1].localeCompare(b[1]));

  // Append options
  entries.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });
}


// --------------------------------
// Specific dropdown functions
// --------------------------------

// Populate Organization Type dropdowns
// Works for multiple selects with different IDs (e.g., "type", "orgType")
function populateOrganizationTypes() {
  const types = window.CONSTANTS.ORGANIZATION_TYPES;
  populateDropdown("type", types, "Any");           // find-services.html
  populateDropdown("orgType", types, "Select type..."); // submit-services form
}

// Populate Services dropdown (from HOME_TAGS)
function populateServiceDropdown() {
  var tags = window.CONSTANTS.HOME_TAGS;
  populateDropdown("service", tags, "Any");
}

// Populate Community Board / Update Types dropdown
function populateUpdateTypes() {
  const updates = window.CONSTANTS.UPDATE_TYPES;
  populateDropdown("postType", updates, "Select type...");
}


// --------------------------------
// Run all functions once the DOM is fully loaded
// --------------------------------
document.addEventListener("DOMContentLoaded", () => {
  populateOrganizationTypes();
  populateServiceDropdown();
  populateUpdateTypes();
});