const express = require('express')
const app = express();

app.use(express.json({limit: '10mb'}))

const api = require("./api");
const api_categories = require("./api/categories");
const api_files = require("./api/files");
const api_record_views = require("./api/record-views");
const api_records_comments = require("./api/records-comments");
const api_records_files = require("./api/records-files");
const api_records = require("./api/records");

app.get('/api/hello', (req, res) => {
  console.log('requested');
  res.send({ response :'World!'})
})

app.post('/api/client/records', async (req, res, next) => {
  try {
    await api_records.postRecords(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/records/:recordId', async (req, res, next) => {
  try {
    await api_records.getRecord(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/record-views/tomeActive', async (req, res, next) => {
  try {
    await api_record_views.tomeActive(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/record-views/allActive', async (req, res, next) => {
  try {
    await api_record_views.allActive(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/record-views/allClosed', async (req, res, next) => {
  try {
    await api_record_views.allClosed(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/record-views/mineActive', async (req, res, next) => {
  try {
    await api_record_views.mineActive(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.put('/api/client/records/:recordId', async (req, res, next) => {
  try {
    await api_records.updateRecord(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/records/:recordId/comments', async (req, res, next) => {
  try {
    await api_records_comments.getComments(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.post('/api/client/records/:recordId/comments', async (req, res, next) => {
  try {
    await api_records_comments.postComments(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/categories', async (req, res, next) => {
  try {
    await api_categories.getCategories(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.post('/api/client/files', async (req, res, next) => {
  try {
    await api_files.postFiles(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/records/:recordId/files/:itemId', async (req, res, next) => {
  try {
    await api_records_files.getRecordItemFile(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/records/:recordId/files/:itemId/thumbnail', async (req, res, next) => {
  try {
    await api_records_files.getRecordItemFileThumbnail(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})


app.listen(8000, () => console.log('listening on port 8000...'))

