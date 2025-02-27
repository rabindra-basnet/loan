import frappe
import requests
from frappe import _
from frappe import auth
from frappe.core.doctype.user.user import sign_up

@frappe.whitelist(allow_guest=True )
def login(usr, pwd):
    try:
        login_manager = frappe.auth.LoginManager()
        login_manager.authenticate(user=usr, pwd=pwd)
        login_manager.post_login()
    except frappe.exceptions.AuthenticationError:
        frappe.clear_messages()
        frappe.local.response["message"] = {
            "success_key":0,
            "message":"Authentication Error!"
        }

        return

    api_generate = generate_keys(frappe.session.user)
    user = frappe.get_doc('User', frappe.session.user)

    frappe.response["message"] = {
        "success_key":1,
        "message":"Authentication success",
        "sid":frappe.session.sid,
        "api_key":user.api_key,
        "api_secret":api_generate,
        "username":user.username,
        "email":user.email
    }

@frappe.whitelist(allow_guest=True)
def user_logout():
    """
    Log out the current user.
    :return: JSON response indicating success or failure.
    """
    try:
        # Clear session
        frappe.local.login_manager.logout()
        frappe.local.response["message"] = {
            "success": True,
            "message": "Logged out successfully."
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Logout Error")
        frappe.local.response["message"] = {
            "success": False,
            "message": str(e)
        }

def generate_keys(user):
    user_details = frappe.get_doc('User', user)
    api_secret = frappe.generate_hash(length=15)

    if not user_details.api_key:
        api_key = frappe.generate_hash(length=15)
        user_details.api_key = api_key

    user_details.api_secret = api_secret
    user_details.save()

    return api_secret


@frappe.whitelist()
def get_logged_user_details():
    """
    Returns details of the currently logged-in user, including API key and other metadata.
    """
    try:
        user = frappe.session.user
        if not user or user == "Guest":
            return {"success": False, "message": _("No active user session")}

        # Fetch user details
        user_doc = frappe.get_doc("User", user)
        
        # Check if the API key exists for the user
        api_key = user_doc.api_key if hasattr(user_doc, "api_key") else None

        # You can also fetch other user metadata as needed
        user_data = {
            "username": user,
            "full_name": user_doc.full_name,
            "email": user_doc.email,
            "api_key": api_key,
        }

        return {"success": True, "data": user_data}

    except Exception as e:
        frappe.log_error(message=str(e), title="Error in get_logged_user_details")
        return {"success": False, "message": str(e)}


# SignUp API 
@frappe.whitelist(allow_guest=True )
def api_user_signup(email, full_name, redirect_to=None):
    try:
        sign_up(email, full_name, redirect_to)
        return {"status": "success", "message": "Signup successful. Check your email for verification."}
    except frappe.DuplicateEntryError:
        return {"status": "error", "message": "A user with this email already exists."}
    except Exception as e:
        return {"status": "error", "message": f"An error occurred: {str(e)}"}


@frappe.whitelist(allow_guest=True)
def create_retail_loan():
    """
    Create a Retail Loan document from the provided data and validate the API key.
    
    Returns:
        dict: The created document or an error message.
    """
    try:
        # Validate API key
        api_key = frappe.request.headers.get("Authorization")
        if not api_key:
            return {
                "success": False,
                "message": _("Invalid or missing API key."),
            }

        # Check if the user is logged in
        # if not frappe.session.user or frappe.session.user == "Guest":
        #     return {
        #         "success": False,
        #         "message": _("You must be logged in to create a Retail Loan document."),
        #     }

        # Retrieve data from the request
        data = frappe.form_dict.get("data")  # Get 'data' from request
        if isinstance(data, str):
            data = frappe.parse_json(data)  # Parse if it's a JSON string

        if not data:
            return {
                "success": False,
                "message": _("Missing data payload."),
            }

        # Create and insert the new Retail Loan document
        doc = frappe.get_doc({
            "doctype": "Retail Loan",
            **data  # Spread the data fields into the document
        })
        doc.insert(ignore_permissions=False)  # Ensure permissions are checked

        # Return the newly created document as a response
        return {
            "success": True,
            "message": _("Retail Loan has successfully been submitted."),
            "data": doc.as_dict(),
        }
    except frappe.ValidationError as e:
        return {
            "success": False,
            "message": _("Validation error: {0}").format(str(e)),
        }
    except Exception as e:
        frappe.log_error(message=str(e), title="Error in create_retail_loan API")
        return {
            "success": False,
            "message": _("An unexpected error occurred: {0}").format(str(e)),
        }
