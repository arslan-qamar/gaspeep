FROM golang:1.21-alpine as builder

RUN apk add --no-cache git

ENV GOSUMDB=off

WORKDIR /app
COPY . .
RUN go mod download && go mod tidy

RUN CGO_ENABLED=0 GOOS=linux go build -a -o api cmd/api/main.go

FROM alpine:latest

RUN apk --no-cache add ca-certificates postgresql-client

WORKDIR /root/

COPY --from=builder /app/api .
COPY --from=builder /app/internal/migrations ./internal/migrations

EXPOSE 8080

CMD ["./api"]
