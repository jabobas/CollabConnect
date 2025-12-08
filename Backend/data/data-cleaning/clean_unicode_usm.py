"""
Author: Lucas Matheson
Date: December 8th, 2025

Description: This script processes a JSON file to fix double-encoded UTF-8 strings
and removes all non-alphanumeric characters (keeping only A-Z, a-z, 0-9, and spaces),
while preserving email addresses and phone numbers.
"""
import json
import re

def is_email_or_phone(s):
    """Check if string looks like an email or phone number."""
    # Simple email pattern - just check for @ symbol
    if '@' in s:
        return True
    
    # Phone pattern - has digits and common phone characters
    # Consider it a phone if it has digits and parentheses, hyphens, spaces, or plus signs
    if any(c.isdigit() for c in s):
        phone_chars = set('0123456789-+() .')
        if all(c in phone_chars for c in s.strip()):
            return True
    
    return False

def fix_double_encoded_utf8(obj):
    """
    Recursively fix double-encoded UTF-8 strings in a JSON object and remove
    non-alphanumeric characters (keeping only A-Z, a-z, 0-9, and spaces).
    Preserves emails and phone numbers.
    
    Args:
        obj: JSON object (dict, list, str, or other JSON-compatible type)
        
    Returns:
        The same object with all double-encoded UTF-8 strings fixed and cleaned
    """
    if isinstance(obj, dict):
        return {key: fix_double_encoded_utf8(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [fix_double_encoded_utf8(item) for item in obj]
    elif isinstance(obj, str):
        try:
            # Try to encode as latin-1 and decode as utf-8
            # This fixes double-encoded UTF-8
            fixed = obj.encode('latin-1').decode('utf-8')
        except (UnicodeDecodeError, UnicodeEncodeError):
            # If it fails, use the original string
            fixed = obj
        
        # Don't clean if it's an email or phone number
        if is_email_or_phone(fixed):
            return fixed
        
        # Remove all characters that aren't letters, numbers, or spaces
        # This keeps A-Z, a-z, 0-9, and spaces
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', fixed)
        return cleaned
    else:
        return obj


# Example usage
if __name__ == "__main__":
    # Load your JSON
    with open('../legacy-data/post_cleaning_usm_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Fix the encoding issues
    fixed_data = fix_double_encoded_utf8(data)
    
    # Save the fixed JSON
    with open('../processed/post_cleaning_usm_data.json', 'w', encoding='utf-8') as f:
        json.dump(fixed_data, f, indent=4, ensure_ascii=False)
    
    print("Fixed JSON saved to output.json")