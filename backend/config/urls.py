from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Správa charterovej agentúry"
admin.site.site_title = "Charter admin"
admin.site.index_title = "Flotila, destinácie a dopyty klientov"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("charter.urls")),
]
