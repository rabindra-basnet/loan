frappe.ui.form.on('Retail Loan', {
    onload(frm) {
        const fullname = frappe.session.user_fullname;
        frm.set_value('logged_in_user', fullname);
        if(frm.is_new()){
            const workflow = frm.doc.workflow_state;
            frm.set_value('from_workstep', workflow);
        }
        // const workflow = frm.doc.workflow_state;
        // frm.set_value('from_workstep', workflow);
        
        update_decision_options(frm);
        check_and_mark_dirty_and_clear_fields(frm);
        check_save_log_state(frm);
    },
 
    save_log(frm) {
        if (frm.disable_save_log_button) {
            return;
        }

        const { decision, date, logged_in_user, from_workstep, to_workstep, comment } = frm.doc;

        const child_table = frm.doc.table_vhat || [];
        const last_row = child_table.length > 0 ? child_table[child_table.length - 1] : null;

        if (last_row && last_row.from_workstep === frm.doc.workflow_state) {
            last_row.decision = decision;
            last_row.date_klsu = date;
            last_row.logged_in_user = logged_in_user;
            last_row.from_workstep = from_workstep;
            last_row.to_workstep = to_workstep;
            last_row.comment = comment;
        } else {
            const new_row = frm.add_child('table_vhat');
            new_row.decision = decision;
            new_row.date_klsu = date;
            new_row.logged_in_user = logged_in_user;
            new_row.from_workstep = from_workstep;
            new_row.to_workstep = to_workstep;
            new_row.comment = comment;
        }

        frm.refresh_field('table_vhat');
        check_save_log_state(frm);
    },

    validate(frm) {
        frm.events.save_log(frm);
    },
    

    decision(frm) {
        handle_to_workstep_field(frm);
        set_to_workstep_options(frm);
        update_last_child_row(frm);
    },

    comment(frm) {
        update_last_child_row(frm);
    },
});

const CONFIG = {
    roles: ['RM', 'BM', 'SH', 'DCEO', 'CEO', 'CRM'], // Role hierarchy with CRM included
    decisions: {
        default: ['Recommend'], // Default decision for RM
        approver: ['Approve', 'Query', 'Deferral', 'Decline'], // Decisions for final approver
        intermediate: ['Support', 'Query', 'Deferral', 'Decline'], // Intermediate roles
        response: ['Query Response', 'Deferral Response'], // Response options for Query/Deferral
    },
    decision_visibility: ['Query', 'Deferral', 'Decline', 'Query Response', 'Deferral Response'], // Decisions that require `to_workstep`
};

function update_decision_options(frm) {
    const user_roles = frappe.user_roles;
    const current_role = get_current_user_role(user_roles);
    const final_approver = frm.doc.final_approver;
    const is_final_approver = final_approver === current_role;
    const is_rm = current_role === 'RM';
    const child_table = frm.doc.table_vhat || [];
    const last_row = child_table.length > 0 ? child_table[child_table.length - 1] : null;

    let options = [];

    if (last_row && last_row.to_workstep === frm.doc.workflow_state) {
        if (last_row.decision === 'Query') {
            options = ['Query Response'];
        } else if (last_row.decision === 'Deferral') {
            options = ['Deferral Response'];
        }
    }

    if (options.length === 0) {
        if (is_final_approver) {
            options = CONFIG.decisions.approver;
        } else if (is_rm) {
            options = CONFIG.decisions.default;
        } else {
            options = CONFIG.decisions.intermediate;
        }
    }

    frm.set_df_property('decision', 'options', options.join('\n'));
    handle_to_workstep_field(frm);
}

function handle_to_workstep_field(frm) {
    const decision = frm.doc.decision;
    const should_show_to_workstep = CONFIG.decision_visibility.includes(decision);

    frm.set_df_property('to_workstep', 'hidden', !should_show_to_workstep);
    frm.set_df_property('to_workstep', 'reqd', should_show_to_workstep);

    if (should_show_to_workstep) {
        set_to_workstep_options(frm);
    }
}

function set_to_workstep_options(frm) {
    const current_role = get_current_user_role(frappe.user_roles);
    const role_hierarchy = CONFIG.roles;
    const child_table = frm.doc.table_vhat || [];
    const last_row = child_table.length > 0 ? child_table[child_table.length - 1] : null;

    if (frm.fields_dict.to_workstep.df.hidden) {
        frm.set_value('to_workstep', null);
        return;
    }
    
    if (last_row && last_row.decision && ["Query Response", "Deferral Response"].includes(frm.doc.decision)) {
        frm.set_df_property('to_workstep', 'options', last_row.from_workstep);
        return;
    }

    if (!current_role) {
        frm.set_df_property('to_workstep', 'options', '');
        return;
    }


    const current_index = role_hierarchy.indexOf(current_role);

    if (current_index > -1) {
        const available_roles = role_hierarchy.slice(0, current_index).join('\n');
        frm.set_df_property('to_workstep', 'options', available_roles);
    } else {
        frm.set_df_property('to_workstep', 'options', '');
    }
}

function update_last_child_row(frm) {
    const child_table = frm.doc.table_vhat || [];
    const last_row = child_table.length > 0 ? child_table[child_table.length - 1] : null;

    if (last_row && last_row.from_workstep === frm.doc.workflow_state) {
        last_row.decision = frm.doc.decision;
        last_row.comment = frm.doc.comment;

        frm.refresh_field('table_vhat');
    }
}

function check_save_log_state(frm) {
    const child_table = frm.doc.table_vhat || [];
    const current_from_workstep = frm.doc.workflow_state;

    if (child_table.length > 0) {
        const last_row = child_table[child_table.length - 1];
        if (last_row.from_workstep === current_from_workstep) {
            frm.disable_save_log_button = true;
            frm.set_df_property('save_log', 'disabled', 1);
        } else {
            frm.disable_save_log_button = false;
            frm.set_df_property('save_log', 'disabled', 0);
        }
    } else {
        frm.disable_save_log_button = false;
        frm.set_df_property('save_log', 'disabled', 0);
    }
}

function check_and_mark_dirty_and_clear_fields(frm) {
    const child_table = frm.doc.table_vhat || [];
    const current_role = get_current_user_role(frappe.user_roles);

    if (child_table.length > 0) {
        const last_row = child_table[child_table.length - 1];

        if (last_row.from_workstep !== current_role) {
            frm.set_value('decision', null);
            frm.set_value('comment', null);
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
