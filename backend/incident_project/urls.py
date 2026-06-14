from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.url_pattern if hasattr(admin.site, 'url_pattern') else admin.site.urls),
    path('api/', include('incidents.urls')),
]
