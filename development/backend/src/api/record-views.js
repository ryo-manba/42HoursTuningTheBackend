const { getLinkedUser, mylog, pool } = require("../mysql");

// GET /record-views/tomeActive
// 自分宛一覧
const tomeActive = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const [myGroupResult] = await pool.query("SELECT group_id FROM group_member WHERE user_id = ?", [user.user_id]);
  mylog(myGroupResult);

  const targetCategoryAppGroupList = [];

  for (let i = 0; i < myGroupResult.length; i++) {
    const groupId = myGroupResult[i].group_id;
    mylog(groupId);

    const [targetResult] = await pool.query("SELECT category_id, application_group FROM category_group WHERE group_id = ?", [groupId]);
    for (let j = 0; j < targetResult.length; j++) {
      const targetLine = targetResult[j];
      mylog(targetLine);

      targetCategoryAppGroupList.push({
        categoryId: targetLine.category_id,
        applicationGroup: targetLine.application_group,
      });
    }
  }

  let searchRecordQs =
    'SELECT * FROM record WHERE status = "open" AND (category_id, application_group) IN (';
  let recordCountQs =
    'SELECT COUNT(*) FROM record WHERE status = "open" AND (category_id, application_group) in (';
  const param = [];

  for (let i = 0; i < targetCategoryAppGroupList.length; i++) {
    if (i !== 0) {
      searchRecordQs += ', (?, ?)';
      recordCountQs += ', (?, ?)';
    } else {
      searchRecordQs += ' (?, ?)';
      recordCountQs += ' (?, ?)';
    }
    param.push(targetCategoryAppGroupList[i].categoryId);
    param.push(targetCategoryAppGroupList[i].applicationGroup);
  }
  searchRecordQs += ' ) ORDER BY updated_at desc, record_id  LIMIT ? OFFSET ?';
  recordCountQs += ' )';

  mylog(searchRecordQs);
  mylog(param);

  recordResultParser(
    req,
    res,
    user.user_id,
    searchRecordQs,
    param,
    recordCountQs,
    param
  );
};

// GET /record-views/allActive
// 全件一覧
const allActive = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  recordResultParser(
    req,
    res,
    user.user_id,
    'SELECT * FROM record WHERE status = "open" ORDER BY updated_at DESC, record_id ASC LIMIT ? OFFSET ?',
    [],
    'SELECT COUNT(*) FROM record WHERE status = "open"'
  );
};

// GET /record-views/allClosed
// クローズ一覧
const allClosed = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  recordResultParser(
    req,
    res,
    user.user_id,
    'SELECT * FROM record WHERE status = "closed" ORDER BY updated_at DESC, record_id ASC LIMIT ? OFFSET ?',
    [],
    'SELECT COUNT(*) FROM record WHERE status = "closed"'
  );
};

// GET /record-views/mineActive
// 自分が申請一覧
const mineActive = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  recordResultParser(
    req,
    res,
    user.user_id,
    'SELECT * FROM record WHERE created_by = ? AND status = "open" ORDER BY updated_at DESC, record_id ASC LIMIT ? OFFSET ?',
    [user.user_id],
    'SELECT COUNT(*) FROM record WHERE created_by = ? AND status = "open"',
    [user.user_id]
  );
};

const recordResultParser = async (req, res, user_id, searchRecordQs, searchRecordParams, recordCountQs, recordCountParams) => {
  searchRecordParams ??= [];

  let offset = Number(req.query.offset);
  let limit = Number(req.query.limit);

  if (Number.isNaN(offset) || Number.isNaN(limit)) {
    offset = 0;
    limit = 10;
  }

  searchRecordParams.push(limit);
  searchRecordParams.push(offset);

  const [recordResult] = await pool.query(searchRecordQs, searchRecordParams);
  mylog(recordResult);

  const items = Array(recordResult.length);
  let count = 0;

  for (let i = 0; i < recordResult.length; i++) {
    const resObj = {
      recordId: null,
      title: '',
      applicationGroup: null,
      applicationGroupName: null,
      createdBy: null,
      createdByName: null,
      createAt: '',
      commentCount: 0,
      isUnConfirmed: true,
      thumbNailItemId: null,
      updatedAt: '',
    };

    const line = recordResult[i];
    mylog(line);
    const recordId = recordResult[i].record_id;
    const createdBy = line.created_by;
    const applicationGroup = line.application_group;
    const updatedAt = line.updated_at;
    let createdByName = null;
    let applicationGroupName = null;
    let thumbNailItemId = null;
    let commentCount = 0;
    let isUnConfirmed = true;

    const [userResult] = await pool.query('SELECT name FROM user WHERE user_id = ?', [createdBy]);
    if (userResult.length === 1) {
      createdByName = userResult[0].name;
    }

    const [groupResult] = await pool.query('SELECT name FROM group_info WHERE group_id = ?', [applicationGroup]);
    if (groupResult.length === 1) {
      applicationGroupName = groupResult[0].name;
    }

    const [itemResult] = await pool.query('SELECT item_id FROM record_item_file WHERE linked_record_id = ? ORDER BY item_id ASC LIMIT 1', [recordId]);
    if (itemResult.length === 1) {
      thumbNailItemId = itemResult[0].item_id;
    }

    const [countResult] = await pool.query('SELECT COUNT(*) FROM record_comment WHERE linked_record_id = ?', [recordId]);
    if (countResult.length === 1) {
      commentCount = countResult[0]['COUNT(*)'];
    }

    const [lastResult] = await pool.query('SELECT * FROM record_last_access WHERE user_id = ? AND record_id = ?', [user_id, recordId]);
    if (lastResult.length === 1) {
      mylog(updatedAt);
      const updatedAtNum = Date.parse(updatedAt);
      const accessTimeNum = Date.parse(lastResult[0].access_time);
      if (updatedAtNum <= accessTimeNum) {
        isUnConfirmed = false;
      }
    }

    resObj.recordId = recordId;
    resObj.title = line.title;
    resObj.applicationGroup = applicationGroup;
    resObj.applicationGroupName = applicationGroupName;
    resObj.createdBy = createdBy;
    resObj.createdByName = createdByName;
    resObj.createAt = line.created_at;
    resObj.commentCount = commentCount;
    resObj.isUnConfirmed = isUnConfirmed;
    resObj.thumbNailItemId = thumbNailItemId;
    resObj.updatedAt = updatedAt;

    items[i] = resObj;
  }

  const [recordCountResult] = await pool.query(recordCountQs, recordCountParams);
  if (recordCountResult.length === 1) {
    count = recordCountResult[0]['COUNT(*)'];
  }

  res.send({ count: count, items: items });
}

module.exports = {
  tomeActive,
  allActive,
  allClosed,
  mineActive
};
