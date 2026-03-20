# Image Processing Service API

A NestJS API for authenticated image upload, retrieval, and transformation.

It stores original/transformed images in **Cloudflare R2**, metadata in **PostgreSQL (Prisma)**, and serves short-lived signed URLs for secure access.

## Highlights

- JWT authentication (`/register`, `/login`)
- Image upload (`multipart/form-data`)
- Server-side transformations with Sharp (resize, crop, rotate, flip, mirror, filters, compression, watermark, output format)
- Signed URL generation and auto-renewal when URLs expire
- Standardized success and error response envelopes
- Swagger docs at `/api`

## Tech Stack

- NestJS 11
- Prisma + PostgreSQL
- Cloudflare R2 (S3-compatible)
- Sharp
- Zod validation
- JWT + Argon2

## Architecture Overview

```text
Client
  -> NestJS Controllers
    -> Guards (AuthGuard, ImageGuard)
      -> Services (AuthService, ImagesService, ImageProcessingService, R2Service)
        -> PostgreSQL (Prisma)
        -> Cloudflare R2 (S3 API)
```

### Modules

- `AuthModule`
  - Register/login
  - Password hashing with Argon2 (`ARGON_SECRET`)
  - JWT issuance (`JWT_SECRET`)
- `ImagesModule`
  - Upload/list/get/transform image routes
  - Ownership enforcement via `ImageGuard`
- `R2Module`
  - Upload/download/delete objects on R2
  - Signed URL generation/renewal

### Request/Response Behavior

- All successful responses are wrapped by `ResponseInterceptor`:

```json
{
  "ok": true,
  "statusCode": 200,
  "timestamp": "2026-03-19T00:00:00.000Z",
  "path": "/images",
  "data": {}
}
```

- Errors are normalized by `CatchAllFilter`:

```json
{
  "ok": false,
  "message": "Error validating fields",
  "cause": {},
  "statusCode": 400,
  "timestamp": "2026-03-19T00:00:00.000Z",
  "path": "/images/1/transform"
}
```

## Prerequisites

- Node.js 20+
- pnpm (recommended)
- PostgreSQL 17+ (or Docker Compose service)
- Cloudflare R2 bucket and credentials

## Environment Variables

The app validates these variables at startup:

| Variable | Required | Description |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ARGON_SECRET` | Yes | Secret used by Argon2 hashing/verification |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |
| `CLOUDFLARE_BUCKET` | Yes | R2 bucket name |
| `CLOUDFLARE_TOKEN` | Yes | R2 token (currently validated but not directly used in code) |
| `CLOUDFLARE_KEY_ID` | Yes | R2 access key ID |
| `CLOUDFLARE_ACCESS_KEY` | Yes | R2 secret access key |
| `CLOUDFLARE_URL` | Yes | R2 S3 endpoint URL |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare account ID (validated) |
| `PORT` | No | API port (defaults to `3000`) |

Example `.env`:

```env
DATABASE_URL=postgresql://admin:secret@localhost:5432/image_processing_service?schema=public
ARGON_SECRET=change-me
JWT_SECRET=change-me

CLOUDFLARE_BUCKET=your-bucket
CLOUDFLARE_TOKEN=your-token
CLOUDFLARE_KEY_ID=your-key-id
CLOUDFLARE_ACCESS_KEY=your-access-key
CLOUDFLARE_URL=https://<account-id>.r2.cloudflarestorage.com
CLOUDFLARE_ACCOUNT_ID=your-account-id

PORT=3030
```

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure `.env` with the variables above.

3. Generate Prisma client:

```bash
pnpm prisma generate
```

4. Apply migrations:

```bash
pnpm prisma migrate deploy
```

For local iteration, you can use:

```bash
pnpm prisma migrate dev
```

5. Start the API:

```bash
pnpm start:dev
```

6. Open Swagger UI:

- `http://localhost:3000/api` (or your configured `PORT`)

## Docker Setup

Start API + PostgreSQL with Docker Compose:

