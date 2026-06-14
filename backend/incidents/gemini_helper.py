import os
import json
import logging
import re
import requests
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Configs
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
GROQ_KEY = os.environ.get("GROQ_API_KEY")

# Initialize Gemini SDK if API Key is configured
if GEMINI_KEY:
    try:
        genai.configure(api_key=GEMINI_KEY)
    except Exception as e:
        logger.error(f"Error configuring Gemini SDK: {e}")

def get_gemini_model():
    if not GEMINI_KEY:
        return None
    try:
        return genai.GenerativeModel("gemini-1.5-flash")
    except Exception as e:
        logger.error(f"Error initializing Gemini model: {e}")
        return None

def call_groq_api(prompt):
    """Call the Groq API using requests (OpenAI-compatible REST call)."""
    if not GROQ_KEY:
        return None
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_KEY}",
        "Content-Type": "application/json"
    }
    
    # We use llama-3.1-8b-instant for instant triage/summaries (very fast and cheap/free tier)
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": "You are a operations triage assistant. You must respond with a raw JSON object matching the requested schema. Do not enclose in markdown blocks (e.g. no ```json)."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=8)
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            logger.error(f"Groq API error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Failed to fetch from Groq: {e}")
        return None

def fallback_analysis(description):
    """Rule-based fallback for incident analysis when all APIs are offline."""
    desc_lower = description.lower()
    
    def matches_any(keywords, text):
        for kw in keywords:
            # Match whole words only using word boundary \b
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, text):
                return True
        return False
    
    # Category detection
    category = "Other"
    if matches_any(["pos", "register", "card reader", "checkout", "terminal", "ipad", "payment", "receipt", "system"], desc_lower):
        category = "POS Issue"
    elif matches_any(["deliver", "driver", "ubereats", "doordash", "grubhub", "late", "courier", "order delay", "delivery"], desc_lower):
        category = "Delivery Delay"
    elif matches_any(["inventory", "stock", "out of", "run out", "shortage", "supply", "ingredients", "box", "depleted", "rice", "food", "beef", "chicken", "lettuce", "cheese"], desc_lower):
        category = "Inventory"
    elif matches_any(["kitchen", "oven", "fridge", "freezer", "grill", "fryer", "equipment", "appliance", "dishwasher", "stove", "cooler", "maintenance"], desc_lower):
        category = "Kitchen Equipment"
    elif matches_any(["customer", "complain", "rude", "bad service", "guest", "refund", "unhappy", "client", "shouted", "complaint"], desc_lower):
        category = "Customer Complaint"

    # Severity detection
    severity = "Low"
    if matches_any(["fire", "injury", "hurt", "flood", "smoke", "medical", "police", "robbery", "break-in", "hospital", "fight", "accident", "gas leak", "urgent", "argent"], desc_lower):
        severity = "Critical"
    elif matches_any(["broken", "leak", "stopped working", "down", "completely", "ruined", "spoiled", "shutup", "cannot open", "not working", "empty"], desc_lower):
        severity = "High"
    elif matches_any(["slow", "delay", "running low", "smell", "loose", "dirty", "temp", "need"], desc_lower):
        severity = "Medium"

    # Action suggestion
    action = "Document all relevant details, notify the supervisor on shift, and monitor the situation."
    if category == "POS Issue":
        action = "Contact the IT support helpline immediately. Switch to backup payment terminal or process manual card entries if safe. If critical, use paper tickets for orders."
    elif category == "Delivery Delay":
        action = "Check order status in the delivery tablet, contact the courier, and adjust the kitchen prep/wait times in the system if delays persist."
    elif category == "Inventory":
        action = "Mark the unavailable item as 'Out of Stock' on the digital menus and delivery apps. Check with nearby sister stores to see if inventory can be transferred."
    elif category == "Kitchen Equipment":
        action = "Tag out the equipment for safety (Lockout/Tagout). Report to maintenance immediately and prepare backup appliances or adjust menu offerings accordingly."
    elif category == "Customer Complaint":
        action = "Apologize to the customer, issue a refund or a promo coupon if appropriate, and log their contact details for further manager follow-up."

    return {
        "category": category,
        "severity": severity,
        "suggested_action": action,
        "explanation": "Derived using local rule-based keyword matching (LLM APIs not configured or request failed)."
    }

def analyze_incident_description(description):
    """
    Analyzes the incident description using either Groq or Gemini (prioritizes Groq if key is present).
    Returns: Dict containing category, severity, suggested_action, and explanation.
    """
    if not description or not description.strip():
        return fallback_analysis("")

    prompt = f"""
    Analyze the following incident description reported by restaurant staff:
    
    "{description}"
    
    You MUST respond with a JSON object containing EXACTLY the following keys:
    - "category": Must be one of ["POS Issue", "Delivery Delay", "Inventory", "Kitchen Equipment", "Customer Complaint", "Other"]
    - "severity": Must be one of ["Low", "Medium", "High", "Critical"]
    - "suggested_action": A short (1-2 sentences) actionable recommendation for store staff to handle this incident immediately.
    - "explanation": A very brief explanation of why this category and severity were chosen.
    
    Do not enclose in markdown blocks. Just the raw JSON.
    """

    # 1. Try Groq first
    if GROQ_KEY:
        groq_resp = call_groq_api(prompt)
        if groq_resp:
            try:
                data = json.loads(groq_resp)
                return validate_analysis_result(data, description)
            except Exception as e:
                logger.error(f"Failed to parse Groq response: {e}")

    # 2. Try Gemini second
    model = get_gemini_model()
    if model:
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            return validate_analysis_result(data, description)
        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")

    # 3. Fall back to local rules
    return fallback_analysis(description)

def validate_analysis_result(data, description):
    """Ensure category and severity match allowable choices."""
    valid_categories = ["POS Issue", "Delivery Delay", "Inventory", "Kitchen Equipment", "Customer Complaint", "Other"]
    valid_severities = ["Low", "Medium", "High", "Critical"]
    
    if data.get("category") not in valid_categories:
        data["category"] = fallback_analysis(description)["category"]
    if data.get("severity") not in valid_severities:
        data["severity"] = fallback_analysis(description)["severity"]
        
    return data

def generate_incident_summary(title, description, category, severity, location):
    """
    Generates a brief summary and action plan using Groq or Gemini.
    Returns: Tuple of (summary, action_plan)
    """
    prompt = f"""
    Review this restaurant incident report:
    Title: {title}
    Category: {category}
    Severity: {severity}
    Location: {location}
    Description: {description}
    
    Provide two things:
    1. A concise executive summary of the incident (1-2 sentences).
    2. A short manager action plan consisting of 2-3 bullet points detailing long-term prevention or resolution steps.
    
    Your response must be a valid JSON object with the following keys:
    - "summary": The 1-2 sentence executive summary.
    - "action_plan": The bulleted list of long-term actions, formatted as a single string with markdown bullet points (e.g. "- Review IT logs...\\n- Train staff...").
    
    Do not enclose in markdown blocks. Just the raw JSON.
    """

    # 1. Try Groq
    if GROQ_KEY:
        groq_resp = call_groq_api(prompt)
        if groq_resp:
            try:
                data = json.loads(groq_resp)
                return data.get("summary", ""), data.get("action_plan", "")
            except Exception as e:
                logger.error(f"Failed to parse Groq summary response: {e}")

    # 2. Try Gemini
    model = get_gemini_model()
    if model:
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            return data.get("summary", ""), data.get("action_plan", "")
        except Exception as e:
            logger.error(f"Gemini summary failed: {e}")

    # 3. Fallback
    summary = f"Incident '{title}' ({category}) reported at {location}. Severity: {severity}."
    action_plan = f"- Follow up on: {description[:100]}\n- Review standard operating procedures for {category} incidents."
    return summary, action_plan
