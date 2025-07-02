# API Documentation - AL Chatbot Agency

## Base URL
- Development: `http://localhost:3001/api`
- Production: `https://your-api-domain.com/api`

## Authentication
Currently using Supabase Auth. Include the user's JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting
- General API: 100 requests per 15 minutes
- Sensitive operations: 10 requests per 15 minutes  
- Webhooks: 1000 requests per minute

## Endpoints

### Companies

#### GET /companies
Get list of companies with pagination
```
Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- search: string (optional)

Response:
{
  "companies": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### POST /companies
Create a new company
```
Body:
{
  "name": "string (required)",
  "email": "string (required, unique)",
  "phone": "string (optional)",
  "plan": "basic|pro|enterprise (default: basic)"
}

Response: Company object
```

#### GET /companies/:id
Get company details with WhatsApp sessions and tools

#### PUT /companies/:id
Update company information

#### DELETE /companies/:id
Delete company and all related data

#### POST /companies/:id/whatsapp
Create WhatsApp session for company

#### GET /companies/:id/whatsapp/status
Get WhatsApp connection status

### Conversations

#### GET /conversations
Get conversations with filters
```
Query Parameters:
- page: number
- limit: number
- company_id: string (filter by company)
- status: 'active'|'archived'
- search: string (search contact/name)
```

#### GET /conversations/stats
Get conversation statistics

#### GET /conversations/:id
Get conversation details with messages

#### PUT /conversations/:id/status
Update conversation status

#### GET /conversations/:id/messages
Get conversation messages with pagination

### Documents

#### POST /documents/upload
Upload document for training
```
Form Data:
- document: file (PDF, DOC, DOCX, TXT, MD)
- company_id: string

Response: Document object
```

#### GET /documents
Get documents list with filters

#### GET /documents/stats
Get document statistics

#### DELETE /documents/:id
Delete document

### Integrations

#### GET /integrations
Get integrations list
```
Query Parameters:
- company_id: string (filter by company)
```

#### POST /integrations
Create new integration
```
Body:
{
  "company_id": "string (required)",
  "tool_name": "string (required)",
  "tool_type": "calendar|crm|custom (required)",
  "credentials": "object (optional)",
  "custom_config": "object (optional)"
}
```

#### PUT /integrations/:id
Update integration

#### DELETE /integrations/:id
Delete integration

#### POST /integrations/:id/test
Test integration connection

### Webhooks

#### POST /webhook/evolution/:instanceId
Evolution API webhook endpoint (internal)

#### POST /webhook/dify/tools/:toolId
Dify tools callback endpoint (internal)

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "status": 400,
  "details": "Additional details (development only)"
}
```

### Common HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict (duplicate)
- 429: Too Many Requests
- 500: Internal Server Error

## WebSocket Events (Future)
- Real-time conversation updates
- WhatsApp connection status changes
- New message notifications

## Webhook Security
- Webhooks include signature verification
- Rate limiting per IP
- Payload validation

## Examples

### Create Company & Setup WhatsApp
```bash
# 1. Create company
curl -X POST http://localhost:3001/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empresa Teste",
    "email": "teste@empresa.com",
    "plan": "pro"
  }'

# 2. Create WhatsApp session
curl -X POST http://localhost:3001/api/companies/{company_id}/whatsapp

# 3. Check status and get QR code
curl http://localhost:3001/api/companies/{company_id}/whatsapp/status
```

### Upload Training Document
```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -F "document=@manual.pdf" \
  -F "company_id=uuid-here"
```