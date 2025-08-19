// src/models/KnowledgeChunk.js
const mongoose = require('mongoose');

const knowledgeChunkSchema = new mongoose.Schema({
  text: { type: String, required: true },
  source: { type: String, default: '' },
  tags:   { type: [String], default: [] },
  embedding: { type: [Number], default: [] }
}, { timestamps: true });

knowledgeChunkSchema.index({ tags: 1, createdAt: -1 });

module.exports = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
