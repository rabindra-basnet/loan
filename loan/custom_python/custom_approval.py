# import frappe

# @frappe.whitelist()
# def create_dynamic_workflow(final_approver):
#     # Define roles and default states
#     roles = ["RM", "BM", "SH", "DCEO", "CEO"]
#     states = []
#     transitions = []

#     # Get the position of the final approver in the chain
#     final_index = roles.index(final_approver)

#     # Generate states and transitions up to the final approver
#     for i, role in enumerate(roles[:final_index + 1]):
#         state_name = f"{role} Approval"
#         states.append({
#             "state": state_name,
#             "allow_edit": role,
#             "doc_status": 0 if i < final_index else 1  # Final approver submits the document
#         })

#         # Add CRM before the final approver, if applicable
#         if i == final_index - 1 and final_approver != "RM":
#             crm_state = {
#                 "state": "CRM Approval",
#                 "allow_edit": "CRM",
#                 "doc_status": 0
#             }
#             states.append(crm_state)
#             transitions.append({
#                 "state": state_name,
#                 "action": "Approve",
#                 "next_state": "CRM Approval",
#                 "allowed": role
#             })
#             state_name = "CRM Approval"  # Transition to CRM before final approver

#         # Add transition to the next state
#         if i < final_index:
#             next_state = f"{roles[i + 1]} Approval" if role != "CRM" else f"{roles[final_index]} Approval"
#             transitions.append({
#                 "state": state_name,
#                 "action": "Approve",
#                 "next_state": next_state,
#                 "allowed": role
#             })

#     # Add the final state
#     transitions.append({
#         "state": f"{roles[final_index]} Approval",
#         "action": "Submit",
#         "next_state": "Approved",
#         "allowed": final_approver
#     })

#     # Check if the workflow already exists
#     workflow_name = "Dynamic Approval Workflow"
#     existing_workflow = frappe.db.exists("Workflow", workflow_name)
#     if existing_workflow:
#         frappe.delete_doc("Workflow", workflow_name)

#     # Create the workflow
#     workflow = frappe.get_doc({
#         "doctype": "Retail Loan",
#         "workflow_name": workflow_name,
#         "document_type": "YourDoctype",
#         "is_active": 1,
#         "states": states,
#         "transitions": transitions
#     })
#     workflow.insert()
#     frappe.db.commit()

#     return "Workflow created successfully!"
