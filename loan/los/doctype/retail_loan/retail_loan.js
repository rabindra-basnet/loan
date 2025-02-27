frappe.ui.form.on("Retail Loan", {
  onload(frm) {
    const fullname = frappe.session.user_fullname;
    const loggedin_user = frappe.session.user;
    frm.set_value("logged_in_user", fullname);
    frm.set_value("logged_in_user_name", loggedin_user);
    if (frm.is_new()) {
      const workflow = frm.doc.workflow_state;
      const user = frappe.session.user;
      frm.set_value("from_workstep", workflow);
      frm.set_value("users", user);
    }
    update_decision_options(frm);
    check_and_mark_dirty_and_clear_fields(frm);
    check_save_log_state(frm);
    //make form read only to all user except rm and for approval log
    make_readonly(frm);
    frm.set_value("date", frappe.datetime.now_datetime());
  },
  before_load: function (frm) {
    const user_roles = frappe.user_roles;
    const workflow_state = frm.doc.workflow_state;
    if (!user_roles.includes("RM")) {
      if (!user_roles.includes(workflow_state)) {
        frappe.validated = false;
        frappe.msgprint(
          __("You are not authorized to access this document."),
          () => {
            frappe.set_route("List", "Retail Loan");
            document.body.innerHTML = "";
          }
        );
        throw new Error("Not authorized");
      }
    }
  },
  date_of_birth(frm) {
    frappe.model.set_value(
      frm.doctype,
      frm.docname,
      "date_of_birth_bs",
      NepaliFunctions.AD2BS(
        frm.doc.date_of_birth.split(" ")[0],
        "YYYY-MM-DD",
        "YYYY-MM-DD"
      )
    );
  },

  refresh: function (frm) {
    add_nepali_date_picker(frm, "date_of_birth_bs", "date_of_birth");
    $("button.btn-reset.sidebar-toggle-btn").hide();
    $(".col-lg-2.layout-side-section").hide();
    $(".dropdown-help").remove();
    if (!frm.is_new()) {
      if (
        frappe.user_roles.includes("RM") ||
        frappe.user_roles.includes("RM DOC Execution")
      ) {
        frm.add_custom_button(
          __("Document Upload"),
          function () {
            upload_document_with_type(frm);
          },
          __("Document Operations")
        );
      }

      frm.add_custom_button(
        __("View Document"),
        function () {
          view_document(frm);
        },
        __("Document Operations")
      );
    }
  },
  save_log(frm) {
    if (frm.disable_save_log_button) {
      return;
    }

    const {
      decision,
      date,
      logged_in_user,
      from_workstep,
      to_workstep,
      comment,
    } = frm.doc;

    const child_table = frm.doc.table_vhat || [];
    const last_row =
      child_table.length > 0 ? child_table[child_table.length - 1] : null;

    if (last_row && last_row.from_workstep === frm.doc.workflow_state) {
      last_row.decision = decision;
      last_row.start_date_time = date;
      last_row.logged_in_user = logged_in_user;
      last_row.from_workstep = from_workstep;
      last_row.to_workstep = to_workstep;
      last_row.comment = comment;
    } else if (decision && comment) {
      const new_row = frm.add_child("table_vhat");
      new_row.decision = decision;
      new_row.start_date_time = date;
      new_row.logged_in_user = logged_in_user;
      new_row.from_workstep = from_workstep;
      new_row.to_workstep = to_workstep;
      new_row.comment = comment;
    }
    frm.refresh_field("table_vhat");
    check_save_log_state(frm);
  },

  validate(frm) {
    frm.events.save_log(frm);
  },

  decision(frm) {
    handle_to_workstep_field(frm);
    //set_to_workstep_options(frm);
    update_last_child_row(frm);
  },

  comment(frm) {
    update_last_child_row(frm);
  },
});

