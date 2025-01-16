import requests
import warnings
warnings.filterwarnings("ignore", message="Unverified HTTPS request")

# Target URL
url = "https://192.168.92.61:55555/FISERVLET/fihttp"

# XML Payload
xml_payload = """<?xml version="1.0" encoding="UTF-8"?>
<FIXML xsi:schemaLocation="http://www.finacle.com/fixml RetCustInq.xsd" xmlns="http://www.finacle.com/fixml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Header>
<RequestHeader>
<MessageKey>
<RequestUUID>c5760892-be28-8c60-0fc6-bae48e85522</RequestUUID>
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
<MessageDateTime>2024-10-26T15:10:18.147</MessageDateTime>
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
<CustId>R000000094</CustId>
</RetCustInqRq>
</RetCustInqRequest>
</Body>
</FIXML>
"""

# Headers
headers = {
    "Content-Type": "application/xml",  # Indicates XML payload
    "Accept": "application/xml",        # Indicates expected response format
}

# Send POST Request
try:
    response = requests.post(url, data=xml_payload, headers=headers, verify=False)  # Set verify=False to ignore SSL warnings

    # Check Response
    if response.status_code == 200:
        print("Response Received Successfully:")
        # frappe.msgprint(response.text)
        print(response.text)
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")