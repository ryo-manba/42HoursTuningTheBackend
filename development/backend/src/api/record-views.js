const { getLinkedUser, mylog, pool } = require("../mysql");

const getValuesWhichHasValuesIn = (targetColumn, tableName, valuesIn, values) => {
  if (values.length <= 0)
    return [];

  return pool.query(
    `select ${targetColumn} from ${tableName} where ${valuesIn} in (${",?".repeat(values.length).slice(1)})`,
    values
  ).then(arr => arr[0]);
};

// GET /record-views/tomeActive
// 自分宛一覧
const tomeActive = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  let offset = Number(req.query.offset);
  let limit = Number(req.query.limit);

  if (Number.isNaN(offset) || Number.isNaN(limit)) {
    offset = 0;
    limit = 10;
  }

  const [myGroupResult] = await pool.query("select group_id from group_member where user_id = ?", [user.user_id]);
  mylog(myGroupResult);

  const targetCategoryAppGroupList = await getValuesWhichHasValuesIn(
    "category_id, application_group",
    "category_group",
    "group_id",
    myGroupResult.map(v => v.group_id),
  );
  mylog(targetCategoryAppGroupList);

  let searchRecordQs =
    'select * from record where status = "open" and (category_id, application_group) in (';
  let recordCountQs =
    'select count(*) from record where status = "open" and (category_id, application_group) in (';
  const param = [];

  for (let i = 0; i < targetCategoryAppGroupList.length; i++) {
    if (i !== 0) {
      searchRecordQs += ', (?, ?)';
      recordCountQs += ', (?, ?)';
    } else {
      searchRecordQs += ' (?, ?)';
      recordCountQs += ' (?, ?)';
    }
    param.push(targetCategoryAppGroupList[i].category_id);
    param.push(targetCategoryAppGroupList[i].application_group);
  }
  searchRecordQs += ' ) order by updated_at desc, record_id  limit ? offset ?';
  recordCountQs += ' )';
  param.push(limit);
  param.push(offset);
  mylog(searchRecordQs);
  mylog(param);

  const [recordResult] = await pool.query(searchRecordQs, param);
  mylog(recordResult);

  const items = Array(recordResult.length);
  let count = 0;

  const searchUserQs = 'select * from user where user_id = ?';
  const searchGroupQs = 'select * from group_info where group_id = ?';
  const searchThumbQs =
    'select * from record_item_file where linked_record_id = ? order by item_id asc limit 1';
  const countQs = 'select count(*) from record_comment where linked_record_id = ?';
  const searchLastQs = 'select * from record_last_access where user_id = ? and record_id = ?';

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

    const [userResult] = await pool.query(searchUserQs, [createdBy]);
    if (userResult.length === 1) {
      createdByName = userResult[0].name;
    }

    const [groupResult] = await pool.query(searchGroupQs, [applicationGroup]);
    if (groupResult.length === 1) {
      applicationGroupName = groupResult[0].name;
    }

    const [itemResult] = await pool.query(searchThumbQs, [recordId]);
    if (itemResult.length === 1) {
      thumbNailItemId = itemResult[0].item_id;
    }

    const [countResult] = await pool.query(countQs, [recordId]);
    if (countResult.length === 1) {
      commentCount = countResult[0]['count(*)'];
    }

    const [lastResult] = await pool.query(searchLastQs, [user.user_id, recordId]);
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

  const [recordCountResult] = await pool.query(recordCountQs, param);
  if (recordCountResult.length === 1) {
    count = recordCountResult[0]['count(*)'];
  }

  res.send({ count: count, items: items });
};

// GET /record-views/allActive
// 全件一覧
const allActive = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  let offset = Number(req.query.offset);
  let limit = Number(req.query.limit);

  if (Number.isNaN(offset) || Number.isNaN(limit)) {
    offset = 0;
    limit = 10;
  }

  const searchRecordQs = `select * from record where status = "open" order by updated_at desc, record_id asc limit ? offset ?`;

  const [recordResult] = await pool.query(searchRecordQs, [limit, offset]);
  mylog(recordResult);

  const items = Array(recordResult.length);
  let count = 0;

  const searchUserQs = 'select * from user where user_id = ?';
  const searchGroupQs = 'select * from group_info where group_id = ?';
  const searchThumbQs =
    'select * from record_item_file where linked_record_id = ? order by item_id asc limit 1';
  const countQs = 'select count(*) from record_comment where linked_record_id = ?';
  const searchLastQs = 'select * from record_last_access where user_id = ? and record_id = ?';

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

    const [userResult] = await pool.query(searchUserQs, [createdBy]);
    if (userResult.length === 1) {
      createdByName = userResult[0].name;
    }

    const [groupResult] = await pool.query(searchGroupQs, [applicationGroup]);
    if (groupResult.length === 1) {
      applicationGroupName = groupResult[0].name;
    }

    const [itemResult] = await pool.query(searchThumbQs, [recordId]);
    if (itemResult.length === 1) {
      thumbNailItemId = itemResult[0].item_id;
    }

    const [countResult] = await pool.query(countQs, [recordId]);
    if (countResult.length === 1) {
      commentCount = countResult[0]['count(*)'];
    }

    const [lastResult] = await pool.query(searchLastQs, [user.user_id, recordId]);
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

  const recordCountQs = 'select count(*) from record where status = "open"';

  const [recordCountResult] = await pool.query(recordCountQs);
  if (recordCountResult.length === 1) {
    count = recordCountResult[0]['count(*)'];
  }

  res.send({ count: count, items: items });
};

