from django.contrib import admin
from .models import Incident

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ('title', 'location', 'category', 'severity', 'status', 'timestamp', 'created_at')
    list_filter = ('status', 'severity', 'category', 'location')
    search_fields = ('title', 'description', 'location')
    readonly_fields = ('created_at', 'ai_summary', 'ai_suggested_action')
    fieldsets = (
        ('Incident Details', {
            'fields': ('title', 'description', 'location', 'category', 'severity', 'status', 'timestamp', 'created_at')
        }),
        ('AI Analysis', {
            'classes': ('collapse',),
            'fields': ('ai_summary', 'ai_suggested_action')
        }),
        ('Resolution', {
            'fields': ('manager_notes',)
        }),
    )
