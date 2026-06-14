from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta
from .models import Incident

class IncidentApiTests(APITestCase):
    def setUp(self):
        # Create standard test incident
        self.incident_data = {
            "title": "Kitchen oven leaking gas",
            "description": "We smell gas near the pizza oven in the kitchen. Staff turned off the valve.",
            "category": "Kitchen Equipment",
            "location": "Store #102 - Westside",
            "severity": "Critical",
            "timestamp": timezone.now().isoformat()
        }
        
        self.test_incident = Incident.objects.create(
            title="Register offline",
            description="The card reader is frozen on lane 2.",
            category="POS Issue",
            location="Store #101 - Downtown",
            severity="High",
            status="Open",
            timestamp=timezone.now() - timedelta(hours=2)
        )

    def test_submit_incident_success(self):
        url = reverse('incident-list')
        response = self.client.post(url, self.incident_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], self.incident_data['title'])
        # Verify AI summary was generated (even if fallback)
        self.assertNotEqual(response.data['ai_summary'], "")
        self.assertNotEqual(response.data['ai_suggested_action'], "")

    def test_submit_incident_validation_error(self):
        url = reverse('incident-list')
        
        # Missing title
        invalid_data = self.incident_data.copy()
        invalid_data['title'] = ""
        response = self.client.post(url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)
        
        # Future timestamp
        invalid_data = self.incident_data.copy()
        invalid_data['timestamp'] = (timezone.now() + timedelta(days=1)).isoformat()
        response = self.client.post(url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('timestamp', response.data)

    def test_list_incidents(self):
        url = reverse('incident-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should contain the one we created in setUp + any successfully submitted
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Register offline")

    def test_filter_incidents(self):
        # Create a second incident with different status/severity
        Incident.objects.create(
            title="Out of chicken wings",
            description="We ran out of wings for the Friday promotion.",
            category="Inventory",
            location="Store #103 - Galleria Mall",
            severity="Medium",
            status="Resolved",
            timestamp=timezone.now()
        )
        
        url = reverse('incident-list')
        
        # Filter by status = Resolved
        response = self.client.get(url, {'status': 'Resolved'})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Out of chicken wings")

        # Filter by severity = High
        response = self.client.get(url, {'severity': 'High'})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Register offline")

        # Text search
        response = self.client.get(url, {'search': 'Galleria'})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Out of chicken wings")

    def test_analyze_description_endpoint(self):
        url = reverse('incident-analyze-description')
        
        # Test valid request
        payload = {"description": "The card swipe reader on register 1 is not responding to touch."}
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('category', response.data)
        self.assertIn('severity', response.data)
        self.assertIn('suggested_action', response.data)
        # Verify fallback logic classifies it as POS Issue
        self.assertEqual(response.data['category'], 'POS Issue')
