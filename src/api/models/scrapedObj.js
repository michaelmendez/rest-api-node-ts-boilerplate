const mongoose = require('mongoose')

const scrapings = new mongoose.Schema({
  url: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  datetime: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  sentences: {
    type: Array,
    required: true,
    trim: true
  }
})

const scrapingsz = mongoose.model('scrapings', scrapings)
module.exports = scrapingsz
