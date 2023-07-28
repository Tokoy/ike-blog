---
layout: '../../layouts/MarkdownPost.astro'
title: '快速安装部署clickhouse和cloki'
pubDate: 2023-07-28
description: '快速安装部署clickhouse和cloki'
author: 'ike'
cover:
    url: '\static\images\IMG_5056.JPG'
    square: '\static\images\IMG_5056.JPG'
    alt: 'cover'
tags: ["技术", "运维", "clickhouse", "cloki"]
theme: 'light'
featured: false
---

## 安装命令
### 安装clickhouse
```shell
yum install -y yum-utils
yum-config-manager --add-repo https://packages.clickhouse.com/rpm/clickhouse.repo
yum install -y clickhouse-server clickhouse-client
chmod a+x /etc/clickhouse-server/*
```
等待安装完成后修改```/etc/clickhouse-server/config.xml```文件，把listen_host标签~取消注释~
```xml
    <listen_host>::1</listen_host>
    <listen_host>127.0.0.1</listen_host>
```
如果需要添加密码的话修改```/etc/clickhouse-server/user.xml```文件，把明文密码加到password标签中即可。
或者使用SHA256加密后的密码，请将其放置在 password_sha256_hex 配置段
```shell
#shell生成加密密码的示例
  PASSWORD=$(base64 < /dev/urandom | head -c8); echo "$PASSWORD"; echo -n "$PASSWORD" | sha256sum | tr -d '-'
```
最后启动clickhouse-server.service
```systemctl start clickhouse-server.service```

启动后可以```lsof -i:8123``` 查看端口是否有，```systemctl status clickhouse-server.service```服务是否正常启动

没问题后执行```clickhouse-client```后即可登陆clickhouse。

### 安装cloki
```shell
yum install npm
npm install nodejs
npm install -g cloki pm2
```

安装完成后启动,记得把yourpassword修改下
```shell
cd $(dirname $(readlink -f `which cloki`)) \
  && CLICKHOUSE_SERVER="localhost" CLICKHOUSE_AUTH="default:yourpassword" CLICKHOUSE_DB="cloki" \
  pm2 start cloki --name "cloki"
```

查看状态
```shell
pm2 status cloki
pm2 save
pm2 startup
```

>参考：[官方GITHUB](https://github.com/metrico/qryn/wiki/Installation-&-Usage)