const CONFIG = {
  roles: [
    "RM",
    "BM",
    "SH",
    "DCEO",
    "CEO",
    "CRM",
    "CAD DOC Generation",
    "CAD DOC Checker",
    "RM DOC Execution",
    "CAD Maker",
    "Disbursement",
  ], // Role hierarchy with CRM included
  decisions: {
    default: ["Recommend"], // Default decision for RM
    approver: ["Approve", "Query", "Return", "Deferral", "Decline"], // Decisions for final approver
    intermediate: ["Support", "Query", "Return", "Deferral", "Decline"], // Intermediate roles
    response: ["Query Response", "Deferral Response"], // Response options for Query/Deferral
    POSTAPPROVAL: ["Recommend", "Query"], //For CAD Maker and Checker
    CADMAKER: ["Approve", "Query"],
    DISBURSE: ["Disburse"],
  },
  decision_visibility: [
    "Query",
    "Deferral",
    "Decline",
    "Query Response",
    "Deferral Response",
  ], // Decisions that require `to_workstep`
};

function update_decision_options(frm) {
  const user_roles = frappe.user_roles;
  const current_role = get_current_user_role(user_roles);
  const final_approver = frm.doc.final_approver;
  const is_final_approver = final_approver === current_role;
  const is_rm = current_role === "RM";
  const is_cad_doc_generation = current_role === "CAD DOC Generation";
  const is_cad_checker = current_role === "CAD DOC Checker";
  const is_rm_doc_execution = current_role === "RM DOC Execution";
  const is_cad_maker = current_role === "CAD Maker";

  const child_table = frm.doc.table_vhat || [];
  const last_row =
    child_table.length > 0 ? child_table[child_table.length - 1] : null;

  let options = [];

  if (last_row && last_row.to_workstep === frm.doc.workflow_state) {
    if (last_row.decision === "Query") {
      options = ["Query Response"];
    } else if (last_row.decision === "Deferral") {
      options = ["Deferral Response"];
    }
  }

  if (options.length === 0) {
    if (is_final_approver) {
      options = CONFIG.decisions.approver;
    } else if (is_rm && frm.doc.workflow_state == "RM") {
      options = CONFIG.decisions.default;
    } else if (is_cad_doc_generation) {
      options = CONFIG.decisions.POSTAPPROVAL;
    } else if (is_cad_checker) {
      options = CONFIG.decisions.POSTAPPROVAL;
    } else if (is_rm_doc_execution) {
      options = CONFIG.decisions.POSTAPPROVAL;
    } else if (is_cad_maker) {
      options = CONFIG.decisions.CADMAKER;
    } else if (frm.doc.workflow_state == "RM Disbursement") {
      options = CONFIG.decisions.DISBURSE;
    } else {
      options = CONFIG.decisions.intermediate;
    }
  }

  if (
    last_row &&
    last_row.decision == "Approve" &&
    last_row.from_workstep == "CAD Checker"
  ) {
    options = ["CAD Recommend"];
  }

  if (last_row && last_row.decision == "CAD Recommend") {
    frm.set_value("decision", null);
    frm.set_df_property("decision", "hidden", true);
    frm.set_df_property("decision", "reqd", false);
    return;
  }

  frm.set_df_property("decision", "options", options.join("\n"));
  handle_to_workstep_field(frm);
}

function handle_to_workstep_field(frm) {
  const current_role = get_current_user_role(frappe.user_roles);

  const decision = frm.doc.decision;
  const should_show_to_workstep = CONFIG.decision_visibility.includes(decision);

  frm.set_df_property("to_workstep", "hidden", !should_show_to_workstep);
  frm.set_df_property("to_workstep", "reqd", should_show_to_workstep);

  if (should_show_to_workstep) {
    if (
      current_role == "CRM" ||
      current_role == "CAD Maker" ||
      current_role == "CAD DOC Checker"
    ) {
      set_to_workstep_for_crm_or_cad(frm);
    } else {
      set_to_workstep_options(frm);
    }
  } else {
    frm.set_value("to_workstep", null);
  }
}

function set_to_workstep_options(frm) {
  const current_role = get_current_user_role(frappe.user_roles);
  const role_hierarchy = CONFIG.roles;
  const child_table = frm.doc.table_vhat || [];
  const last_row =
    child_table.length > 0 ? child_table[child_table.length - 1] : null;

  if (frm.fields_dict.to_workstep.df.hidden) {
    frm.set_value("to_workstep", null);
    return;
  }

  if (
    last_row &&
    last_row.decision &&
    ["Query Response", "Deferral Response"].includes(frm.doc.decision)
  ) {
    frm.set_df_property("to_workstep", "options", last_row.from_workstep);
    return;
  }

  if (!current_role) {
    frm.set_df_property("to_workstep", "options", "");
    return;
  }

  const current_index = role_hierarchy.indexOf(current_role);

  if (current_index > -1) {
    const available_roles = role_hierarchy.slice(0, current_index).join("\n");
    frm.set_df_property("to_workstep", "options", available_roles);
  } else {
    frm.set_df_property("to_workstep", "options", "");
  }
}

