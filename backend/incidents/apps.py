from django.apps import AppConfig


class IncidentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'incidents'

    def ready(self):
        import os
        gemini_key = os.environ.get("GEMINI_API_KEY")
        groq_key = os.environ.get("GROQ_API_KEY")
        
        # Print status check on start (only on reloader's main process to avoid double printing)
        if os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('RUN_MAIN'):
            print("\n" + "="*60)
            if groq_key and groq_key.strip():
                masked_key = groq_key[:6] + "..." + groq_key[-4:] if len(groq_key) > 10 else "configured"
                print(f"[ACTIVE] GROQ AI CONFIGURATION: CONNECTED (Key: {masked_key})")
                print("Groq is set as the PRIMARY model (llama-3.1-8b-instant).")
                print("Live AI incident triage, summaries, and action plans are ACTIVE.")
            elif gemini_key and gemini_key.strip():
                masked_key = gemini_key[:6] + "..." + gemini_key[-4:] if len(gemini_key) > 10 else "configured"
                print(f"[ACTIVE] GEMINI AI CONFIGURATION: CONNECTED (Key: {masked_key})")
                print("Gemini is set as the PRIMARY model (gemini-1.5-flash).")
                print("Live AI incident triage, summaries, and action plans are ACTIVE.")
            else:
                print("[FALLBACK] AI CONFIGURATION: DISCONNECTED")
                print("No GROQ_API_KEY or GEMINI_API_KEY environment variable detected.")
                print("The application is running in local RULE-BASED FALLBACK MODE.")
                print("To enable AI, create a .env file at the project root with:")
                print("GROQ_API_KEY=your_api_key_here  OR  GEMINI_API_KEY=your_api_key_here")
            print("="*60 + "\n")
