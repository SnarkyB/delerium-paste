# Delirium v1.0.4 Production Deployment

**Deployed:** December 2, 2025  
**Domain:** <https://delerium.cc>  
**VPS IP:** 45.148.31.132  
**Version:** v1.0.4

## Deployment Summary

✅ **Successfully deployed to production with SSL**

### Services Status

- ✅ Backend Server: Running (healthy)
- ✅ Nginx Reverse Proxy: Running on ports 80/443
- ✅ SSL Certificate: Valid until February 18, 2026
- ✅ HTTP → HTTPS Redirect: Active
- ✅ Firewall: Configured (ports 22, 80, 443)

### URLs

- **Main Site:** <https://delerium.cc>
- **API Health:** <https://delerium.cc/api/health>
- **View Page:** <https://delerium.cc/view.html>
- **Delete Page:** <https://delerium.cc/delete.html>

## Configuration

### Docker Compose

- Using: `docker-compose.prod.yml`
- Build context: Root directory (`.`)
- Dockerfile: `./server/Dockerfile`

### Environment Variables

```bash
DELETION_TOKEN_PEPPER=0a0c1389eb20a894434370eebbd8c973ba008d4049bb4c705023fdbda919c5ca
```

### SSL Configuration

- Certificate: `/home/noob/delirium/ssl/fullchain.pem`
- Private Key: `/home/noob/delirium/ssl/privkey.pem`
- Domain: delerium.cc
- Valid: Nov 20, 2025 - Feb 18, 2026

### Ports

- HTTP: 80 (redirects to HTTPS)
- HTTPS: 443
- Backend: 8080 (internal only)

## v1.0.4 Dockerfile Fix

The v1.0.4 tag had an issue with Bazel's deployment JAR. The fix involved:

1. **Problem:** Bazel's `java_binary` rule creates a wrapper script, not a fat JAR
2. **Solution:** Modified Dockerfile to:
   - Extract all dependency JARs from Bazel's runfiles directory
   - Copy main application JARs
   - Use Java classpath (`-cp '/app/lib/*'`) to run the application

### Modified Dockerfile Sections

```dockerfile
# Extract all JARs and create a fat JAR
RUN mkdir -p /app/lib && \
    cd /build && \
    # Collect all dependency JARs
    find bazel-bin/server/delerium_server_deploy.runfiles -name "*.jar" -exec cp {} /app/lib/ \; && \
    # Copy the main application JAR
    cp bazel-bin/server/delerium_server_lib.jar /app/lib/ && \
    cp bazel-bin/server/delerium_server_lib-resources.jar /app/lib/ && \
    # Create a classpath string
    echo "io.ktor.server.netty.EngineMain" > /app/mainclass.txt

# ...

ENTRYPOINT ["sh", "-c", "java -cp '/app/lib/*' io.ktor.server.netty.EngineMain"]
```

## Management Commands

### Start Services

```bash
cd /home/noob/delirium
docker compose -f docker-compose.prod.yml up -d
```

### Stop Services

```bash
cd /home/noob/delirium
docker compose -f docker-compose.prod.yml down
```

### View Logs

```bash
cd /home/noob/delirium
docker compose -f docker-compose.prod.yml logs -f
```

### Check Status

```bash
cd /home/noob/delirium
docker compose -f docker-compose.prod.yml ps
```

### Restart Services

```bash
cd /home/noob/delirium
docker compose -f docker-compose.prod.yml restart
```

### Rebuild After Changes

```bash
cd /home/noob/delirium
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## Health Checks

### API Health

```bash
curl https://delerium.cc/api/health
```

Expected response:

```json
{"status":"ok","timestampMs":1764669006383,"powEnabled":true,"rateLimitingEnabled":true}
```

### SSL Certificate Check

```bash
openssl s_client -connect delerium.cc:443 -servername delerium.cc < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

### Container Health

```bash
docker compose -f docker-compose.prod.yml ps
```

## Security Features

### Nginx Security Headers

- ✅ Strict-Transport-Security (HSTS)
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection
- ✅ Referrer-Policy: no-referrer
- ✅ Content-Security-Policy
- ✅ Permissions-Policy

### SSL Configuration

- ✅ TLS 1.2 and 1.3 only
- ✅ Modern cipher suites
- ✅ SSL session caching
- ✅ OCSP stapling (attempted)

