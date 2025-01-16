# loan/custom_python/xmlrequest.py

import frappe
import requests
import warnings
import xml.etree.ElementTree as ET

warnings.filterwarnings("ignore", message="Unverified HTTPS request")

@frappe.whitelist()
def fetch_customer_data(cust_id):
    frappe.log_error(message=f"Arguments received: {cust_id}", title="fetch_customer_data")
    url = "https://192.168.92.61:55555/FISERVLET/fihttp"
    xml_payload = f"""<?xml version="1.0" encoding="UTF-8"?>
<FIXML xsi:schemaLocation="http://www.finacle.com/fixml RetCustInq.xsd" xmlns="http://www.finacle.com/fixml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Header>
<RequestHeader>
<MessageKey>
<RequestUUID>2c34530e-ed7d-a2e2-6fab-1bc4669b</RequestUUID>
<ServiceRequestId>RetCustInq</ServiceRequestId>
<ServiceRequestVersion>10.2</ServiceRequestVersion>
<ChannelId>CRM</ChannelId>
<LanguageId></LanguageId>
</MessageKey>
<RequestMessageInfo>
<BankId>019</BankId>
<TimeZone></TimeZone>
<EntityId></EntityId>
<EntityType></EntityType>
<ArmCorrelationId></ArmCorrelationId>
<MessageDateTime>2025-00-07T14:53:25.486</MessageDateTime>
</RequestMessageInfo>
<Security>
<Token>
<PasswordToken>
<UserId></UserId>
<Password></Password>
</PasswordToken>
</Token>
<FICertToken></FICertToken>
<RealUserLoginSessionId></RealUserLoginSessionId>
<RealUser></RealUser>
<RealUserPwd></RealUserPwd>
<SSOTransferToken></SSOTransferToken>
</Security>
</RequestHeader>
</Header>
<Body>
<RetCustInqRequest>
<RetCustInqRq>
<CustId>R000000559</CustId>
</RetCustInqRq>
</RetCustInqRequest>
</Body>
</FIXML>
    """

    headers = {"Content-Type": "application/xml", "Accept": "application/xml"}

    try:
        response = requests.post(url, data=xml_payload, headers=headers, verify=False)

        if response.status_code == 200:
            try:
                root = ET.fromstring(response.text)
                namespace = {'ns': 'http://www.finacle.com/fixml'}

                # Extract data from the <Body> tag
                body = root.find(".//ns:Body", namespace)
                if body is not None:
                    customer_data = {}
                    # Example: Extracting customer name and other details
                    
                    #CLient Detials
                    account_name = body.find(".//ns:AcctName", namespace)
                    
                    gender = body.find(".//ns:Gender", namespace)
                    nationality = body.find(".//ns:Nationality", namespace)
                    marital_status = body.find(".//ns:MaritalStatus", namespace)
                    employment_status = body.find(".//ns:EmploymentStatus", namespace)
                    phone_num = body.find(".//ns:PhoneNumLocalCode", namespace)
                    is_minor = body.find(".//ns:IsMinor", namespace)
                    
                    
                    #Citizenship Details

                    name = body.find(".//ns:Name", namespace)
                    salutation = body.find(".//ns:Salutation", namespace)
                    first_name = body.find(".//ns:FirstName", namespace)
                    last_name = body.find(".//ns:LastName", namespace)
                  
                   
                    # Family Tree
                    date_of_birth = body.find(".//ns:BirthDt", namespace)
                    grandfathers_name = body.find(".//ns:GrandfatherName", namespace)  # Adjust the tag if necessary
                    fathers_name = body.find(".//ns:FatherOrHusbandName", namespace)
                    mothers_name = body.find(".//ns:MotherName", namespace)
                    father_in_laws_name = body.find(".//ns:MaidenName", namespace)
                    
                    
                    
                    
                    
                    
                    
                    #Permannet Address
                    # permanent_province
                    # permanent_district
                    # permanent_vdc__municipality
                    # permanent_ward_no
                    # is_current_address_same_as_permanent_address_
                    
                    
                    #Currrent Address
                    # current_province
                    # current_district
                    # current_vdc__municipality
                    # current_ward_no
                    # ownership_of_residence
                    # ownership_of_residence 
                    # number_of_dependent
                    # cic_report
                    # age_condition_for_brmsage_condition_for_brms
                    # age_calculation
                    # brms_score_for_ownership_of_residence
                    # brms_score_for_education_level
                    
                    province = body.find(".//ns:State", namespace)


                    phone_country_code = body.find(".//ns:PhoneNumCountryCode", namespace)
                    
                    city = body.find(".//ns:City", namespace)
                    address_line1 = body.find(".//ns:AddrLine1", namespace)
                    address_line2 = body.find(".//ns:AddrLine2", namespace)

                    postal_code = body.find(".//ns:PostalCode", namespace)

                    place_of_issue = body.find(".//ns:PlaceOfIssue", namespace)
                    entity_document_id = body.find(".//ns:EntityDocumentID", namespace)

                    customer_status = body.find(".//ns:CustomerStatus", namespace)

                    # Map values to customer_data object
                    customer_data["account_name"] = account_name.text if account_name is not None else "N/A"

                    customer_data["name"] = name.text if name is not None else "N/A"
                    customer_data["salutation"] = salutation.text if salutation is not None else "N/A"
                    customer_data["first_name"] = first_name.text if first_name is not None else "N/A"
                    customer_data["last_name"] = last_name.text if last_name is not None else "N/A"
                    customer_data["is_minor"] = is_minor.text if is_minor is not None else "N/A"
                    customer_data["gender"] = gender.text if gender is not None else "N/A"
                    customer_data["nationality"] = nationality.text if nationality is not None else "N/A"
                    customer_data["marital_status"] = marital_status.text if marital_status is not None else "N/A"
                    customer_data["employment_status"] = employment_status.text if employment_status is not None else "N/A"
                    # customer_data["cust_id"] = cust_id if cust_id is not None else "N/A"

                    customer_data["phone_country_code"] = phone_country_code.text if phone_country_code is not None else "N/A"
                    customer_data["phone_num"] = phone_num.text if phone_num is not None else "N/A"
                    customer_data["city"] = city.text if city is not None else "N/A"
                    customer_data["address_line1"] = address_line1.text if address_line1 is not None else "N/A"
                    customer_data["address_line2"] = address_line2.text if address_line2 is not None else "N/A"
                    customer_data["province"] = province.text if province is not None else "N/A"
                    customer_data["postal_code"] = postal_code.text if postal_code is not None else "N/A"

                    customer_data["place_of_issue"] = place_of_issue.text if place_of_issue is not None else "N/A"
                    customer_data["entity_document_id"] = entity_document_id.text if entity_document_id is not None else "N/A"
                    customer_data["status"] = customer_status.text if customer_status is not None else "N/A"
                    
                    # Map values to customer_data object
                    customer_data["date_of_birth"] = date_of_birth.text if date_of_birth is not None else "N/A"
                    customer_data["grandfathers_name"] = grandfathers_name.text if grandfathers_name is not None else "N/A"
                    customer_data["fathers_name"] = fathers_name.text if fathers_name is not None else "N/A"
                    customer_data["mothers_name"] = mothers_name.text if mothers_name is not None else "N/A"
                    customer_data["father_in_laws_name"] = father_in_laws_name.text if father_in_laws_name is not None else "N/A"
                    
                  

                    return {"status": "success", "data": customer_data}
                else:
                    frappe.throw("No body content found in the response.")
            except ET.ParseError as parse_err:
                frappe.log_error(message=str(parse_err), title="XML Parsing Error")
                frappe.throw("Failed to parse the XML response.")
            # return {"status": "success", "data": response.text}
        else:
            frappe.throw(f"API Error {response.status_code}: {response.text}")

    except requests.exceptions.RequestException as e:
        frappe.log_error(message=str(e), title="API Fetch Error")
        frappe.throw(f"An error occurred: {e}")
