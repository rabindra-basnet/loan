frappe.ui.form.on("DartaProcess System", {
    refresh: function(frm) {
        var style = document.createElement('style');
        style.innerHTML = `
            .layout-side-section {
                display: none !important; /* Hide the sidebar */
            }
            .btn-reset.sidebar-toggle-btn {
                display: none !important; /* Hide the toggle button */
            }
        `;
        document.head.appendChild(style);
    },
    create_registration_number(frm) {
        handleDartaOperation(frm, "create");
    },
    update_registration_number(frm) {
        handleDartaOperation(frm, "update");
    },
});


async function handleDartaOperation(frm, operation) {
    if (frm.doc.new_registration_number === frm.doc.registration_number) {
        frappe.msgprint("Cannot use same Darta number. Please enter a new value.");
        return;
    }

    const confirmationMessage = `Do you want to ${operation} the Darta number?`;
    const successMessage = `Number ${operation}d successfully`;

    const proceed = await showConfirmation(confirmationMessage);
    if (!proceed) return;

    const result = await validateAndSetNumber(
        frm,
        operation === "update" ? frm.doc.name : null
    );

    if (result.isValid) {
        frm.set_value("registration_number", frm.doc.new_registration_number);
        frappe.msgprint(successMessage);
    } else {
        frappe.msgprint("Darta number exists. Use a unique value.");
    }
}

async function validateAndSetNumber(frm, excludeName = null) {
    try {
        const filters = {
            registration_number: frm.doc.new_registration_number,
            ...(excludeName && { name: ["!=", excludeName] })
        };

        const { message: result } = await frappe.db.get_value(
            "DartaProcess System",
            filters,
            ["name"]
        );

        return { isValid: !result.name };
    } catch (error) {
        console.error("Validation failed:", error);
        return { isValid: false };
    }
}

function showConfirmation(message) {
    return new Promise(resolve => {
        frappe.confirm(message, () => resolve(true), () => resolve(false));
    });
}

