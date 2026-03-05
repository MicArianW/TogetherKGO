/**
 * Show a success message for a given element ID and hide after duration (ms)
 */
function showSuccessMessage(id = 'successMessage', duration = 10000) {
    const el = document.getElementById(id);
    if (!el) return;

    el.style.display = 'block';          // Show message
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top

    setTimeout(() => {
        el.style.display = 'none';       // Hide after duration
    }, duration);
}

/**
 * Generic form submission handler
 */
function submitForm(form, successMessageId = 'successMessage') {
    const formData = new FormData(form);

    fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
    })
    .then(() => {
        showSuccessMessage(successMessageId);
        form.reset();
    })
    .catch(error => {
        alert('Error submitting form. Please try again.');
        console.error('Form submission error:', error);
    });
}