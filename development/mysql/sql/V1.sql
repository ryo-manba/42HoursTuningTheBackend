-- where、order byで指定されているもの全てにINDEXを貼っている
-- TODO: Primary key指定されている場合はいらないかも
ALTER TABLE user               ADD INDEX user_user_id(user_id);
ALTER TABLE group_info         ADD INDEX group_info_group_id(group_id);
ALTER TABLE group_member       ADD INDEX group_member_user_id(user_id);
ALTER TABLE record             ADD INDEX record_status(status),
                               ADD INDEX record_record_id(record_id),
                               ADD INDEX record_created_by(created_by),
                               ADD INDEX recored_created_at(created_at),
                               ADD INDEX recored_updated_at(updated_at)
ALTER TABLE record_item_file   ADD INDEX record_item_file_linked_record_id(linked_record_id),
                               ADD INDEX record_item_file_item_id(item_id);
ALTER TABLE record_last_access ADD INDEX record_last_access(user_id);
ALTER TABLE record_comment     ADD INDEX record_comment_linked_record_id(linked_record_id);
ALTER TABLE category_group     ADD INDEX category_group_group_id(group_id);
ALTER TABLE session            ADD INDEX session_value(value);
ALTER TABLE file               ADD INDEX file_file_id(file_id);
