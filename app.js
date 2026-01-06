const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('./src/utils/database');
const { parseRepository } = require('./src/utils/codeParser');
const { analyzeQuestion, generateAnswer, validateCitations } = require('./src/utils/aiAgent');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('repository'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = await getDatabase();
    const repoName = req.body.name || req.file.originalname.replace('.zip', '');
    
    const repoDoc = {
      name: repoName,
      originalName: req.file.originalname,
      uploadedAt: new Date(),
      size: req.file.size,
      status: 'processing'
    };
    
    const repoResult = await db.collection('repositories').insertOne(repoDoc);
    const repoId = repoResult.insertedId;

    const files = parseRepository(req.file.path, repoId.toString());
    
    if (files.length > 0) {
      await db.collection('files').insertMany(files);
    }

    await db.collection('repositories').updateOne(
      { _id: repoId },
      { $set: { status: 'ready', fileCount: files.length } }
    );

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      repository: {
        id: repoId,
        name: repoName,
        fileCount: files.length
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process repository', details: error.message });
  }
});

app.post('/api/query', async (req, res) => {
  try {
    const { repositoryId, question } = req.body;

    if (!repositoryId || !question) {
      return res.status(400).json({ error: 'Repository ID and question are required' });
    }

    const db = await getDatabase();
    
    const repository = await db.collection('repositories').findOne({ 
      _id: require('mongodb').ObjectId.createFromHexString(repositoryId) 
    });

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    const files = await db.collection('files').find({ 
      repoId: repositoryId 
    }).toArray();

    if (files.length === 0) {
      return res.status(404).json({ error: 'No files found in repository' });
    }

    const analysis = analyzeQuestion(question, files);
    const result = generateAnswer(question, analysis, files);
    
    const validation = validateCitations(result.answer, result.citations);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Response rejected: ' + validation.reason,
        attempted: result
      });
    }

    const queryDoc = {
      repositoryId,
      question,
      answer: result.answer,
      citations: result.citations,
      confidence: result.confidence,
      askedAt: new Date()
    };
    
    await db.collection('queries').insertOne(queryDoc);

    res.json({
      success: true,
      answer: result.answer,
      citations: result.citations,
      confidence: result.confidence
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Failed to process question', details: error.message });
  }
});

app.get('/api/repositories', async (req, res) => {
  try {
    const db = await getDatabase();
    const repositories = await db.collection('repositories')
      .find({})
      .sort({ uploadedAt: -1 })
      .toArray();

    res.json({ repositories });
  } catch (error) {
    console.error('List repositories error:', error);
    res.status(500).json({ error: 'Failed to fetch repositories', details: error.message });
  }
});

app.get('/api/file/:repoId/:filePath(*)', async (req, res) => {
  try {
    const { repoId, filePath } = req.params;
    const db = await getDatabase();
    
    const file = await db.collection('files').findOne({
      repoId,
      path: filePath
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ file });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to fetch file', details: error.message });
  }
});

app.get('/api/repository/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const repository = await db.collection('repositories').findOne({
      _id: require('mongodb').ObjectId.createFromHexString(req.params.id)
    });

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    const files = await db.collection('files').find({ 
      repoId: req.params.id 
    }).project({ path: 1, extension: 1, size: 1 }).toArray();

    res.json({ repository, files });
  } catch (error) {
    console.error('Get repository error:', error);
    res.status(500).json({ error: 'Failed to fetch repository', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Legacy Code Agent server running on port ${PORT}`);
});

module.exports = app;
