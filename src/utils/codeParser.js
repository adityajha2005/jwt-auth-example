const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

function parseRepository(zipPath, repoId) {
  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();
  const files = [];

  zipEntries.forEach((entry) => {
    if (!entry.isDirectory && isTextFile(entry.entryName)) {
      const content = entry.getData().toString('utf8');
      const lines = content.split('\n');
      
      files.push({
        repoId,
        path: entry.entryName,
        content,
        lines: lines.map((line, index) => ({
          lineNumber: index + 1,
          content: line
        })),
        extension: path.extname(entry.entryName),
        size: entry.header.size,
        createdAt: new Date()
      });
    }
  });

  return files;
}

function isTextFile(filename) {
  const textExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.scss',
    '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.go', '.rs', '.rb',
    '.php', '.sh', '.bash', '.yml', '.yaml', '.xml', '.md', '.txt',
    '.env', '.gitignore', '.sql', '.graphql', '.vue', '.svelte'
  ];
  
  const ext = path.extname(filename).toLowerCase();
  return textExtensions.includes(ext) || filename.includes('Dockerfile') || 
         filename.includes('Makefile') || filename.includes('README');
}

function searchInFiles(files, query) {
  const results = [];
  const queryLower = query.toLowerCase();

  files.forEach(file => {
    file.lines.forEach(line => {
      if (line.content.toLowerCase().includes(queryLower)) {
        results.push({
          file: file.path,
          lineNumber: line.lineNumber,
          content: line.content.trim(),
          context: getContext(file.lines, line.lineNumber, 2)
        });
      }
    });
  });

  return results;
}

function getContext(lines, lineNumber, contextSize) {
  const start = Math.max(0, lineNumber - contextSize - 1);
  const end = Math.min(lines.length, lineNumber + contextSize);
  
  return lines.slice(start, end).map(l => ({
    lineNumber: l.lineNumber,
    content: l.content
  }));
}

function extractCodeContext(files, keywords) {
  const context = [];
  
  keywords.forEach(keyword => {
    const matches = searchInFiles(files, keyword);
    context.push(...matches);
  });

  return context;
}

module.exports = {
  parseRepository,
  searchInFiles,
  extractCodeContext,
  isTextFile
};
