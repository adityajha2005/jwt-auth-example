# Legacy Code Agent

A Remote Agent for Legacy Code Survival - AI-powered code analysis tool that answers questions about your codebase with mandatory file citations.

## Features

- **Repository Upload**: Upload ZIP files containing your codebase
- **Intelligent Code Analysis**: Ask questions about your code in natural language
- **Mandatory Citations**: Every answer includes file references with line numbers
- **Citation Validation**: Responses without proper file citations are automatically rejected
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **MongoDB Storage**: Persistent storage for repositories, files, and queries

## Key Capabilities

The agent can answer questions like:
- "Why is auth failing for EU users?"
- "Where is rate limiting implemented?"
- "What breaks if I remove Redis?"

All answers include specific file paths and line numbers for verification.

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file or set the following environment variables:

```bash
MONGODB_URI=mongodb://localhost:27017/legacy-code-agent
# or use MDB_MCP_CONNECTION_STRING if available
PORT=3000
```

## Usage

### Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### Upload a Repository

1. Open your browser to `http://localhost:3000`
2. Drag and drop a ZIP file containing your codebase, or click "Choose File"
3. Wait for the repository to be processed

### Ask Questions

1. Select a repository from the list
2. Type your question in the text area
3. Click "Ask Question"
4. View the answer with file citations

## API Endpoints

### POST `/api/upload`
Upload a repository ZIP file

**Request:**
- `multipart/form-data`
- `repository`: ZIP file
- `name`: Repository name (optional)

**Response:**
```json
{
  "success": true,
  "repository": {
    "id": "...",
    "name": "...",
    "fileCount": 10
  }
}
```

### POST `/api/query`
Ask a question about a repository

**Request:**
```json
{
  "repositoryId": "...",
  "question": "Why is auth failing for EU users?"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Based on the authentication code...",
  "citations": [
    {
      "file": "auth.js",
      "lineNumber": 15,
      "content": "const decoded = jwt.verify(token, secret);"
    }
  ],
  "confidence": 0.8
}
```

### GET `/api/repositories`
List all uploaded repositories

**Response:**
```json
{
  "repositories": [
    {
      "_id": "...",
      "name": "my-repo",
      "fileCount": 10,
      "uploadedAt": "2026-01-06T12:00:00Z",
      "status": "ready"
    }
  ]
}
```

### GET `/api/repository/:id`
Get repository details and file list

### GET `/api/file/:repoId/:filePath`
Get specific file content with line numbers

## Citation Validation

The system enforces strict citation requirements:

1. **Every response must include file references**
2. **Each citation must have:**
   - File path
   - Line number
   - Code content

3. **Responses without valid citations are rejected**

This ensures all answers are verifiable and traceable to specific code locations.

## Architecture

### Backend
- **Express.js**: REST API server
- **MongoDB**: Database for repositories, files, and queries
- **Multer**: File upload handling
- **AdmZip**: ZIP file extraction

### Frontend
- **React**: UI components
- **Tailwind CSS**: Styling
- **Vanilla JavaScript**: No build step required

### Code Analysis
- **Keyword Extraction**: Identifies relevant terms from questions
- **Context Search**: Finds matching code across all files
- **Citation Generation**: Creates file references with line numbers
- **Validation**: Ensures all responses include proper citations

## Project Structure

```
/vercel/sandbox/
├── app.js                    # Main Express server
├── package.json              # Dependencies
├── public/
│   └── index.html           # Frontend UI
├── src/
│   ├── components/          # (Future React components)
│   └── utils/
│       ├── database.js      # MongoDB connection
│       ├── codeParser.js    # Repository parsing and search
│       └── aiAgent.js       # Question analysis and answer generation
├── uploads/                 # Temporary upload directory
└── test-repo/              # Sample test repository
```

## Testing

### Test with Sample Repository

A test repository is included with sample files:

```bash
# Upload the test repository
curl -X POST http://localhost:3000/api/upload \
  -F "repository=@test-repository.zip" \
  -F "name=test-repo"

# Ask a question
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryId": "YOUR_REPO_ID",
    "question": "Why is auth failing for EU users?"
  }'
```

### Example Questions

1. **Authentication Issues**
   - "Why is auth failing for EU users?"
   - "How does token verification work?"

2. **Rate Limiting**
   - "Where is rate limiting implemented?"
   - "What are the rate limit settings?"

3. **Dependencies**
   - "What breaks if I remove Redis?"
   - "Where is Redis used?"

## MongoDB Collections

### repositories
Stores uploaded repository metadata
```javascript
{
  _id: ObjectId,
  name: String,
  originalName: String,
  uploadedAt: Date,
  size: Number,
  status: String,
  fileCount: Number
}
```

### files
Stores parsed file contents with line-indexed data
```javascript
{
  repoId: String,
  path: String,
  content: String,
  lines: [{ lineNumber: Number, content: String }],
  extension: String,
  size: Number,
  createdAt: Date
}
```

### queries
Stores questions and answers with citations
```javascript
{
  repositoryId: String,
  question: String,
  answer: String,
  citations: [{ file: String, lineNumber: Number, content: String }],
  confidence: Number,
  askedAt: Date
}
```

## Supported File Types

The parser processes text-based files including:
- JavaScript/TypeScript: `.js`, `.jsx`, `.ts`, `.tsx`
- Python: `.py`
- Java: `.java`
- C/C++: `.c`, `.cpp`, `.h`, `.hpp`
- Go: `.go`
- Rust: `.rs`
- Ruby: `.rb`
- PHP: `.php`
- Shell: `.sh`, `.bash`
- Config: `.json`, `.yml`, `.yaml`, `.xml`, `.env`
- Documentation: `.md`, `.txt`
- Web: `.html`, `.css`, `.scss`
- And more...

## License

ISC

## Contributing

This is a demonstration project for legacy code analysis with mandatory file citations.
