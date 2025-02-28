// Copyright (c) 2025, Neeraj Regmi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Chalani Process System", {
	refresh(frm) {
        const todayAD = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'
    const todayBS = NepaliFunctions.AD2BS(todayAD, "YYYY-MM-DD", "YYYY-MM-DD");

    const dateFields = [
      { bs: "date_bs", ad: "date_ad" },
      { bs: "received_letter_date_b_s", ad: "registered_documents_date_a_d" },
    ];

    const isFutureDate = (date, today) => date > today;
    const handleDateChange = (frm, sourceField, targetField, convertFunc) => {
      const sourceDate = frm.doc[sourceField]?.split(" ")[0];
      if (!sourceDate) return;

      const adDate = convertFunc === NepaliFunctions.AD2BS ? sourceDate : NepaliFunctions.BS2AD(sourceDate, "YYYY-MM-DD", "YYYY-MM-DD");

      if (isFutureDate(adDate, todayAD)) {
        frappe.msgprint(__("Future dates are not allowed"));
        frappe.model.set_value(frm.doctype, frm.docname, sourceField, "");
        frappe.model.set_value(frm.doctype, frm.docname, targetField, "");
        return;
      }

      const targetDate = convertFunc(sourceDate, "YYYY-MM-DD", "YYYY-MM-DD");
      frappe.model.set_value(frm.doctype, frm.docname, targetField, targetDate);
    };

    dateFields.forEach(({ bs, ad }) => {
      add_nepali_date_picker(frm, bs, ad, {
        maxDate: todayBS,
        maxDateAD: todayAD,
      });

      // Onchange handler for AD date field
      frm.fields_dict[ad].df.onchange = () =>
        handleDateChange(frm, ad, bs, NepaliFunctions.AD2BS);

      // Onchange handler for BS date field
      frm.fields_dict[bs].df.onchange = () =>
        handleDateChange(frm, bs, ad, NepaliFunctions.BS2AD);
    })}
});
