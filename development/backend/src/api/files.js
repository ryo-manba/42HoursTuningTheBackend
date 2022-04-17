const { v4: uuidv4 } = require('uuid');

const sharp = require('sharp');

const { getLinkedUser, mylog, pool } = require("../mysql");

const filePath = 'file/';

const THUBM_IMG_SIZE = 60;

// POST files/
// ファイルのアップロード
const postFiles = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const base64Data = req.body.data;
  mylog(base64Data);

  const name = req.body.name;

  const newId = uuidv4();
  const newThumbId = uuidv4();

  const binary = Buffer.from(base64Data, 'base64');

  const tmpFilePath = `${filePath}${newId}_${name}.webp`;

  const img_webp = await sharp(binary).webp();
  await img_webp.toFile(tmpFilePath);

  const meta = await img_webp.metadata();
  mylog(meta.width);
  mylog(meta.height);

  const size = Math.min(meta.width, meta.height, THUBM_IMG_SIZE);

  const tmpThumbFilePath = `${filePath}${newThumbId}_thumb_${name}`;
  await img_webp.resize(size, size).toFile(tmpThumbFilePath);

  await pool.query(
    `INSERT INTO file (file_id, path, name)
        VALUES (?, ?, ?)`,
    [`${newId}`, tmpFilePath, `${name}`],
  );
  await pool.query(
    `INSERT INTO file (file_id, path, name)
        VALUES (?, ?, ?)`,
    [`${newThumbId}`, tmpThumbFilePath, `thumb_${name}`],
  );

  res.send({ fileId: newId, thumbFileId: newThumbId });
};

module.exports = {
  postFiles,
};