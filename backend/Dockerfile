FROM golang:1.26-alpine3.23
WORKDIR /app
COPY main.go .
RUN go build -o server main.go
CMD ["./server"]
