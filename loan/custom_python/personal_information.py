from frappe.utils.password import encrypt, decrypt
import frappe

def before_save(doc, method):
    """Encrypt encryption"""
    if doc.passport_number and not doc.passport_number.startswith("gAAAAA"):  # Prevent re-encryption
        doc.passport_number = encrypt(doc.passport_number)
        frappe.msgprint(f"Encrypted passport_number: {doc.passport_number}")

def after_load(doc, method):
    """Decrypt the passport_number after loading the document"""
    if doc.passport_number:
        frappe.msgprint(f"Attempting to decrypt: {doc.passport_number}")
        try:
            doc.passport_number = decrypt(doc.passport_number)
            frappe.msgprint(f"Decrypted passport_number: {doc.passport_number}")
        except Exception as e:
            frappe.msgprint(f"Error decrypting passport_number: {str(e)}")

