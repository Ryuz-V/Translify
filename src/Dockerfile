FROM nginx:alpine

# Copy konfigurasi nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copy file frontend
COPY index.html /usr/share/nginx/html/
COPY static/ /usr/share/nginx/html/static/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]