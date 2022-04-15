const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const jimp = require('jimp');

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

  await fs.writeFile(`${filePath}${newId}_${name}`, binary);

  const image = await jimp.read(binary);
  mylog(image.bitmap.width);
  mylog(image.bitmap.height);

  const size = Math.min(image.bitmap.width, image.bitmap.height, THUBM_IMG_SIZE);
  await image.cover(size, size);

  await image.writeAsync(`${filePath}${newThumbId}_thumb_${name}`);

  await pool.query(
    `insert into file (file_id, path, name)
        values (?, ?, ?)`,
    [`${newId}`, `${filePath}${newId}_${name}`, `${name}`],
  );
  await pool.query(
    `insert into file (file_id, path, name)
        values (?, ?, ?)`,
    [`${newThumbId}`, `${filePath}${newThumbId}_thumb_${name}`, `thumb_${name}`],
  );

  res.send({ fileId: newId, thumbFileId: newThumbId });
};

module.exports = {
  postFiles,
};