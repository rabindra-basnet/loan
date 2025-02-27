import requests
import frappe
import json
from frappe import _
from frappe.utils.password import get_decrypted_password
    

omnidocs_config = frappe.get_single('Omnidocs Configuration')

base_url = omnidocs_config.omidocs_api_url

API_URL = f"{base_url}/OmniDocsRestWS/rest/services/executeAPIJSON"
DOC_URL = f"{base_url}/OmniDocsRestWS/rest/services/addDocumentJSON"
cabinet_name = omnidocs_config.cabinet_name
username = omnidocs_config.username
password = get_decrypted_password('Omnidocs Configuration', 'Omnidocs Configuration', fieldname='password')
user_exist = "N"
locale = "en_US"


user_db_id = None

@frappe.whitelist()
def upload_to_DMS(file, file_name, document_type, file_ext, doc):
    if isinstance(doc, str):
        doc = frappe._dict(json.loads(doc))
            
    get_session_id()
    upload_document_with_type(file, file_name,document_type, file_ext, doc)


def get_session_id():
    global user_db_id
    payload = {
        "NGOExecuteAPIBDO": {
            "inputData": {
                "NGOConnectCabinet_Input": {
                    "Option": "NGOConnectCabinet",
                    "UserExist": user_exist,
                    "CabinetName": cabinet_name,
                    "UserName": username,
                    "UserPassword": password,
                    "locale": locale,
                }
            },
            "base64Encoded": "N",
            "locale": locale,
        }
    }

    try:
        response = requests.post(API_URL, json=payload)
        if response.status_code == 200:
            data = response.json()
            user_db_id = (
                data.get("NGOExecuteAPIResponseBDO", {})
                .get("outputData", {})
                .get("NGOConnectCabinet_Output", {})
                .get("UserDBId", None)
            )
            error= (
                data.get("NGOExecuteAPIResponseBDO", {})
                .get("outputData", {})
                .get("NGOConnectCabinet_Output", {})
                .get("Error", None)
            )
            if user_db_id:
                return user_db_id
            else:
                frappe.throw(msg=f'Failed to upload Document.Please contact Administrator for Omnidocs Configuration.',
                title="Validation Error."
)
        else:
            frappe.throw(f"{error}")
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error in get_session_id API"))
        # frappe.throw(f"{error}")


