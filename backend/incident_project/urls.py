from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "name": "CrispyBites Operations API",
        "status": "online",
        "endpoints": {
            "incidents": "/api/incidents/"
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.url_pattern if hasattr(admin.site, 'url_pattern') else admin.site.urls),
    path('api/', include('incidents.urls')),
]
