 // // Get today's AD date in 'YYYY-MM-DD' format
    // const todayAD = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

    // // Convert today's AD date to BS
    // const todayBS = NepaliFunctions.AD2BS(todayAD, "YYYY-MM-DD", "YYYY-MM-DD");

    // // Define the date fields to be managed
    // const dateFields = [
    //   { bs: "date_bs", ad: "date_ad" },
    //   { bs: "received_letter_date_b_s", ad: "registered_documents_date_a_d" },
    // ];

    // // Setup all date pickers with maxDate restrictions to disable future dates
    // dateFields.forEach((pair) => {
    //   // Initialize the Nepali date picker for BS and AD fields
    //   add_nepali_date_picker(frm, pair.bs, pair.ad, {
    //     maxDate: todayBS,
    //     maxDateAD: todayAD,
    //   });
    // });

    // // Create automatic converters with future date validation
    // dateFields.forEach((pair) => {
    //   // Onchange handler for AD date field
    //   frm.fields_dict[pair.ad].df.onchange = () => {
    //     const adDate = frm.doc[pair.ad]?.split(" ")[0];
    //     if (adDate) {
    //       // Check if the entered AD date is in the future
    //       if (adDate > todayAD) {
    //         frappe.msgprint(__("Future dates are not allowed"));
    //         frappe.model.set_value(frm.doctype, frm.docname, pair.ad, "");
    //         frappe.model.set_value(frm.doctype, frm.docname, pair.bs, "");
    //         return;
    //       }
    //       // Convert AD date to BS and set the value
    //       const bsDate = NepaliFunctions.AD2BS(
    //         adDate,
    //         "YYYY-MM-DD",
    //         "YYYY-MM-DD"
    //       );
    //       frappe.model.set_value(frm.doctype, frm.docname, pair.bs, bsDate);
    //     }
    //   };

    //   // Onchange handler for BS date field
    //   frm.fields_dict[pair.bs].df.onchange = () => {
    //     const bsDate = frm.doc[pair.bs]?.split(" ")[0];
    //     if (bsDate) {
    //       // Convert BS date to AD
    //       const adDate = NepaliFunctions.BS2AD(
    //         bsDate,
    //         "YYYY-MM-DD",
    //         "YYYY-MM-DD"
    //       );
    //       // Check if the converted AD date is in the future
    //       if (adDate > todayAD) {
    //         frappe.msgprint(__("Future dates are not allowed"));
    //         frappe.model.set_value(frm.doctype, frm.docname, pair.bs, "");
    //         frappe.model.set_value(frm.doctype, frm.docname, pair.ad, "");
    //         return;
    //       }
    //       // Set the AD date value
    //       frappe.model.set_value(frm.doctype, frm.docname, pair.ad, adDate);
    //     }
    //   };
    // });

    const todayAD = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'
    const todayBS = NepaliFunctions.AD2BS(todayAD, "YYYY-MM-DD", "YYYY-MM-DD");

    const dateFields = [
      { bs: "dateb_s", ad: "date_a_d" },
    ];

    const isFutureDate = (date, today) => date > today;
    const handleDateChange = (frm, sourceField, targetField, convertFunc) => {
      const sourceDate = frm.doc[sourceField]?.split(" ")[0];
      if (!sourceDate) return;

      const adDate =
        convertFunc === NepaliFunctions.AD2BS
          ? sourceDate
          : NepaliFunctions.BS2AD(sourceDate, "YYYY-MM-DD", "YYYY-MM-DD");

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
    });