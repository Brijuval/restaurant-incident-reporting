from rest_framework import serializers
from .models import Incident
from django.utils import timezone

class IncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = [
            'id', 'title', 'description', 'category', 'location', 
            'severity', 'status', 'timestamp', 'created_at', 
            'manager_notes', 'ai_summary', 'ai_suggested_action'
        ]
        read_only_fields = ['id', 'created_at', 'ai_summary', 'ai_suggested_action']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title cannot be empty or just whitespace.")
        return value

    def validate_description(self, value):
        if not value.strip():
            raise serializers.ValidationError("Description cannot be empty or just whitespace.")
        return value

    def validate_location(self, value):
        if not value.strip():
            raise serializers.ValidationError("Location cannot be empty or just whitespace.")
        return value

    def validate_timestamp(self, value):
        if value > timezone.now():
            raise serializers.ValidationError("Incident timestamp cannot be in the future.")
        return value
