// Copyright (c) 2025, Neeraj Regmi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Chalani Process System", {
  refresh(frm) {
    const todayAD = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'
    const todayBS = NepaliFunctions.AD2BS(todayAD, "YYYY-MM-DD", "YYYY-MM-DD");

    const dateFields = [{ bs: "dateb_s", ad: "date_a_d" }];

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
  },

  onload(frm) {
    const fullname = frappe.session.user_fullname;
    const workflow_state = frm.doc.workflow_state;
    const decision = frm.doc.decision;
    const remarks = frm.doc.remarks;

    frm.set_value("current_approver", fullname);
    frm.set_value("current_workstep", workflow_state);

    const child_table = frm.doc.table_lkgu || [];
    const last_row =
      child_table.length > 0 ? child_table[child_table.length - 1] : null;

    if (
      last_row &&
      last_row.remarks == remarks &&
      last_row.from_workstep != workflow_state
    ) {
      console.log("working");
      frm.set_value("remarks", "");
    }

    if (last_row && last_row.decision === "Query") {
      // Check if last_row exists and decision is "Query"
      if (workflow_state) {
        // Ensure workflow_state is defined
        frm.set_df_property("decision", "options", ["Query Response"]);
        frm.set_df_property("to_workstep", "options", [last_row.decision]);
      }
    } else {
      if (workflow_state === "Draft") {
        frm.set_df_property("decision", "options", ["Recommend"]);
      }
      if (workflow_state === "Chalani Admin") {
        frm.set_df_property("decision", "options", [
          "Support",
          "Query",
          "Return",
          "Reject",
        ]);
      }
      if (workflow_state === "Chalani Approver") {
        frm.set_df_property("decision", "options", [
          "Approve",
          "Query",
          "Return",
          "Reject",
        ]);
      }
    }
  },
  decision: function (frm) {
    const decision = frm.doc.decision;
    const workflow_state = frm.doc.workflow_state;
    const child_table = frm.doc.table_lkgu || [];
    const last_row =
      child_table.length > 0 ? child_table[child_table.length - 1] : null;

    if (decision != "Query" && decision != "Query Response") {
      frm.set_value("to_workstep", "");
    }

    if (decision == "Query" && workflow_state == "Chalani Admin") {
      frm.set_df_property("to_workstep", "options", ["Chalani Initiator"]);
      console.log("Working");
    } else if (decision == "Query" && workflow_state == "Chalani Approver") {
      frm.set_df_property("to_workstep", "options", [
        "Chalani Initiator",
        "Chalani Admin",
      ]);
    }
  },
  save_log(frm) {
    const { decision, current_workstep, remarks } = frm.doc;
    const fullname = frappe.session.user_fullname;

    const child_table = frm.doc.table_lkgu || [];
    const last_row =
      child_table.length > 0 ? child_table[child_table.length - 1] : null;

    if (last_row && last_row.decision === frm.doc.current_workstep) {
      last_row.decision = decision;
      last_row.user_logged_in = fullname;
      last_row.from_workstep = current_workstep;
      last_row.remarks = remarks;
    } else if (decision && remarks) {
      const new_row = frm.add_child("table_lkgu");
      new_row.decision = decision;
      new_row.user_logged_in = fullname;
      new_row.from_workstep = current_workstep;
      new_row.remarks = remarks;
    }
    frm.refresh_field("table_lkgu");
  },

  validate(frm) {
    frm.events.save_log(frm);
  },
  //   save_log(frm) {
  //     const { remarks } = frm.doc;

  //     const fullname = frappe.session.user_fullname;
  //     const workflow_state = frm.doc.workflow_state;

  //     console.log(remarks, fullname, workflow_state);

  //     const child_table = frm.doc.table_lkgu || [];
  //     const last_row =
  //       child_table.length > 0 ? child_table[child_table.length - 1] : null;

  //     if (last_row && last_row.from_workstep === workflow_state) {
  //       last_row.user_logged_in = fullname;
  //       last_row.from_workstep = workflow_state;
  //       last_row.remarks = remarks;
  //     } else if (workflow_state && remarks) {
  //       const new_row = frm.add_child("table_lkgu");
  //       console.log(new_row);

  //       new_row.user_logged_in = fullname;
  //       new_row.from_workstep = workflow_state;
  //       new_row.remarks = remarks;
  //     }
  //     frm.refresh_field("table_lkgu");
  //   },

  //   validate(frm) {
  //     frm.events.save_log(frm);
  //   },
});

// frappe.ui.form.on("Salary Correction", {
//   refresh(frm) {
//     // your code here
//   },

//   onload(frm) {
//     const fullname = frappe.session.user_fullname;
//     const workflow_state = frm.doc.workflow_state;
//     const decision = frm.doc.decision;
//     const remarks = frm.doc.remarks;

//     frm.set_value("recommender_name", fullname);
//     frm.set_value("current_approver", fullname);
//     frm.set_value("current_workstep", workflow_state);

//     const child_table = frm.doc.approval_logs || [];
//     const last_row =
//       child_table.length > 0 ? child_table[child_table.length - 1] : null;

//     if (
//       last_row &&
//       last_row.remarks == remarks &&
//       last_row.decision_by != workflow_state
//     ) {
//       frm.set_value("remarks", "");
//     }

//     if (last_row && last_row.decision === "Query") {
//       // Check if last_row exists and decision is "Query"
//       if (workflow_state) {
//         // Ensure workflow_state is defined
//         frm.set_df_property("decision", "options", ["Query Response"]);
//         frm.set_df_property("to_workstep", "options", [last_row.decision_by]);
//       }
//     } else {
//       if (workflow_state === "Manager") {
//         frm.set_df_property("decision", "options", ["Recommend"]);
//       }
//       if (workflow_state === "Business Unit") {
//         frm.set_df_property("decision", "options", [
//           "Support",
//           "Query",
//           "Return",
//           "Reject",
//         ]);
//       }
//       if (workflow_state === "Board") {
//         frm.set_df_property("decision", "options", [
//           "Approve",
//           "Query",
//           "Return",
//           "Reject",
//         ]);
//       }
//     }
//   },

//   decision: function (frm) {
//     const decision = frm.doc.decision;
//     const workflow_state = frm.doc.workflow_state;
//     const child_table = frm.doc.approval_logs || [];
//     const last_row =
//       child_table.length > 0 ? child_table[child_table.length - 1] : null;

//     if (decision != "Query" && decision != "Query Response") {
//       frm.set_value("to_workstep", "");
//     }

//     if (decision == "Query" && workflow_state == "Business Unit") {
//       frm.set_df_property("to_workstep", "options", ["Manager"]);
//       console.log("Working");
//     } else if (decision == "Query" && workflow_state == "Board") {
//       frm.set_df_property("to_workstep", "options", [
//         "Manager",
//         "Business Unit",
//       ]);
//     }
//   },

//   save_log(frm) {
//     const { decision, current_workstep, remarks } = frm.doc;

//     const child_table = frm.doc.approval_logs || [];
//     const last_row =
//       child_table.length > 0 ? child_table[child_table.length - 1] : null;

//     if (last_row && last_row.decision_by === frm.doc.current_workstep) {
//       last_row.decision = decision;
//       last_row.decision_by = current_workstep;
//       last_row.remarks = remarks;
//     } else if (decision && remarks) {
//       const new_row = frm.add_child("approval_logs");
//       new_row.decision = decision;
//       new_row.decision_by = current_workstep;
//       new_row.remarks = remarks;
//     }
//     frm.refresh_field("approval_logs");
//   },

//   validate(frm) {
//     frm.events.save_log(frm);
//   },
// });
