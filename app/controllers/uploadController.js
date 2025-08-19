// controllers/uploadController.js
'use strict';

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Image } = require('../models');

const MAX_SIZE_MB = 5;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// Папка хранения: <proj>/public/images
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

// убедимся, что папка существует
fs.mkdirSync(IMAGES_DIR, { recursive: true });

// генерация безопасного имени
function safeName(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const base = path.basename(originalName || 'image', ext)
    .toString()
    .normalize('NFKD')
    .replace(/[^\w\-]+/g, '-') // заменим пробелы/кириллицу и т.п.
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '')
    .substring(0, 60) || 'image';
  const stamp = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${base}-${stamp}-${rnd}${ext || '.jpg'}`;
}

// хранилище multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) => cb(null, safeName(file.originalname))
});

// фильтр типов
function fileFilter(_req, file, cb) {
  if (!ALLOWED.includes(file.mimetype)) {
    return cb(new Error('Поддерживаются только JPG/PNG/WebP'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 }
}).single('file');

// POST /api/v1/uploads/images
async function uploadImage(req, res) {
  upload(req, res, async (err) => {
    try {
      if (err) {
        const msg =
          err.code === 'LIMIT_FILE_SIZE'
            ? `Размер файла не должен превышать ${MAX_SIZE_MB} МБ`
            : (err.message || 'Ошибка загрузки файла');
        return res.status(400).json({ code: 'UPLOAD_ERROR', message: msg });
      }
      if (!req.file) {
        return res.status(400).json({ code: 'NO_FILE', message: 'Файл не получен. Отправьте поле "file".' });
      }

      // относительный путь, по которому файл будет доступен из статики
      const webPath = '/images/' + req.file.filename;

      // абсолютный URL (если нужно) — берём из ENV или собираем из запроса
      const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
      const fileUrl = `${base}${webPath}`;

      // создаём запись в БД
      const row = await Image.create({
        file_path: webPath,       // '/images/xxx.webp'
        file_url: webPath,        // можно хранить относительный, фронт сам подставит базу
        file_size: req.file.size
      });

      return res.status(201).json({
        id: row.id,
        file_path: row.file_path,
        file_url: row.file_url,   // если нужен абсолютный — отправьте fileUrl
        file_size: row.file_size,
        mimetype: req.file.mimetype,
        filename: req.file.filename
      });
    } catch (e) {
      console.error('uploadImage error:', e);
      return res.status(500).json({ code: 'SERVER_ERROR', message: 'Ошибка сервера при загрузке изображения' });
    }
  });
}

module.exports = { uploadImage };
