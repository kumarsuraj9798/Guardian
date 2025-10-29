const router = require('express').Router();
const { report } = require('../controllers/reportController');
const { authRequired } = require('../utils/authMiddleware');
const upload = require('../utils/upload');
const path = require('path');

// Route for file upload
router.post('/', 
  authRequired, 
  upload.single('image'), // 'image' is the field name in the form
  async (req, res, next) => {
    try {
      // If file was uploaded, add its path to the request body
      if (req.file) {
        req.body.media = [
          {
            url: `/uploads/${req.file.filename}`,
            type: req.file.mimetype,
            filename: req.file.filename
          }
        ];
      }
      next();
    } catch (error) {
      console.error('Error processing file upload:', error);
      return res.status(500).json({ message: 'Error processing file upload' });
    }
  },
  report
);

// Serve uploaded files
router.use('/uploads', require('express').static(path.join(__dirname, '../uploads')));

module.exports = router;