// GET /record-views/allClosed
// クローズ一覧
const allClosed = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  let offset = Number(req.query.offset);
  let limit = Number(req.query.limit);

  if (Number.isNaN(offset) || Number.isNaN(limit)) {
    offset = 0;
    limit = 10;
  }

  const searchRecordQs = `select * from record where status = "closed" order by updated_at desc, record_id asc limit ? offset ?`;

  const [recordResult] = await pool.query(searchRecordQs, [limit, offset]);
  mylog(recordResult);

  const items = Array(recordResult.length);
  let count = 0;

  const searchUserQs = 'select * from user where user_id = ?';
  const searchGroupQs = 'select * from group_info where group_id = ?';
  const searchThumbQs =
    'select * from record_item_file where linked_record_id = ? order by item_id asc limit 1';
  const countQs = 'select count(*) from record_comment where linked_record_id = ?';
  const searchLastQs = 'select * from record_last_access where user_id = ? and record_id = ?';

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

    const [userResult] = await pool.query(searchUserQs, [createdBy]);
    if (userResult.length === 1) {
      createdByName = userResult[0].name;
    }

    const [groupResult] = await pool.query(searchGroupQs, [applicationGroup]);
    if (groupResult.length === 1) {
      applicationGroupName = groupResult[0].name;
    }

    const [itemResult] = await pool.query(searchThumbQs, [recordId]);
    if (itemResult.length === 1) {
      thumbNailItemId = itemResult[0].item_id;
    }

    const [countResult] = await pool.query(countQs, [recordId]);
    if (countResult.length === 1) {
      commentCount = countResult[0]['count(*)'];
    }

    const [lastResult] = await pool.query(searchLastQs, [user.user_id, recordId]);
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

  const recordCountQs = 'select count(*) from record where status = "closed"';

  const [recordCountResult] = await pool.query(recordCountQs);
  if (recordCountResult.length === 1) {
    count = recordCountResult[0]['count(*)'];
  }

  res.send({ count: count, items: items });
};

// GET /record-views/mineActive
// 自分が申請一覧
const mineActive = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  let offset = Number(req.query.offset);
  let limit = Number(req.query.limit);

  if (Number.isNaN(offset) || Number.isNaN(limit)) {
    offset = 0;
    limit = 10;
  }

  const searchRecordQs = `select * from record where created_by = ? and status = "open" order by updated_at desc, record_id asc limit ? offset ?`;

  const [recordResult] = await pool.query(searchRecordQs, [user.user_id, limit, offset]);
  mylog(recordResult);

  const items = Array(recordResult.length);
  let count = 0;

  const searchUserQs = 'select * from user where user_id = ?';
  const searchGroupQs = 'select * from group_info where group_id = ?';
  const searchThumbQs =
    'select * from record_item_file where linked_record_id = ? order by item_id asc limit 1';
  const countQs = 'select count(*) from record_comment where linked_record_id = ?';
  const searchLastQs = 'select * from record_last_access where user_id = ? and record_id = ?';

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

    const [userResult] = await pool.query(searchUserQs, [createdBy]);
    if (userResult.length === 1) {
      createdByName = userResult[0].name;
    }

    const [groupResult] = await pool.query(searchGroupQs, [applicationGroup]);
    if (groupResult.length === 1) {
      applicationGroupName = groupResult[0].name;
    }

    const [itemResult] = await pool.query(searchThumbQs, [recordId]);
    if (itemResult.length === 1) {
      thumbNailItemId = itemResult[0].item_id;
    }

    const [countResult] = await pool.query(countQs, [recordId]);
    if (countResult.length === 1) {
      commentCount = countResult[0]['count(*)'];
    }

    const [lastResult] = await pool.query(searchLastQs, [user.user_id, recordId]);
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

  const recordCountQs = 'select count(*) from record where created_by = ? and status = "open"';

  const [recordCountResult] = await pool.query(recordCountQs, [user.user_id]);
  if (recordCountResult.length === 1) {
    count = recordCountResult[0]['count(*)'];
  }

  res.send({ count: count, items: items });
};

module.exports = {
  tomeActive,
  allActive,
  allClosed,
  mineActive
};