```bash
docker compose up --build
```

Defaults from `docker-compose.yml`:

- API: `http://localhost:3030`
- Swagger: `http://localhost:3030/api`
- PostgreSQL: `localhost:5432` (`admin/secret`)

## Authentication Flow

1. `POST /register`
2. `POST /login` -> receive `access_token`
3. Send header on protected routes:

```http
Authorization: Bearer <access_token>
```

## API Reference

Base URL examples:

- Local dev: `http://localhost:3000`
- Docker compose: `http://localhost:3030`

### 1) Register

`POST /register`

Request body:

```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd!",
  "confirmPassword": "P@ssw0rd!"
}
```

Example:

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "P@ssw0rd!",
    "confirmPassword": "P@ssw0rd!"
  }'
```

### 2) Login

`POST /login`

Request body:

```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd!"
}
```

Example:

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "P@ssw0rd!"
  }'
```

### 3) Upload Image

`POST /images` (protected)

Consumes `multipart/form-data` with `file` field.

Accepted mime types by validation: `image/png`, `image/jpeg`.

```bash
curl -X POST http://localhost:3000/images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/absolute/path/to/image.jpg"
```

### 4) List Images

`GET /images?page=1&limit=20` (protected)

- `page` default: `1`
- `limit` default: `20`
- `limit` max enforced: `100`

```bash
curl "http://localhost:3000/images?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 5) Get Image by ID

`GET /images/:id` (protected + ownership check)

```bash
curl http://localhost:3000/images/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 6) Transform Image

`PUT /images/:id/transform` (protected + ownership check)

Request body shape:

```json
{
  "transformations": {
    "resize": { "width": 1200, "height": 800, "fit": "cover" },
    "crop": { "width": 600, "height": 400, "x": 10, "y": 10 },
    "rotate": 90,
    "flip": false,
    "mirror": false,
    "filters": { "grayscale": false, "sepia": true },
    "compress": { "quality": 80 },
    "format": "webp",
    "watermark": { "text": "sample", "fontSize": 24, "opacity": 40 }
  }
}
```

```bash
curl -X PUT http://localhost:3000/images/1/transform \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transformations": {
      "resize": { "width": 1200, "height": 800, "fit": "cover" },
      "format": "webp",
      "compress": { "quality": 80 }
    }
  }'
```

## Transformation Rules (Validation)

- `transformations` is required and must include at least one operation.
- `resize.width|height`: integer `1..8192` (at least one of width/height required).
- `resize.fit`: `cover | contain | fill | inside | outside`.
- `crop.width|height`: integer `1..8192`, `x|y`: integer `>= 0`.
- `rotate`: integer `-360..360`.
- `compress.quality`: integer `1..100`.
- `format`: `jpeg | png | webp | avif`.
- `watermark.text` required when watermark is used.

## Database Schema

- `Users`
  - `id` (uuid, PK)
  - `email` (unique)
  - `password` (argon2 hash)
  - `createdAt`
- `Images`
  - `id` (serial, PK)
  - `url`, `urlExpirationDate`
  - `metadata` (JSON, typed via `PrismaJson.ImageMetadata`)
  - `userId` (FK -> `Users.id`)
  - `createdAt`, `updatedAt`

## Useful Commands

```bash
# development
pnpm start:dev

# build
pnpm build

# tests
pnpm test
pnpm test:e2e
pnpm test:cov

# prisma
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma migrate deploy
```

## Troubleshooting

- `401 Not logged in`
  - Missing/invalid `Authorization: Bearer <token>` header.
- `403 Image not found`
  - Image ID does not belong to authenticated user.
- `400 Error validating fields`
  - Body/query does not match Zod schema.
- Startup env validation failure
  - One or more required env vars are missing.
- R2 request failures
  - Confirm `CLOUDFLARE_URL`, keys, bucket, and account settings.

## Notes

- Swagger docs are generated at runtime and available on `/api`.
- Signed image URLs are time-limited and renewed automatically when needed.
