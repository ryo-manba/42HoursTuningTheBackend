ALTER TABLE record             ADD INDEX record_status(status),
                               ADD INDEX record_created_by(created_by),
                               ADD INDEX recored_created_at(created_at),
                               ADD INDEX recored_updated_at(updated_at);
ALTER TABLE record_item_file   ADD INDEX record_item_file_linked_record_id(linked_record_id);
ALTER TABLE record_comment     ADD INDEX record_comment_linked_record_id(linked_record_id);
ALTER TABLE session            ADD INDEX session_value(value);

ALTER TABLE record             ADD INDEX record_multi_1(category_id, application_group);
ALTER TABLE record             ADD INDEX record_multi_2(created_by, status);
ALTER TABLE record             ADD INDEX record_multi_3(status, category_id, application_group, updated_at, record_id);
ALTER TABLE record             ADD INDEX record_multi_4(status, updated_at, record_id);
ALTER TABLE record_item_file   ADD INDEX record_item_multi(linked_record_id, item_id);
ALTER TABLE record_last_access ADD INDEX record_last_multi(user_id, record_id);