function set_to_workstep_for_crm_or_cad(frm) {
  let role_hierarchy = CONFIG.roles.slice();
  const final_approver = frm.doc.final_approver;
  const final_approver_index = role_hierarchy.indexOf(final_approver);
  const current_role = get_current_user_role(frappe.user_roles);
  const child_table = frm.doc.table_vhat || [];
  const last_row =
    child_table.length > 0 ? child_table[child_table.length - 1] : null;

  if (frm.fields_dict.to_workstep.df.hidden) {
    frm.set_value("to_workstep", null);
    return;
  }

  if (
    last_row &&
    last_row.decision &&
    ["Query Response", "Deferral Response"].includes(frm.doc.decision)
  ) {
    frm.set_df_property("to_workstep", "options", last_row.from_workstep);
    return;
  }

  if (!current_role) {
    frm.set_df_property("to_workstep", "options", "");
    return;
  }

  // if (current_role == "CAD Checker") {
  //   frm.set_df_property("to_workstep", "options", "CAD Maker");
  //   return;
  // }

  if (current_role == "CAD DOC Checker") {
    frm.set_df_property("to_workstep", "options", "CAD DOC Generation");
    return;
  }

  if (final_approver_index > -1) {
    if (current_role == "CAD Maker") {
      const roles_up_to_final_approver = role_hierarchy.slice(
        0,
        final_approver_index + 1
      );

      const insert_index = roles_up_to_final_approver.length - 1;
      roles_up_to_final_approver.splice(insert_index, 0, "CRM");

      const available_roles_with_crm = roles_up_to_final_approver.join("\n");

      frm.set_df_property("to_workstep", "options", available_roles_with_crm);
    } else {
      const available_roles = role_hierarchy
        .slice(0, final_approver_index)
        .join("\n");
      frm.set_df_property("to_workstep", "options", available_roles);
      console.log(available_roles);
    }
  } else {
    frm.set_df_property("to_workstep", "options", "");
  }
}

function update_last_child_row(frm) {
  const child_table = frm.doc.table_vhat || [];
  const last_row =
    child_table.length > 0 ? child_table[child_table.length - 1] : null;

  if (last_row && last_row.from_workstep === frm.doc.workflow_state) {
    last_row.decision = frm.doc.decision;
    last_row.comment = frm.doc.comment;

    frm.refresh_field("table_vhat");
  }
}

function check_save_log_state(frm) {
  const child_table = frm.doc.table_vhat || [];
  const current_from_workstep = frm.doc.workflow_state;

  if (child_table.length > 0) {
    const last_row = child_table[child_table.length - 1];
    if (last_row.from_workstep === current_from_workstep) {
      frm.disable_save_log_button = true;
      frm.set_df_property("save_log", "disabled", 1);
    } else {
      frm.disable_save_log_button = false;
      frm.set_df_property("save_log", "disabled", 0);
    }
  } else {
    frm.disable_save_log_button = false;
    frm.set_df_property("save_log", "disabled", 0);
  }
}

function check_and_mark_dirty_and_clear_fields(frm) {
  const child_table = frm.doc.table_vhat || [];
  const current_role = get_current_user_role(frappe.user_roles);

  if (child_table.length > 0) {
    const last_row = child_table[child_table.length - 1];

    if (last_row.from_workstep !== current_role) {
      frm.set_value("decision", null);
      frm.set_value("comment", null);
      frm.dirty();
    }
  }
}

function get_current_user_role(user_roles) {
  const role_priority = CONFIG.roles;
  for (let role of role_priority) {
    if (user_roles.includes(role)) {
      return role;
    }
  }
  return null;
}

