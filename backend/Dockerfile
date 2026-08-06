# ==========================================
# STAGE 1: Build binary using official Go
# ==========================================
FROM golang:1.26-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o main ./main.go

# ==========================================
# STAGE 2: Minimal Distroless Runtime
# ==========================================
FROM gcr.io/distroless/static-debian12:nonroot

# Copy certs and timezone
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Put the binary in both locations so no matter what SnapDeploy invokes, it finds it
COPY --from=builder /app/main /main
COPY --from=builder /app/main /app/main

EXPOSE 30001
USER nonroot:nonroot

ENTRYPOINT ["/main"]
