
import frappe
from frappe.utils import now
from frappe.utils import time_diff_in_seconds

def log_workflow_state(doc, method):
    if doc.get_doc_before_save():
        previous_state = doc.get_doc_before_save().get("workflow_state")
        current_state = doc.get("workflow_state")

        if previous_state != current_state:
            # Append log entry
            doc.append(
                "table_vhat",
                {
                    "start_date_time": now(),
                    "end_date_time": now(),
                    "duration": time_diff_in_seconds(now(), now()),
                },
            )
            # Reset the start time
            doc.set("workflow_state_start_time", now())
