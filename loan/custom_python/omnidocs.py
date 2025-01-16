import requests
import frappe


# Base API URL
API_URL = "http://192.168.10.253:8080/OmniDocsRestWS/rest/services/executeAPIJSON"


def get_session_id():
    payload = {
        "NGOExecuteAPIBDO": {
            "inputData": {
                "NGOConnectCabinet_Input": {
                    "Option": "NGOConnectCabinet",
                    "UserExist": "N",
                    "CabinetName": "casngone",
                    "UserName": "supervisor",
                    "UserPassword": "System@123",
                    "locale": "en_US",
                }
            },
            "base64Encoded": "N",
            "locale": "en_US",
        }
    }
    response = requests.post(API_URL, json=payload)
    if response.status_code == 200:
        data = response.json()
        user_db_id = (
            data.get("NGOExecuteAPIResponseBDO", {})
            .get("outputData", {})
            .get("NGOConnectCabinet_Output", {})
            .get("UserDBId", None)
        )
        return user_db_id
    else:
        frappe.throw(f"Error fetching session ID: {response.text}")


get_session_id()


def get_folder_index(user_db_id, folder_name="frappe*"):
    payload = {
        {
            "NGOExecuteAPIBDO": {
                "InputData": {
                    "NGOSearchFolder_Input": {
                        "Option": "NGOSearchFolder",
                        "CabinetName": "casngone",
                        "UserDBId": user_db_id,
                        "LookInFolder": "",
                        "IncludeSubFolder": "Y",
                        "Name": folder_name,
                        "CreationDateRange": "",
                        "AccessDateRange": "",
                        "DataAlsoFlag": "Y",
                        "StartFrom": "1",
                        "NoOfRecordsToFetch": "10",
                        "OrderBy": "2",
                        "SortOrder": "D",
                        "IncludeTrashFlag": "N",
                        "ShowPath": "Y",
                    }
                },
                "Base64Encoded": "N",
                "Locale": "en_US",
                "AuthToken": "",
                "AuthTokenType": "",
            }
        }
    }
    response = requests.post(API_URL, json=payload)
    if response.status_code == 200:
        data = response.json()
        folder_index = data.get(
            "FolderIndex"
        )
        return folder_index
    else:
        frappe.throw(f"Error fetching folder index: {response.text}")


def upload_document(user_db_id, folder_index, document_name, data_def_index, data_def_name, index_id):
    """
    Step 3: Upload the document
    """
    payload = {
        "NGOAddDocumentBDO": {
            "cabinetName": "casngone",
            "folderIndex": folder_index,
            "userDBId": user_db_id,
            "documentName": document_name,
            "volumeId": "1",
            "accessType": "S",
            "createdByAppName": "csv",
            "enableLog": "Y",
            "FTSFlag": "PP",
            "userName": "",
            "userPassword": "",
            "comment": "add comment",
            "DataDefIndex": data_def_index,
            "DataDefName": data_def_name,
            "IndexId": index_id
        }
    }
    response = requests.post(API_URL, json=payload)
    if response.status_code == 200:
        data = response.json()
        return data  # Adjust based on the actual API response
    else:
        frappe.throw(f"Error uploading document: {response.text}")

# # Main Function
# def process_document_upload():
#     """
#     Main function to perform all steps
#     """
#     try:
#         # Step 1: Get session ID
#         session_id = get_session_id()
#         frappe.msgprint(f"Session ID: {session_id}")

#         # Step 2: Get folder index
#         user_db_id = "1965716636"  # Replace with the actual UserDBId
#         folder_index = get_folder_index(session_id, user_db_id)
#         frappe.msgprint(f"Folder Index: {folder_index}")

#         # Step 3: Upload document
#         document_name = "test3"
#         data_def_index = "DATA_DEF_INDEX"  # Replace with actual value
#         data_def_name = "DATA_DEF_NAME"    # Replace with actual value
#         index_id = "INDEX_ID"              # Replace with actual value

#         response = upload_document(session_id, user_db_id, folder_index, document_name, data_def_index, data_def_name, index_id)
#         frappe.msgprint(f"Document upload response: {response}")

#     except Exception as e:
#         frappe.throw(f"An error occurred: {str(e)}")