def upload_document_with_type(file, file_name, document_type, file_ext, doc):
    global user_db_id

    # Define the mapping for document types, including DataDefIndex
    document_type_mapping = {
        "Citizenship": {
            "DataDefIndex": "6",
            "FolderIndex": "659",
            "DataDefName": "Citizenship",
            "Criteria": [
                {"IndexId": "27", "IndexType": "S", "IndexValue": doc.custom_customer_name},
                {"IndexId": "28", "IndexType": "S", "IndexValue": doc.citizenship_number},
            ],
        },
        "NID": {
            "DataDefIndex": "7",
            "FolderIndex": "685",
            "DataDefName": "NID",
            "Criteria": [
                {"IndexId": "29", "IndexType": "S", "IndexValue": doc.citizenship_number},
                {"IndexId": "30", "IndexType": "S", "IndexValue": doc.custom_customer_name},
            ],
        },
        "Valuation Report": {
            "DataDefIndex": "6",
            "FolderIndex": "766",
            "DataDefName": "Citizenship",
            "Criteria": [
                {"IndexId": "29", "IndexType": "S", "IndexValue": doc.citizenship_number},
                {"IndexId": "30", "IndexType": "S", "IndexValue": doc.custom_customer_name},
            ],
        },
        "Blue Print": {
            "DataDefIndex": "6",
            "FolderIndex": "767",
            "DataDefName": "Citizenship",
            "Criteria": [
                {"IndexId": "29", "IndexType": "S", "IndexValue": doc.citizenship_number},
                {"IndexId": "30", "IndexType": "S", "IndexValue": doc.custom_customer_name},
            ],
        },
        "CM Template": {
            "DataDefIndex": "6",
            "FolderIndex": "770",
            "DataDefName": "Citizenship",
            "Criteria": [
                {"IndexId": "29", "IndexType": "S", "IndexValue": doc.citizenship_number},
                {"IndexId": "30", "IndexType": "S", "IndexValue": doc.custom_customer_name},
            ],
        },
        "Four Boundry": {
            "DataDefIndex": "6",
            "FolderIndex": "768",
            "DataDefName": "Citizenship",
            "Criteria": [
                {"IndexId": "29", "IndexType": "S", "IndexValue": doc.citizenship_number},
                {"IndexId": "30", "IndexType": "S", "IndexValue": doc.custom_customer_name},
            ],
        },
        
    }

    # Get the document-specific data
    if document_type not in document_type_mapping:
        frappe.throw(_("Invalid document type: ") + document_type)

    doc_data = document_type_mapping[document_type]

    # Build the payload
        # Build the payload
    payload = {
        "NGOAddDocumentBDO": {
            "CabinetName": cabinet_name,
            "UserDBId": user_db_id,
            "FolderIndex": doc_data["FolderIndex"],
            "DocumentName": file_name,
            "VolumeId": "1",
            "CreatedByAppName": file_ext,
            "Comment": f"Uploaded as {file_name}",
            "NGOAddDocDataDefCriterionBDO": {
                "DataDefIndex": doc_data["DataDefIndex"],
                "DataDefName": doc_data["DataDefName"],
                "NGOAddDocDataDefCriteriaDataBDO": doc_data["Criteria"],
            },
        }
    }

    # Log the payload for debugging
    frappe.log_error(json.dumps(payload, indent=2), _("Payload Debugging"))

    try:
        # Download the file
        response = requests.get(file, stream=True)
        if response.status_code != 200:
            frappe.throw(_("Failed to fetch the file from the provided URL"))

        # Prepare and upload the file
        files = {
            "file": (file_name, response.content, "application/octet-stream"),
            "NGOAddDocumentBDO": (None, json.dumps(payload), "application/json"),
        }
        upload_response = requests.post(DOC_URL, files=files)

        # Log response
        # frappe.msgprint(upload_response.text, _("Response Debugging"))

        if upload_response.status_code == 200:
            frappe.msgprint(_("Document uploaded successfully"))
        else:
            frappe.throw(_("Error uploading document: ") + upload_response.text)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error in upload_document_with_type API"))
        frappe.throw(_("An unexpected error occurred while uploading the document: ") + str(e))

    # payload = {
    #     "NGOAddDocumentBDO": {
    #         "CabinetName": cabinet_name,
    #         "UserDBId": user_db_id,
    #         "FolderIndex": doc_data["FolderIndex"],
    #         "DocumentName": file_name,
    #         "VolumeId": "1",
    #         "CreatedByAppName": file_ext,
    #         "Comment": f"Uploaded as {file_name}",
    #         "NGOAddDocDataDefCriterionBDO": {
    #             "DataDefIndex": doc_data["DataDefIndex"],
    #             "DataDefName": doc_data["DataDefName"],
    #             "NGOAddDocDataDefCriteriaDataBDO": doc_data["Criteria"],
    #         },
    #     }
    # }

    # try:
    #     # Download the file from the URL
    #     response = requests.get(file, stream=True)
    #     if response.status_code != 200:
    #         frappe.throw(_("Failed to fetch the file from the provided URL"))

    #     # Prepare the file for upload
    #     files = {
    #         "file": (file_name, response.content, "application/octet-stream"),
    #         "NGOAddDocumentBDO": (None, json.dumps(payload), "application/json"),
    #     }

    #     # Make the POST request
    #     upload_response = requests.post(DOC_URL, files=files)

    #     if upload_response.status_code == 200:
    #         frappe.msgprint(_("Document uploaded successfully"))
    #     else:
    #         frappe.throw(_("Error uploading document: ") + upload_response.text)
    # except Exception as e:
    #     frappe.log_error(frappe.get_traceback(), _("Error in upload_document_with_type API"))
    #     frappe.throw(_("An unexpected error occurred while uploading the document: ") + str(e))

