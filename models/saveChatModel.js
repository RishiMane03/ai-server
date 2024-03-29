const mongoose = require('mongoose');

const saveChatSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  }
});

// Create a compound index on role and content fields
saveChatSchema.index({ role: 1, content: 1 }, { unique: true });

const saveChatModel = mongoose.model('SaveChat', saveChatSchema);

module.exports = saveChatModel;

/**
 * In MongoDB, when creating indexes, the value 1 indicates that the index is created in 
 * ascending order for the specified field. Conversely, the value -1 would create an index 
 * in descending order.
 * In the context of the line saveChatSchema.index({ role: 1, content: 1 }, { unique: true });,
 *  { role: 1, content: 1 } specifies a compound index on the role and content fields, 
 * both in ascending order.
 * Using 1 here indicates that MongoDB should sort the index keys for both role and content 
 * in ascending order. This can help in efficient querying and sorting operations.
 * 
 * In summary, by using 1 for both role and content, we're instructing MongoDB to create an
 * index where both fields are sorted in ascending order, which can be beneficial for certain
 * types of queries and operations.
 */