function upload_document_with_type(frm) {
  const selected_documents = [];
  if (!["RM DOC Execution"].includes(frm.doc.from_workstep)) {
    if (frm.doc.citizenship) selected_documents.push("Citizenship");
    if (frm.doc.nid) selected_documents.push("NID");
  } else {
    if (frm.doc.valuation_report == "Yes") selected_documents.push("Valuation");
    // if (frm.doc.valuation_report == "Yes")
    //   selected_documents.push("Offer Letter");
    if (frm.doc.personal_guarantee == "Yes")
      selected_documents.push("CM Template");
    if (frm.doc.blue_print == "Yes") selected_documents.push("Blue Print");
    //if (frm.doc.four_boundary == "Yes") selected_documents.push("CM Template");
    if (frm.doc.concent_of_pg_personal_guarantor == "Yes")
      selected_documents.push("Four Boundry");
  }
  frappe.prompt(
    {
      label: "Document Type",
      fieldname: "document_type",
      fieldtype: "Select",
      options: selected_documents,
      reqd: 1,
      default: selected_documents[0],
    },
    (values) => {
      const file_input = new frappe.ui.FileUploader({
        allow_multiple: true,
        //as_dataurl: false,
        disable_file_browser: true,
        show_web_link: false,

        options: ["My Device"],
        make_attachments_public: 1,
        on_success: (file) => {
          console.log(file);
          frappe.call({
            method: "loan.custom_python.omnidocs.upload_to_DMS",
            args: {
              file: "http://192.168.10.41" + file.file_url,
              file_name: file.file_name,
              document_type: values.document_type,
              file_ext: file.file_type,
              doc: frm.doc,
            },
            callback: (response) => {
              if (response.message) {
                frappe.msgprint(__("File uploaded successfully!"));
              }
            },
            error: (err) => {
              frappe.msgprint(
                __("Failed to upload the file. Please try again.")
              );
              console.error(err);
            },
          });
        },
        error: (err) => {
          frappe.msgprint(__("Failed to upload file. Please try again."));
          console.error(err);
        },
      });

      setTimeout(() => {
        // Hide "Set all private" button
        const buttons = document.querySelectorAll(
          ".btn.btn-secondary.btn-sm.btn-modal-secondary"
        );
        buttons.forEach((button) => {
          if (button.textContent.trim() === "Set all private") {
            button.style.display = "none";
          }
        });

        // Hide "Link" button in Frappe's file uploader
        const hideLinkButton = () => {
          const linkButtons = document.querySelectorAll(
            ".btn .btn-file-upload"
          );
          if (linkButtons.length > 0) {
            linkButtons.forEach((btn) => {
              btn.style.display = "none";
            });
            observer.disconnect(); // Stop observing after hiding the "Link" button
          }
        };

        const observer = new MutationObserver(hideLinkButton);

        // Start observing the body or modal container for changes
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        // Hide private checkboxes
        const hidePrivateCheckbox = () => {
          const privateCheckboxes = document.querySelectorAll(
            ".frappe-checkbox input[type='checkbox']"
          );
          if (privateCheckboxes.length > 0) {
            privateCheckboxes.forEach((checkbox) => {
              const parentElement = checkbox.closest(".frappe-checkbox");
              if (parentElement) {
                parentElement.style.display = "none";
              }
            });
            privateCheckboxObserver.disconnect(); // Stop observing after hiding
          }
        };

        const privateCheckboxObserver = new MutationObserver(
          hidePrivateCheckbox
        );

        // Start observing for private checkboxes
        privateCheckboxObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }, 500);
    },
    "Select Document Type",
    "Next"
  );
}

