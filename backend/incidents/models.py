from django.db import models

class Incident(models.Model):
    CATEGORY_CHOICES = [
        ('POS Issue', 'POS Issue'),
        ('Delivery Delay', 'Delivery Delay'),
        ('Inventory', 'Inventory'),
        ('Kitchen Equipment', 'Kitchen Equipment'),
        ('Customer Complaint', 'Customer Complaint'),
        ('Other', 'Other'),
    ]

    SEVERITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    location = models.CharField(max_length=150)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    
    # Required field for date/time of incident. Default is timezone auto_now_add,
    # but staff should be able to submit it or it defaults to current timestamp.
    timestamp = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Manager fields
    manager_notes = models.TextField(blank=True, default='')
    
    # AI generated fields
    ai_summary = models.TextField(blank=True, default='')
    ai_suggested_action = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.title} - {self.location} ({self.severity})"

    class Meta:
        ordering = ['-timestamp', '-created_at']
