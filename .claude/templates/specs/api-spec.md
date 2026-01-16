# API Spec: {{API_NAME}}

> **版本**: 1.0
> **创建日期**: {{DATE}}
> **作者**: {{AUTHOR}}
> **状态**: Draft | Review | Approved
> **Base URL**: `{{BASE_URL}}`

## Description

<!-- 简洁描述这个 API 的功能和用途 -->

## Endpoint

```
{{HTTP_METHOD}} {{PATH}}
```

### Example

```bash
{{HTTP_METHOD}} {{BASE_URL}}{{PATH}}
```

## Request

### Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Content-Type` | string | Yes | `application/json` |
| `Authorization` | string | Condition | `Bearer {{TOKEN}}` |
| `{{HEADER_NAME}}` | {{TYPE}} | {{REQUIRED}} | {{DESCRIPTION}} |

### Path Parameters

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `{{PARAM_NAME}}` | {{TYPE}} | Yes | {{DESCRIPTION}} | {{CONSTRAINTS}} |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `{{PARAM_NAME}}` | {{TYPE}} | {{REQUIRED}} | {{DEFAULT}} | {{DESCRIPTION}} |

### Request Body

```json
{
  "{{FIELD_NAME}}": {{VALUE}},
  "{{FIELD_NAME}}": {{VALUE}}
}
```

#### Request Schema

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| {{FIELD_NAME}} | {{TYPE}} | Yes/No | {{CONSTRAINTS}} | {{DESCRIPTION}} |

### Request Example

```bash
curl -X {{HTTP_METHOD}} "{{BASE_URL}}{{PATH}}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -d '{
    "{{FIELD_NAME}}": {{VALUE}}
  }'
```

## Response

### Success Response

**Status Code**: `200 OK`

```json
{
  "{{FIELD_NAME}}": {{VALUE}},
  "{{FIELD_NAME}}": {{VALUE}}
}
```

#### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| {{FIELD_NAME}} | {{TYPE}} | {{DESCRIPTION}} |

### Error Responses

#### 400 Bad Request

```json
{
  "error": {
    "code": "{{ERROR_CODE}}",
    "message": "{{ERROR_MESSAGE}}",
    "details": {{DETAILS}}
  }
}
```

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 404 Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "{{RESOURCE}} not found"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Status Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

## Authentication

<!-- 描述认证方式 -->
- **类型**: {{AUTH_TYPE}} (Bearer Token, API Key, OAuth2, etc.)
- **获取方式**: {{HOW_TO_GET_TOKEN}}
- **有效期**: {{TOKEN_VALIDITY}}

## Rate Limiting

| Limit | Time Window | Scope |
|-------|-------------|-------|
| {{LIMIT_COUNT}} | {{TIME_WINDOW}} | {{SCOPE}} |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699123456
```

## Business Rules

<!-- 定义 API 的业务逻辑规则 -->
1. **规则名称**: {{RULE_DESCRIPTION}}
   - 条件: {{CONDITION}}
   - 结果: {{RESULT}}

## Pagination

<!-- 如果支持分页 -->
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Page number |
| `limit` | integer | 20 | 100 | Items per page |

## Filtering & Sorting

<!-- 支持的过滤和排序选项 -->

### Filters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `{{FILTER_NAME}}` | {{TYPE}} | `{{EXAMPLE}}` | {{DESCRIPTION}} |

### Sorting

| Parameter | Values | Default |
|-----------|--------|---------|
| `sort` | `{{FIELD1}},-{{FIELD2}}` | `{{DEFAULT_SORT}}` |

## Test Cases

### Test Case 1: {{TEST_NAME}}

```bash
# Request
{{HTTP_METHOD}} {{BASE_URL}}{{PATH}}

# Expected Response
Status: 200
{
  "{{FIELD}}": {{VALUE}}
}
```

## Dependencies

<!-- API 依赖的其他服务或组件 -->
- `{{SERVICE_NAME}}`: {{PURPOSE}}

## Performance Requirements

- **最大响应时间**: {{RESPONSE_TIME_LIMIT}}
- **吞吐量**: {{THROUGHPUT}} requests/second

## Security Considerations

- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Audit logging

## Examples

### Example 1: {{EXAMPLE_TITLE}}

```bash
curl -X {{HTTP_METHOD}} "{{BASE_URL}}{{PATH}}" \
  -H "Content-Type: application/json" \
  -d '{
    "{{FIELD}}": {{VALUE}}
  }'

# Response
{
  "{{FIELD}}": {{VALUE}}
}
```

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | {{DATE}} | Initial version | {{AUTHOR}} |
