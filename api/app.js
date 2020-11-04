const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
var cors = require('cors');

const app = express();

app.use(cors())
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var helmet = require('helmet');
app.use(helmet());

process.on('uncaughtException', err => {
  console.log("API error: ", err)
})

app.use('/api/v1/', require('./routes/main'));


app.use(function (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(400).json({ err: err });
});

module.exports = app;








