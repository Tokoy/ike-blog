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

## 安装
### clickhouse
```shell
yum install -y yum-utils
yum-config-manager --add-repo https://packages.clickhouse.com/rpm/clickhouse.repo
yum install -y clickhouse-server clickhouse-client
chmod a+x /etc/clickhouse-server/*
```
等待安装完成后修改```/etc/clickhouse-server/config.xml```文件，把```listen_host```标签取消注释
```xml
    <listen_host>::1</listen_host>
    <listen_host>127.0.0.1</listen_host>
```
如果需要添加密码的话修改```/etc/clickhouse-server/user.xml```文件，把明文密码加到password标签中即可,或者也可以使用SHA256加密后的密码，请将其放置在 password_sha256_hex 配置段。
```shell
#shell生成加密密码的示例
  PASSWORD=$(base64 < /dev/urandom | head -c8); echo "$PASSWORD"; echo -n "$PASSWORD" | sha256sum | tr -d '-'
```
最后启动clickhouse-server.service
```systemctl start clickhouse-server.service```

启动后可以```lsof -i:8123``` 查看端口是否有，```systemctl status clickhouse-server.service```服务是否正常启动。

没问题后执行```clickhouse-client```后即可登陆clickhouse。

### cloki
安装命令
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

## 使用
![](https://user-images.githubusercontent.com/1423657/143876342-85531041-aca5-4892-a218-e8775674867d.gif)

cloki是支持promtail、logstash、fluentd等常用的日志采集工具，这边用promtail为例。
config.yaml
```yaml
server:
  http_listen_port: 29080
  grpc_listen_port: 0

positions:
  filename: /opt/promtail/positions.yaml

clients:
  - url: http://172.0.0.100:3100/loki/api/v1/push

scrape_configs:
- job_name: test-log
  pipeline_stages:
  static_configs:
  - targets:
      - localhost
    labels:
      hostname: test
      cluster: sz-test
      app: test
      __path__: /var/log/*log
```
配置完毕后启动promtail就可以采集路径下的日志并push到loki的api并存储到clickhouse中。

登陆部署的服务器3100端口即可访问cloki的查询界面，示例：
![](https://camo.githubusercontent.com/d16076f6719ff4e69dc9114dbbf496f53749de8f2a85ff62acd7637cb871dfe4/68747470733a2f2f692e696d6775722e636f6d2f7942616246334c2e706e67)

## 参考
[官方GITHUB](https://github.com/metrico/qryn/wiki/Installation-&-Usage)