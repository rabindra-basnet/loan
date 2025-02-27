import frappe

def retail_loan_query(user=None):
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)
    if "RM" in roles:
        return "1=1"
    conditions = []
    for role in roles:
        if role in ["BM", "SH", "DCEO", "CRM", "CEO", "CAD Maker", "CAD DOC Checker", "CAD DOC Generation", "RM DOC Execution", "Disbursement"]:
            conditions.append(f"workflow_state = '{role}'")
    if conditions:
        return "({})".format(" OR ".join(conditions))

    return "1=2"

# import frappe

# def retail_loan_query(user=None):
    
#     if not user:
#         user = frappe.session.user
        
#     roles = frappe.get_roles(user)

    
#     conditions = []
#     for role in roles:
#         if role in ["BM", "RM", "SH", "DCEO", "CRM", "CEO", "CAD Maker", "CAD Checker","CAD DOC Generation","RM DOC Execution","Disbursement"]:
#             conditions.append(f"workflow_state = '{role}'")

    
#     if conditions:
#         return "({})".format(" OR ".join(conditions))

#     return "1=2"

# def retail_loan_has_permission(doc, user=None):
#     if not user:
#         user = frappe.session.user

#     roles = frappe.get_roles(user)
#     frappe.msgprint(roles)

#     if doc.from_workstep in roles:
#         return True

#     frappe.throw("You are not authorized to access this document.", frappe.PermissionError)
def retail_loan_has_permission(doc, user=None):
    if not user:
        user = frappe.session.user

    # Get the user's roles
    roles = frappe.get_roles(user)
    frappe.msgprint(f"User Roles: {roles}")

    # Map roles to workflow states
    workflow_role_map = {
        "RM": "RM",  # RM role can access workflow state "RM"
        "BM": "BM",  # BM role can access workflow state "BM"
        "SH": "SH"   # SH role can access workflow state "SH"
    }

    # Get the current workflow state of the document
    current_state = str(doc.workflow_state) if doc.workflow_state else ""
    frappe.msgprint(f"Current Workflow State: {current_state}")

    # Debug: Print the entire form dictionary
    frappe.msgprint(f"Form Dictionary: {frappe.form_dict}")

    # Detect if this is a workflow action (Submit)
    workflow_action = None
    if frappe.form_dict.get("cmd") == "frappe.model.workflow.submit_workflow_action":
        workflow_action = "Submit"
    frappe.msgprint(f"Workflow Action Detected: {workflow_action}")

    # Handle Submit/Transition Action
    if workflow_action == "Submit":
        # Allow access if the user's role matches the current state
        for role in roles:
            if workflow_role_map.get(role) == current_state:
                return True
        # Deny access if the user's role does not match the current state
        frappe.throw("You are not authorized to perform this action.", frappe.PermissionError)

    # Handle Read/View Access
    for role in roles:
        if workflow_role_map.get(role) == current_state:
            return True

    # Deny access if no conditions are met
    frappe.throw("You are not authorized to access this document.", frappe.PermissionError)





