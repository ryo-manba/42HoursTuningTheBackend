const { getLinkedUser, mylog, pool } = require("../mysql");

// GET categories/
// カテゴリーの取得
const getCategories = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const [rows] = await pool.query(`select * from category`);

  for (const row of rows) {
    mylog(row);
  }

  const items = {};

  for (let i = 0; i < rows.length; i++) {
    items[`${rows[i]['category_id']}`] = { name: rows[i].name };
  }

  res.send({ items });
};

module.exports = {
  getCategories,
};
