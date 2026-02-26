# Interview AI - Project Structure

```
interview_ai/
├── client/                      # Web frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API clients
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Utility functions
│   │   └── types/              # TypeScript types
│   ├── public/                 # Static assets
│   └── package.json
│
├── server/                      # Backend API
│   ├── src/
│   │   ├── auth/               # Authentication module
│   │   ├── session-engine/     # Interview session state machine
│   │   ├── speech-service/     # Audio handling
│   │   ├── stt-adapter/        # Speech-to-text integration
│   │   ├── ai-evaluator/       # LLM evaluation logic
│   │   ├── rag-service/        # Resume RAG (optional)
│   │   ├── analytics/          # Metrics and logging
│   │   ├── db/                 # Database models and connections
│   │   ├── schemas/            # JSON schemas
│   │   └── utils/              # Shared utilities
│   ├── tests/                  # Unit and integration tests
│   └── requirements.txt
│
├── infra/                       # Infrastructure as code
│   ├── aws/                    # AWS infra config (DynamoDB, Cognito)
│   └── scripts/                # Deployment scripts
│
├── docs/                        # Documentation
│   ├── api.yaml                # OpenAPI specification
│   ├── design.md               # Design document
│   ├── privacy.md              # Privacy policy
│   └── prompts.md              # LLM prompt templates
│
├── tests/                       # Integration tests
│   └── session-loop/           # End-to-end session tests
│
└── embeddings/                  # RAG tooling (optional)
    └── scripts/                # Embedding generation scripts
```

## Module Responsibilities

### Client

- Audio capture with quality checks
- Real-time feedback display
- Session management UI
- Progress tracking dashboard

### Server

- RESTful API endpoints
- Session state machine
- AI evaluation orchestration
- Database operations

### Core Services

- `auth`: User authentication and authorization
- `session-engine`: Interview flow control
- `ai-evaluator`: LLM-based scoring
- `stt-adapter`: Speech-to-text conversion
- `analytics`: Metrics and monitoring
