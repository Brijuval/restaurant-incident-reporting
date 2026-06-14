from django.apps import AppConfig


class IncidentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'incidents'

    def ready(self):
        import os
        groq_key = os.environ.get("GROQ_API_KEY")
        
        # Print status check on start (only on reloader's main process to avoid double printing)
        if os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('RUN_MAIN'):
            print("\n" + "="*60)
            if groq_key and groq_key.strip():
                masked_key = groq_key[:6] + "..." + groq_key[-4:] if len(groq_key) > 10 else "configured"
                print(f"[ACTIVE] GROQ AI CONFIGURATION: CONNECTED (Key: {masked_key})")
                print("Groq Llama 3.1 is active. Live AI triage and summaries are enabled.")
            else:
                print("[FALLBACK] GROQ AI CONFIGURATION: DISCONNECTED")
                print("No GROQ_API_KEY environment variable detected.")
                print("The application is running in local RULE-BASED FALLBACK MODE.")
                print("To enable AI, create a .env file at the project root with:")
                print("GROQ_API_KEY=your_groq_api_key_here")
            print("="*60 + "\n")

            # Programmatically create superuser for cloud environment
            try:
                from django.contrib.auth.models import User
                if not User.objects.filter(username='admin').exists():
                    User.objects.create_superuser('admin', 'admin@example.com', 'adminpass')
                    print("[ADMIN] Superuser 'admin' created successfully with password 'adminpass'.")
            except Exception as e:
                # Silently catch database-not-ready errors during migrations
                pass
