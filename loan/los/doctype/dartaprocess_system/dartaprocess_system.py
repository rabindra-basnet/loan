import frappe
from frappe.utils import today
from nepali_datetime import date as nepali_date  # Import nepali_datetime correctly
from frappe.model.document import Document
from datetime import datetime

def get_next_unique_number(bs_year, bs_month, bs_day, doc=None):
    """Fetch last DPS number for the current BS year and increment it after Baishakh 1"""
    
    # Define the unique prefix based on BS year, month, and day
    prefix = f"DPS-{bs_year}-{bs_month}-{bs_day}-"
    
    # Query for the latest document for the specific BS date
    last_entry = frappe.db.sql("""
        SELECT name FROM `tabDartaProcess System`
        WHERE name LIKE %s
        ORDER BY creation DESC LIMIT 1
    """, (f"{prefix}%",), as_dict=True)

    if last_entry:
        # Extract the last number from the document's name and increment it
        last_number = int(last_entry[0]['name'].split('-')[-1])
        next_number = last_number + 1
    else:
        # If no document exists for this day, start from 0001
        next_number = 1

    # Ensure the number is always 4 digits long (e.g., 0001, 0002, ...)
    return f"{next_number:04}"

def convert_ad_to_bs(ad_date):
    """Convert AD date to Bikram Sambat (BS)"""
    # Convert AD date (String) to datetime.date object
    ad_date_obj = datetime.strptime(ad_date, "%Y-%m-%d").date()
    
    # Convert AD date object to Nepali BS date using nepali_datetime
    bs_date = nepali_date.from_datetime_date(ad_date_obj)  # Convert from AD to BS
    return {
        "year": bs_date.year,
        "month": f"{bs_date.month:02}",  # Two-digit month (01-12)
        "day": f"{bs_date.day:02}"       # Two-digit day (01-31)
    }

class DartaProcessSystem(Document):
    def before_save(self):
        """Set the name before saving to ensure uniqueness"""
        # bs_date = convert_ad_to_bs(today())  # Convert today's AD date to BS
        # next_number = get_next_unique_number(bs_date["year"], bs_date["month"], bs_date["day"], self)

        # Construct the unique DPS name
        # self.name = f"DPS-{bs_date['year']}-{bs_date['month']}-{bs_date['day']}-{next_number}"