# Guia de Infraestrutura e DevOps

Manual completo de infraestrutura, deploy e operações do HealtFlow.

## Sumário

1. [Visão Geral](#visão-geral)
2. [Ambiente de Desenvolvimento](#ambiente-de-desenvolvimento)
3. [Docker](#docker)
4. [Kubernetes](#kubernetes)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Configuração do Nginx](#configuração-do-nginx)
7. [Monitoramento](#monitoramento)
8. [Backup e Recuperação](#backup-e-recuperação)
9. [Escalabilidade](#escalabilidade)
10. [Troubleshooting](#troubleshooting)

---

## Visão Geral

### Arquitetura de Infraestrutura

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    CloudFlare                            │   │
│  │               (CDN + WAF + DDoS Protection)              │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │                     Nginx Ingress                        │   │
│  │           (Load Balancer + SSL Termination)              │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│           ┌───────────────┼───────────────┐                    │
│           │               │               │                     │
│  ┌────────▼────────┐ ┌────▼────┐ ┌───────▼───────┐            │
│  │   Web Pods      │ │API Pods │ │ Worker Pods   │            │
│  │   (Next.js)     │ │(NestJS) │ │ (Bull Queue)  │            │
│  │   Replicas: 2   │ │ Rep: 3  │ │  Replicas: 2  │            │
│  └─────────────────┘ └─────────┘ └───────────────┘            │
│           │               │               │                     │
│           └───────────────┼───────────────┘                    │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │                    Data Layer                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │PostgreSQL│  │  Redis   │  │  MinIO   │  │Prometheus│ │   │
│  │  │ Primary  │  │ Cluster  │  │   S3     │  │ Metrics  │ │   │
│  │  │+ Replica │  │          │  │          │  │          │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Requisitos de Infraestrutura

| Ambiente | CPU | RAM | Storage |
|----------|-----|-----|---------|
| Development | 4 cores | 8GB | 50GB |
| Staging | 8 cores | 16GB | 100GB |
| Production | 16+ cores | 32GB+ | 500GB+ |

---

## Ambiente de Desenvolvimento

### Pré-requisitos

```bash
# Node.js 20+
node --version  # v20.x.x

# pnpm 8+
pnpm --version  # 8.x.x

# Docker 24+
docker --version  # 24.x.x

# Docker Compose 2+
docker compose version  # v2.x.x
```

### Setup Inicial

```bash
# Clone o repositório
git clone https://github.com/KallebyX/HealtFlow.git
cd HealtFlow

# Instale as dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env

# Edite o .env com suas configurações locais
nano .env
```

### Serviços de Desenvolvimento

```bash
# Inicie todos os serviços
docker-compose up -d

# Verifique o status
docker-compose ps

# Veja logs
docker-compose logs -f

# Pare os serviços
docker-compose down
```

### Portas Utilizadas

| Serviço | Porta | URL |
|---------|-------|-----|
| Web App | 3000 | http://localhost:3000 |
| API | 3001 | http://localhost:3001 |
| Swagger | 3001 | http://localhost:3001/api/docs |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| MailHog SMTP | 1025 | localhost:1025 |
| MailHog UI | 8025 | http://localhost:8025 |
| Prisma Studio | 5555 | http://localhost:5555 |

---

## Docker

### Docker Compose - Desenvolvimento

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: healthflow-postgres
    environment:
      POSTGRES_USER: healthflow
      POSTGRES_PASSWORD: healthflow
      POSTGRES_DB: healthflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U healthflow"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: healthflow-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  minio:
    image: minio/minio
    container_name: healthflow-minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  mailhog:
    image: mailhog/mailhog
    container_name: healthflow-mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Docker Compose - Produção

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    container_name: healthflow-api
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    container_name: healthflow-web
    environment:
      NODE_ENV: production
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: healthflow-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - api
      - web
    restart: unless-stopped
```

### Dockerfile - API

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN pnpm build

# Production
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

USER nestjs

EXPOSE 3001
ENV PORT=3001

CMD ["node", "dist/main.js"]
```

### Dockerfile - Web

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# Production
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

---

## Kubernetes

### Estrutura de Manifests

```
k8s/
├── base/
│   ├── namespace.yaml
│   ├── api-deployment.yaml
│   ├── web-deployment.yaml
│   ├── postgres.yaml
│   ├── redis.yaml
│   ├── services.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   └── hpa.yaml
└── overlays/
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches/
    └── production/
        ├── kustomization.yaml
        └── patches/
```

### Namespace

```yaml
# k8s/base/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: healthflow
  labels:
    app: healthflow
```

### API Deployment

```yaml
# k8s/base/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: healthflow-api
  namespace: healthflow
spec:
  replicas: 2
  selector:
    matchLabels:
      app: healthflow-api
  template:
    metadata:
      labels:
        app: healthflow-api
    spec:
      containers:
        - name: api
          image: ghcr.io/kallebyx/healthflow-api:latest
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: healthflow-secrets
                  key: database-url
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "2Gi"
              cpu: "2000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: healthflow-api
                topologyKey: kubernetes.io/hostname
```

### Horizontal Pod Autoscaler

```yaml
# k8s/base/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: healthflow-api-hpa
  namespace: healthflow
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: healthflow-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
```

### Ingress

```yaml
# k8s/base/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: healthflow-ingress
  namespace: healthflow
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
    - hosts:
        - app.healtflow.com.br
        - api.healtflow.com.br
      secretName: healthflow-tls
  rules:
    - host: app.healtflow.com.br
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: healthflow-web
                port:
                  number: 3000
    - host: api.healtflow.com.br
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: healthflow-api
                port:
                  number: 3001
```

### Comandos Kubectl

```bash
# Aplicar configurações
kubectl apply -k k8s/overlays/production/

# Ver pods
kubectl get pods -n healthflow

# Ver logs
kubectl logs -f deployment/healthflow-api -n healthflow

# Escalar manualmente
kubectl scale deployment healthflow-api --replicas=5 -n healthflow

# Rollout restart
kubectl rollout restart deployment/healthflow-api -n healthflow

# Ver status do HPA
kubectl get hpa -n healthflow

# Port forward para debug
kubectl port-forward svc/healthflow-api 3001:3001 -n healthflow
```

---

## CI/CD Pipeline

### GitHub Actions - CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:generate
      - run: pnpm type-check

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:generate
      - run: pnpm test:coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  build:
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

### GitHub Actions - CD

```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push API
        uses: docker/build-push-action@v5
        with:
          context: ./apps/api
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/api:latest
            ghcr.io/${{ github.repository }}/api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Web
        uses: docker/build-push-action@v5
        with:
          context: ./apps/web
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/web:latest
            ghcr.io/${{ github.repository }}/web:${{ github.sha }}

  deploy:
    runs-on: ubuntu-latest
    needs: build-and-push
    steps:
      - uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubeconfig
        run: |
          mkdir -p ~/.kube
          echo "${{ secrets.KUBECONFIG }}" > ~/.kube/config

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/healthflow-api \
            api=ghcr.io/${{ github.repository }}/api:${{ github.sha }} \
            -n healthflow

          kubectl set image deployment/healthflow-web \
            web=ghcr.io/${{ github.repository }}/web:${{ github.sha }} \
            -n healthflow

          kubectl rollout status deployment/healthflow-api -n healthflow
          kubectl rollout status deployment/healthflow-web -n healthflow
```

---

## Configuração do Nginx

### Nginx Principal

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format json escape=json '{'
        '"time":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"method":"$request_method",'
        '"uri":"$uri",'
        '"status":$status,'
        '"body_bytes_sent":$body_bytes_sent,'
        '"request_time":$request_time,'
        '"upstream_response_time":"$upstream_response_time"'
    '}';

    access_log /var/log/nginx/access.log json;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;

    # Upstreams
    upstream api {
        least_conn;
        server api:3001 weight=1;
        keepalive 32;
    }

    upstream web {
        server web:3000 weight=1;
        keepalive 32;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name app.healtflow.com.br;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            limit_req zone=general burst=50 nodelay;
            proxy_pass http://web;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # API Server
    server {
        listen 443 ssl http2;
        server_name api.healtflow.com.br;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location /api/v1/auth {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location / {
            limit_req zone=general burst=50 nodelay;
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # WebSocket support
        location /socket.io {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }
}
```

---

## Monitoramento

### Prometheus Metrics

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'healthflow-api'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: healthflow-api
        action: keep
```

### Alertas

```yaml
# prometheus/alerts.yml
groups:
  - name: healthflow
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"

      - alert: PodNotReady
        expr: kube_pod_status_ready{condition="true"} == 0
        for: 5m
        labels:
          severity: critical
```

### Health Checks

```typescript
// apps/api/src/health/health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @Get('ready')
  @Public()
  async readiness() {
    // Check database, redis, etc.
    return { status: 'ready' };
  }

  @Get('live')
  @Public()
  async liveness() {
    return { status: 'alive' };
  }
}
```

---

## Backup e Recuperação

### Backup do PostgreSQL

```bash
#!/bin/bash
# scripts/backup-postgres.sh

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/healthflow_$TIMESTAMP.sql.gz"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://healthflow-backups/postgres/

# Keep only last 7 days locally
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

### Restore

```bash
#!/bin/bash
# scripts/restore-postgres.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-postgres.sh <backup_file>"
  exit 1
fi

# Download from S3 if needed
if [[ $BACKUP_FILE == s3://* ]]; then
  aws s3 cp $BACKUP_FILE /tmp/restore.sql.gz
  BACKUP_FILE=/tmp/restore.sql.gz
fi

# Restore
gunzip -c $BACKUP_FILE | psql -h $DB_HOST -U $DB_USER -d $DB_NAME

echo "Restore completed"
```

### Kubernetes CronJob para Backup

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: healthflow
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:16-alpine
              command:
                - /bin/sh
                - -c
                - |
                  pg_dump -h $DB_HOST -U $DB_USER | gzip > /backup/backup.sql.gz
              envFrom:
                - secretRef:
                    name: healthflow-secrets
              volumeMounts:
                - name: backup
                  mountPath: /backup
          volumes:
            - name: backup
              persistentVolumeClaim:
                claimName: backup-pvc
          restartPolicy: OnFailure
```

---

## Escalabilidade

### Estratégias de Escala

1. **Horizontal**: Mais pods
2. **Vertical**: Mais recursos por pod
3. **Database Read Replicas**: Para leitura
4. **Cache Layer**: Redis para queries frequentes
5. **CDN**: Para assets estáticos

### Configuração de Cache

```typescript
// Redis caching
@Injectable()
export class CacheService {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## Troubleshooting

### Comandos Úteis

```bash
# Ver logs em tempo real
kubectl logs -f deployment/healthflow-api -n healthflow

# Entrar em um pod
kubectl exec -it <pod-name> -n healthflow -- /bin/sh

# Descrever pod (ver eventos)
kubectl describe pod <pod-name> -n healthflow

# Ver uso de recursos
kubectl top pods -n healthflow

# Verificar status dos serviços
kubectl get services -n healthflow

# Verificar ingress
kubectl get ingress -n healthflow

# Reiniciar deployment
kubectl rollout restart deployment/healthflow-api -n healthflow
```

### Problemas Comuns

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Pod em CrashLoopBackOff | Erro na aplicação | Ver logs do pod |
| ImagePullBackOff | Imagem não encontrada | Verificar registry e credenciais |
| OOMKilled | Falta de memória | Aumentar limits |
| Pending | Recursos insuficientes | Verificar nodes e requests |

---

## Contato

- **DevOps Team**: devops@healtflow.com.br
- **On-Call**: +55 11 99999-9999

---

*Última atualização: Dezembro 2025*