//function to make all form read only except for RM
function make_readonly(frm) {
  let is_rm = frappe.user_roles.includes("RM");
  let is_rm_doc_execution = frappe.user_roles.includes("RM DOC Execution");
  let current_workflow = frm.doc.workflow_state;

  // Default behavior: Make all fields read-only except for specific fields

  // Enable specific fields for non-RM users
  if (!is_rm) {
    Object.keys(frm.fields_dict).forEach((fieldname) => {
      frm.toggle_enable(fieldname, false); // Make all fields read-only
    });
    frm.toggle_enable(["decision", "comment", "to_workstep"], true); // Enable specific fields

    const button_names = ["fetch_client_details", "calculate_emi", "calculate"];
    button_names.forEach((button_name) => {
      if (frm.fields_dict[button_name]) {
        frm.fields_dict[button_name].toggle(false); // Disable specific buttons
      }
    });
  }

  // Enable specific fields for RM DOC Execution
  if (is_rm_doc_execution) {
    const editable_fields = [
      "remarks",
      "clf_credit_facility_offer_letter",
      "valuation_report",
      "personal_guarantee",
      "blue_print",
      "four_boundary",
      "concent_of_pg_personal_guarantor",
      "clf_date",
      "valuation_report_date",
      "personal_guarantee_date",
      "checklist_section",
      "blue_print_date",
      "four_boundary_date",
      "consent_of_pg_date",
    ];
    editable_fields.forEach((field) => {
      if (frm.fields_dict[field]) {
        frm.toggle_enable(field, true);
      }
    });
  }

  // Special case: If user is RM and workflow state is "Disbursement"
  if (current_workflow === "Disbursement") {
    // Make all fields read-only first
    Object.keys(frm.fields_dict).forEach((fieldname) => {
      frm.toggle_enable(fieldname, false);
    });

    // Enable only specific fields
    const editable_fields = [
      "html_pbmy",
      "table_putg",
      "decision",
      "comment",
      "to_workstep",
    ];
    editable_fields.forEach((field) => {
      if (frm.fields_dict[field]) {
        frm.toggle_enable(field, true);
      }
    });
  }
}

function view_document(frm) {
  const selected_documents = [];

  // Determine document types based on `from_workstep`
  if (!["RM DOC Execution"].includes(frm.doc.from_workstep)) {
    if (frm.doc.citizenship) selected_documents.push("Citizenship");
    if (frm.doc.nid) selected_documents.push("NID");
  } else {
    if (frm.doc.valuation) selected_documents.push("Valuation");
    if (frm.doc.offer_letter) selected_documents.push("Offer Letter");
    if (frm.doc.cm_template) selected_documents.push("CM Template");
    if (frm.doc.four_boundry) selected_documents.push("Four Boundary");
  }

  // Show the prompt for document type selection
  frappe.prompt(
    {
      label: "Document Type",
      fieldname: "document_type",
      fieldtype: "Select",
      options: selected_documents,
      reqd: 1,
    },
    (values) => {
      // Call openDocumentViewer based on the selected document
      openDocumentViewer(values.document_type);
    },
    "Select Document Type",
    "Next"
  );
}

// Open the document viewer in a new window
function openDocumentViewer(documentType) {
  const newWindow = window.open(
    "",
    "newWin",
    "location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,toolbar=no,left=100,top=20,width=600,height=600"
  );

  if (newWindow) {
    const iframeContent = `
      <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
        <script src="assets/js/nonceInitializer.js" defer></script>
        <script>
          function onSubmit() {
            window.open('', 'newWin', 'location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,toolbar=no,left=100,top=20,width=600,height=600');
            this.sharedEmitterService = { viewOpenedInNewTab: true };
          }
        </script>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.0/umd/popper.min.js"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.1.0/js/bootstrap.min.js"></script>
      </head>
      <body>
        <form style="width: 13rem;" class="m-2 col-6" id="webAPiFormRequest" method="POST" onsubmit="onSubmit()" action="http://192.168.10.253:8080/omnidocs/WebApiRequestRedirection" target="newWin">
          <input type="hidden" name="Application" value="Loan Document View">
          <input type="hidden" name="cabinetName" value="casngone">
          <input type="hidden" name="sessionIndexSet" value="false">
          <input type="hidden" name="DataClassName" required value="${documentType}">
          <label for="firstField">Customer Name</label><br>
          <input type="text" class="form-control form-control-sm" id="firstField" pattern="\\s*\\S.*" title="Enter at least one non-whitespace character." aria-label="Customer Name" name="DC.Customer Name" value=""><br>
          <label for="customerId">Customer ID</label><br>
          <input type="text" class="form-control form-control-sm" pattern="\\s*\\S.*" title="Enter at least one non-whitespace character." aria-label="Customer ID" name="DC.Customer ID" value=""><br>
          <input type="hidden" name="enableDCInfo" value="true">
          <input type="hidden" name="S" value="S">
          <input aria-describedby="openinnewtab" class="btn btn-default btn-sm theme-background-color" type="submit" value="Search">
          <p class="d-none" id="openinnewtab">Preview will open in a new tab</p>
        </form>
      </body>
      </html>
    `;

    newWindow.document.open();
    newWindow.document.write(iframeContent);
    newWindow.document.close();
  } else {
    alert("Failed to open a new window. Please check your browser settings.");
  }
}
