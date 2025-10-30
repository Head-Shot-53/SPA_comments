CREATE TABLE `django_content_type` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL
);

CREATE TABLE `auth_permission` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` bigint NOT NULL,
  `codename` varchar(100) NOT NULL
);

CREATE TABLE `auth_group` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(150) NOT NULL
);

CREATE TABLE `auth_user` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime,
  `is_superuser` boolean NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` boolean NOT NULL,
  `is_active` boolean NOT NULL,
  `date_joined` datetime NOT NULL
);

CREATE TABLE `auth_group_permissions` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `group_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL
);

CREATE TABLE `auth_user_groups` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `group_id` bigint NOT NULL
);

CREATE TABLE `auth_user_user_permissions` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL
);

CREATE TABLE `django_admin_log` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `action_time` datetime NOT NULL,
  `object_id` text,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint NOT NULL,
  `change_message` text NOT NULL,
  `content_type_id` bigint,
  `user_id` bigint NOT NULL
);

CREATE TABLE `django_migrations` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime NOT NULL
);

CREATE TABLE `django_session` (
  `session_key` varchar(40) PRIMARY KEY,
  `session_data` text NOT NULL,
  `expire_date` datetime NOT NULL
);

CREATE TABLE `comments_app_commenter` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `username` varchar(32) NOT NULL,
  `email` varchar(254) NOT NULL,
  `homepage` varchar(200),
  `created_at` datetime NOT NULL
);

CREATE TABLE `comments_app_comment` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `text` longtext NOT NULL,
  `created_at` datetime NOT NULL,
  `parent_id` bigint,
  `author_id` bigint NOT NULL
);

CREATE TABLE `comments_app_attachment` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `file` varchar(100) NOT NULL,
  `file_type` varchar(8) NOT NULL,
  `mime` varchar(100) NOT NULL,
  `size_bytes` int NOT NULL,
  `preview_image` varchar(100),
  `created_at` datetime NOT NULL,
  `comment_id` bigint NOT NULL
);

CREATE UNIQUE INDEX `uq_django_content_type` ON `django_content_type` (`app_label`, `model`);

CREATE UNIQUE INDEX `uq_auth_permission` ON `auth_permission` (`content_type_id`, `codename`);

CREATE INDEX `idx_perm_ct` ON `auth_permission` (`content_type_id`);

CREATE INDEX `idx_perm_codename` ON `auth_permission` (`codename`);

CREATE UNIQUE INDEX `uq_auth_group_name` ON `auth_group` (`name`);

CREATE UNIQUE INDEX `uq_auth_user_username` ON `auth_user` (`username`);

CREATE INDEX `idx_auth_user_is_active` ON `auth_user` (`is_active`);

CREATE INDEX `idx_auth_user_is_staff` ON `auth_user` (`is_staff`);

CREATE UNIQUE INDEX `uq_group_permission` ON `auth_group_permissions` (`group_id`, `permission_id`);

CREATE INDEX `idx_gp_group` ON `auth_group_permissions` (`group_id`);

CREATE INDEX `idx_gp_perm` ON `auth_group_permissions` (`permission_id`);

CREATE UNIQUE INDEX `uq_user_group` ON `auth_user_groups` (`user_id`, `group_id`);

CREATE INDEX `idx_ug_user` ON `auth_user_groups` (`user_id`);

CREATE INDEX `idx_ug_group` ON `auth_user_groups` (`group_id`);

CREATE UNIQUE INDEX `uq_user_permission` ON `auth_user_user_permissions` (`user_id`, `permission_id`);

CREATE INDEX `idx_up_user` ON `auth_user_user_permissions` (`user_id`);

CREATE INDEX `idx_up_perm` ON `auth_user_user_permissions` (`permission_id`);

CREATE INDEX `idx_log_ct` ON `django_admin_log` (`content_type_id`);

CREATE INDEX `idx_log_user` ON `django_admin_log` (`user_id`);

CREATE INDEX `idx_log_action_time` ON `django_admin_log` (`action_time`);

CREATE INDEX `idx_migrations_app_name` ON `django_migrations` (`app`, `name`);

CREATE INDEX `idx_migrations_applied` ON `django_migrations` (`applied`);

CREATE INDEX `idx_session_expire_date` ON `django_session` (`expire_date`);

CREATE INDEX `idx_commenter_username` ON `comments_app_commenter` (`username`);

CREATE INDEX `idx_commenter_email` ON `comments_app_commenter` (`email`);

CREATE INDEX `idx_comment_created_at` ON `comments_app_comment` (`created_at`);

CREATE INDEX `idx_comment_parent` ON `comments_app_comment` (`parent_id`);

CREATE INDEX `idx_comment_author` ON `comments_app_comment` (`author_id`);

CREATE INDEX `idx_attachment_comment` ON `comments_app_attachment` (`comment_id`);

CREATE INDEX `idx_attachment_created` ON `comments_app_attachment` (`created_at`);

CREATE INDEX `idx_attachment_mime` ON `comments_app_attachment` (`mime`);

ALTER TABLE `auth_permission` ADD FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);

ALTER TABLE `auth_group_permissions` ADD FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);

ALTER TABLE `auth_group_permissions` ADD FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`);

ALTER TABLE `auth_user_groups` ADD FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`);

ALTER TABLE `auth_user_groups` ADD FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);

ALTER TABLE `auth_user_user_permissions` ADD FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`);

ALTER TABLE `auth_user_user_permissions` ADD FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`);

ALTER TABLE `django_admin_log` ADD FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);

ALTER TABLE `django_admin_log` ADD FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`);

ALTER TABLE `comments_app_comment` ADD FOREIGN KEY (`parent_id`) REFERENCES `comments_app_comment` (`id`);

ALTER TABLE `comments_app_comment` ADD FOREIGN KEY (`author_id`) REFERENCES `comments_app_commenter` (`id`);

ALTER TABLE `comments_app_attachment` ADD FOREIGN KEY (`comment_id`) REFERENCES `comments_app_comment` (`id`);
