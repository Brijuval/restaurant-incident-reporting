from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Incident
from .serializers import IncidentSerializer
from .gemini_helper import analyze_incident_description, generate_incident_summary

class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer

    def get_queryset(self):
        queryset = Incident.objects.all()
        
        # Filtering
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        severity_param = self.request.query_params.get('severity')
        if severity_param:
            queryset = queryset.filter(severity=severity_param)
            
        category_param = self.request.query_params.get('category')
        if category_param:
            queryset = queryset.filter(category=category_param)
            
        # Text search (Title, Description, Location)
        search_param = self.request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(
                Q(title__icontains=search_param) |
                Q(description__icontains=search_param) |
                Q(location__icontains=search_param)
            )
            
        return queryset

    def perform_create(self, serializer):
        # Retrieve input details to feed into AI summary generator
        title = serializer.validated_data.get('title')
        description = serializer.validated_data.get('description')
        category = serializer.validated_data.get('category')
        severity = serializer.validated_data.get('severity')
        location = serializer.validated_data.get('location')

        # Generate AI summary & suggested long-term action items in the background/sync
        ai_summary, ai_action = generate_incident_summary(
            title=title,
            description=description,
            category=category,
            severity=severity,
            location=location
        )

        serializer.save(
            ai_summary=ai_summary,
            ai_suggested_action=ai_action
        )

    @action(detail=False, methods=['post'], url_path='analyze-description')
    def analyze_description(self, request):
        """
        Endpoint to analyze an incident description in real-time.
        Expected POST body: { "description": "some text" }
        """
        description = request.data.get('description', '')
        if not description or not description.strip():
            return Response(
                {"error": "Description is required for analysis."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        analysis = analyze_incident_description(description)
        return Response(analysis, status=status.HTTP_200_OK)
