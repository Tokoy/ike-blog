---
layout: '../../layouts/MarkdownPost.astro'
title: 'grafanadb迁移到mysql'
pubDate: 2023-03-13
description: '把grafana默认的sqllite3数据库迁移到mysql'
author: 'ike'
cover:
    url: '\static\images\sqlite.png'
    square: '\static\images\sqlite.png'
    alt: 'cover'
tags: ["运维", "技术", "grafana","mysql","sqlite"]
theme: 'light'
featured: false
---

因为安全需求需要把grafana的数据库迁移到云上mysql，所以总结了一些遇到的问题：

先说步骤：

1.`sqlite3 /var/lib/grafana/grafana.db .dump > grafana.sql`

2.`shell mysql -u username -p -h localhost database_name < grafana.sql `

3.修改/etc/grafana/grafana.ini，添加
```mysql
database type = mysql
host = localhost:3306
name = database_name
user = username
password = userpassword
```

4.然后重启grafana即可 
`systemctl restart grafana-server`


PS:但是mysql语法和sqllite语法是有区别的，所以第二步之前需要修改grafana.sql的语法格式：

- PRAGMA foreign_keys=OFF;BEGIN TRANSACTION;没有这个语句，需要删掉

- 🐦📊之类的表情最好不要有，存储会报错，虽然也可以解决（data是列名，TEXT是类型)：
ALTER TABLE dashboard_version CHANGE data data  TEXT CHARACTER SET utf8mb4 ; 

- AUTOINCREMENT  改为 AUTO_INCREMENT

- TEXT默认一般不能有DEFAULT，最好改为VARCHAR(255)

- TEXT格式是不能作为UNIQUE  INDEX的  必须要修改为VARCHAR(255)

- datetime 可能会出现格式问题 2023-03-02 14:36:35.578526458+8:00  只要把最后的+8:00去掉就可以了
