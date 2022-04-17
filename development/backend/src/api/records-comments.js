const { getLinkedUser, mylog, pool } = require("../mysql");

// GET records/{recordId}/comments
// コメントの取得
const getComments = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const recordId = req.params.recordId;

  const commentQs = `SELECT * FROM record_comment WHERE linked_record_id = ? ORDER BY created_at DESC`;

  const [commentResult] = await pool.query(commentQs, [`${recordId}`]);
  mylog(commentResult);

  const commentList = Array(commentResult.length);

  for (let i = 0; i < commentResult.length; i++) {
    let commentInfo = {
      commentId: '',
      value: '',
      createdBy: null,
      createdByName: null,
      createdByPrimaryGroupName: null,
      createdAt: null,
    };
    const line = commentResult[i];

    const [primaryResult] = await pool.query('SELECT group_id FROM group_member WHERE user_id = ? AND is_primary = true', [line.created_by]);
    if (primaryResult.length === 1) {
      const primaryGroupId = primaryResult[0].group_id;

      const [groupResult] = await pool.query('SELECT name FROM group_info WHERE group_id = ?', [primaryGroupId]);
      if (groupResult.length === 1) {
        commentInfo.createdByPrimaryGroupName = groupResult[0].name;
      }
    }

    const [userResult] = await pool.query('SELECT name FROM user WHERE user_id = ?', [line.created_by]);
    if (userResult.length === 1) {
      commentInfo.createdByName = userResult[0].name;
    }

    commentInfo.commentId = line.comment_id;
    commentInfo.value = line.value;
    commentInfo.createdBy = line.created_by;
    commentInfo.createdAt = line.created_at;

    commentList[i] = commentInfo;
  }

  for (const row of commentList) {
    mylog(row);
  }

  res.send({ items: commentList });
};

// POST records/{recordId}/comments
// コメントの投稿
const postComments = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const recordId = req.params.recordId;
  const value = req.body.value;

  await pool.query(
    'INSERT INTO record_comment (linked_record_id, value, created_by, created_at) VALUES (?,?,?, now());',
    [`${recordId}`, `${value}`, user.user_id],
  );

  await pool.query(
    'UPDATE record SET updated_at = now() WHERE record_id = ?;',
    [`${recordId}`],
  );

  res.send({});
};

module.exports = {
  getComments,
  postComments,
};
