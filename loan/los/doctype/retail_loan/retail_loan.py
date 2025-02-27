import frappe
from frappe.model.document import Document

class RetailLoan(Document):
    def before_save(self):
        original_doc = self.get_doc_before_save()
        if not original_doc:
            return

        if self.has_value_changed("workflow_state"):
            self.update_previous_state_end_time()
            self.log_new_state()

    def update_previous_state_end_time(self):
        if self.table_vhat:
            last_log = self.table_vhat[-1]
            if not last_log.end_date_time:
                end_time = frappe.utils.now_datetime()
                last_log.end_date_time = end_time.strftime("%Y-%m-%d %H:%M:%S")
                start = frappe.utils.get_datetime(last_log.start_date_time)
                end = frappe.utils.get_datetime(last_log.end_date_time)
                duration_seconds = (end - start).total_seconds()
                last_log.duration = self.format_duration(duration_seconds)

    def log_new_state(self):
        
        if self.table_vhat and self.table_vhat[-1].end_date_time:
            start_time = self.table_vhat[-1].end_date_time  
        else:
            start_time = frappe.utils.now_datetime().strftime("%Y-%m-%d %H:%M:%S")  
        
        self.append("table_vhat", {
            "from_workstep": self.workflow_state,
            "start_date_time": start_time  
        })

    def format_duration(self, seconds):
        seconds = float(seconds)
        if seconds < 60:
            return f"{int(seconds)} Seconds"
        elif seconds < 3600:
            minutes = int(seconds // 60)
            remaining_seconds = int(seconds % 60)
            return f"{minutes} Minutes {remaining_seconds} Seconds"
        elif seconds < 86400:
            hours = int(seconds // 3600)
            remaining_minutes = int((seconds % 3600) // 60)
            remaining_seconds = int(seconds % 60)
            return f"{hours} Hours {remaining_minutes} Minutes {remaining_seconds} Seconds"
        else:
            days = int(seconds // 86400)
            remaining_hours = int((seconds % 86400) // 3600)
            remaining_minutes = int((seconds % 3600) // 60)
            remaining_seconds = int(seconds % 60)
            return f"{days} Days {remaining_hours} Hours {remaining_minutes} Minutes {remaining_seconds} Seconds"

    def calculate_total_tat(self):
        tat_dict_seconds = {}
        for log in self.table_vhat:
            workstep = log.from_workstep
            duration_seconds = self.parse_duration_to_seconds(log.duration or "0 Seconds")
            tat_dict_seconds[workstep] = tat_dict_seconds.get(workstep, 0) + duration_seconds
        return {workstep: self.format_duration(seconds) for workstep, seconds in tat_dict_seconds.items()}

    def parse_duration_to_seconds(self, duration_str):
        if not duration_str:
            return 0
        try:
            return float(duration_str)
        except ValueError:
            total_seconds = 0
            parts = duration_str.split()
            for i in range(0, len(parts), 2):
                try:
                    value = int(parts[i])
                    unit = parts[i + 1].rstrip("s")
                    if unit == "day":
                        total_seconds += value * 86400
                    elif unit == "hour":
                        total_seconds += value * 3600
                    elif unit == "minute":
                        total_seconds += value * 60
                    elif unit == "second":
                        total_seconds += value
                except (IndexError, ValueError):
                    continue
            return total_seconds

    def on_update(self):
        if self.decision:
            tat = self.calculate_total_tat()
            frappe.msgprint(f"TAT Breakdown: {tat}")