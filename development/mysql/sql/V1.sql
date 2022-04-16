-- where、order byで2回以上指定されているものにindexをはる
ALTER TABLE user             ADD INDEX user_user_id(user_id);
ALTER TABLE category_group   ADD INDEX category_group_group_id(group_id);
ALTER TABLE record_item_file ADD INDEX record_item_file_linked_record_id(linked_record_id);
                             ADD INDEX record_item_file_item_id(item_id);
ALTER TABLE record           ADD INDEX record_record_id(record_id),
                             ADD INDEX record_created_by(created_by);
                             ADD INDEX recored_updated_at(updated_at);
