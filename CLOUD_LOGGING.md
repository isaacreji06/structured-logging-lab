# Cloud Logging Mapping Guide

This document explains how the structured JSON logs emitted by `orders-api` map to centralized cloud logging platforms (such as Google Cloud Logging, Grafana Loki, AWS CloudWatch, and Datadog) without modifying application business logic.

---

## 1. Automatic JSON Parsing

When container log drivers collect `stdout` and `stderr` streams, cloud logging agents (e.g. Fluentbit, Google Cloud Ops Agent, Promtail, Datadog Agent) automatically detect single-line JSON strings and parse them into structured JSON payloads (`jsonPayload`).

---

## 2. Key Field Mappings

| Local JSON Field | Cloud Field Mapping | Description / Usage |
| :--- | :--- | :--- |
| `ts` | `timestamp` | Standard ISO 8601 UTC timestamp used for time-series indexing and chronologically sorting log events. |
| `level` | `severity` | Mapped to cloud severity enums (`info` $\rightarrow$ `INFO`, `warn` $\rightarrow$ `WARNING`, `error` $\rightarrow$ `ERROR`). Enables severity filtering and alerting. |
| `service` | `resource.labels.service_name` | Identifies the microservice originating the log (`orders-api`), allowing multi-service filtering. |
| `reqId` | `trace` / `correlation_id` | Uniquely identifies a single request journey across microservices, database calls, and async tasks. |
| `msg` | `message` / `textPayload` | Primary event identifier (e.g., `http.request.completed`, `payment.processing.started`). |
| `durationMs`, `statusCode` | `jsonPayload.*` | Numeric metrics for building latency heatmaps, error rate dashboards, and automated SLO alerts. |

---

## 3. Querying & Tracing Examples

### A. Google Cloud Logging (Log Explorer)

- **Filter to Errors Only**:
  ```kql
  jsonPayload.service="orders-api"
  severity="ERROR"
  ```

- **Trace a Specific Failing Request**:
  ```kql
  jsonPayload.reqId="b7e28f3a-912c-4903-a201-9f707f12e8b2"
  ```

---

### B. Grafana Loki (LogQL)

- **Filter to Errors Only**:
  ```logql
  {container="orders-api"} | json | level="error"
  ```

- **Trace a Specific Failing Request**:
  ```logql
  {container="orders-api"} | json | reqId="b7e28f3a-912c-4903-a201-9f707f12e8b2"
  ```

---

## 4. Alerting & Metrics

Structured logs allow operators to build log-based metrics:
1. **Error Rate Alerting**: Count log events where `level == "error"` over 5-minute rolling windows.
2. **Latency Alerts**: Aggregate `durationMs` fields from `http.request.completed` to monitor p95 response time.
3. **Security Auditing**: Sanitize all fields to guarantee zero raw credentials or secrets are logged, recording only clean identifiers (`reqId`, `customer_id`, `orderId`).