### Application Security

- ✅ Rate limiting (10 requests/minute per IP)
- ✅ CORS configured for API endpoints
- ✅ Proof-of-Work enabled
- ✅ Non-root container user
- ✅ Health checks enabled

## Firewall Configuration

```bash
sudo ufw status
```

Current rules:

- Port 22 (SSH): ALLOW
- Port 80 (HTTP): ALLOW
- Port 443 (HTTPS): ALLOW

## SSL Certificate Renewal

The SSL certificate will expire on **February 18, 2026**.

### Manual Renewal

```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/delerium.cc/fullchain.pem /home/noob/delirium/ssl/
sudo cp /etc/letsencrypt/live/delerium.cc/privkey.pem /home/noob/delirium/ssl/
sudo chown noob:sudo /home/noob/delirium/ssl/*.pem
chmod 644 /home/noob/delirium/ssl/fullchain.pem
chmod 600 /home/noob/delirium/ssl/privkey.pem
docker compose -f docker-compose.prod.yml restart web
```

### Automated Renewal (Recommended)

Set up a cron job:

```bash
crontab -e
```

Add:

```cron
0 3 * * * certbot renew --quiet --post-hook 'cp /etc/letsencrypt/live/delerium.cc/*.pem /home/noob/delirium/ssl/ && chown noob:sudo /home/noob/delirium/ssl/*.pem && cd /home/noob/delirium && docker compose -f docker-compose.prod.yml restart web' >> /var/log/certbot-renew.log 2>&1
```

## Backup Recommendations

### Database Backup

```bash
# Backup the paste database
docker compose -f docker-compose.prod.yml exec server tar -czf - /data > backup-$(date +%Y%m%d).tar.gz
```

### Full Backup

```bash
# Backup entire application directory
cd /home/noob
tar -czf delirium-backup-$(date +%Y%m%d).tar.gz delirium/ --exclude=delirium/node_modules --exclude=delirium/client/node_modules
```

## Monitoring

### Check Disk Space

```bash
df -h
```

### Check Memory Usage

```bash
free -h
docker stats --no-stream
```

### Check Logs

```bash
# Nginx access logs
docker compose -f docker-compose.prod.yml exec web tail -f /var/log/nginx/access.log

# Nginx error logs
docker compose -f docker-compose.prod.yml exec web tail -f /var/log/nginx/error.log

# Server logs
docker compose -f docker-compose.prod.yml logs -f server
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check if ports are already in use
sudo ss -tlnp | grep -E ":(80|443|8080)"

# Restart Docker
sudo systemctl restart docker
```

### SSL Issues

```bash
# Verify certificate
openssl x509 -in /home/noob/delirium/ssl/fullchain.pem -noout -text

# Check certificate permissions
ls -la /home/noob/delirium/ssl/
```

### Database Issues

```bash
# Check data volume
docker volume ls
docker volume inspect delirium_server-data

# Access database directly
docker compose -f docker-compose.prod.yml exec server ls -la /data/
```

## Performance Tuning

### Nginx Worker Processes

Currently set to `auto` (matches CPU cores)

### Rate Limiting

Currently: 10 requests/minute per IP with burst of 5

To adjust, edit `/home/noob/delirium/reverse-proxy/nginx.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/m;
```

## Notes

- The server runs as non-root user `delirium` (uid/gid 999)
- Data is persisted in Docker volume `delirium_server-data`
- Client files are mounted read-only from `./client`
- Nginx configuration is mounted read-only from `./reverse-proxy/nginx.conf`

## Git Status

Currently on detached HEAD at v1.0.4 with uncommitted Dockerfile changes.

To preserve changes:

```bash
git checkout -b v1.0.4-prod-fix
git add server/Dockerfile docker-compose.prod.yml
git commit -m "fix: Bazel deployment for v1.0.4 production"
```

## Success Indicators

✅ Site accessible at <https://delerium.cc>  
✅ HTTP redirects to HTTPS  
✅ API health check returns 200 OK  
✅ SSL certificate valid  
✅ Security headers present  
✅ Rate limiting active  
✅ Containers healthy  
✅ Firewall configured  

---

**Deployment completed successfully on December 2, 2025**
