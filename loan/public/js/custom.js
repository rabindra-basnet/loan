frappe.ready(function() {
    setTimeout(() => {
        document.querySelectorAll('a.dropdown-item').forEach(function(item) {
            const menuItemsToHide = ['Billing', 'About', 'Frappe Support'];
            if (menuItemsToHide.includes(item.textContent.trim())) {
                item.style.display = 'none';
            }
        });
    }, 500);
});
