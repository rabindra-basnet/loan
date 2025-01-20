import frappe

def retail_loan_query(user=None):
    if not user:
        user = frappe.session.user
        
    roles = frappe.get_roles(user)

    
    conditions = []
    for role in roles:
        if role in ["BM", "RM", "SH", "DCEO","CRM"]:
            conditions.append(f"workflow_state = '{role}'")

    
    if conditions:
        return "({})".format(" OR ".join(conditions))

    return "1=2"

def retail_loan_has_permission(doc, user=None):
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)
    frappe.msgprint(roles)

    if doc.from_workstep in roles:
        return True

    frappe.throw("You are not authorized to access this document.", frappe.PermissionError)

