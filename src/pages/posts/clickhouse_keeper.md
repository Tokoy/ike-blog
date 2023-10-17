---
layout: '../../layouts/MarkdownPost.astro'
title: '如何从zookeeper切换为clickhouse—keeper'
pubDate: 2023-10-17
description: '用clickhouse—keeper来搭建clickhouse集群'
author: 'ike'
cover:
    url: '\static\images\IMG_6567.PNG.JPG'
    square: '\static\images\IMG_6567.PNG.JPG'
    alt: 'cover'
tags: ["技术", "运维", "clickhouse", "zookeeper"]
theme: 'light'
featured: false
---

## 简介
&ensp;&ensp;&ensp;&ensp;clickhouse-keeper和zookeeper的功能类似，都能实现数据复制和分布式DDL查询，但也有不同之处，clickhouse分布式表使用zookeeper作为元数据的存储，客户端每次读写分布式表都会读写zookeeper，zookeeper是个小型的日志文件系统，在大范围读写时会进入只读模式。
&ensp;&ensp;&ensp;&ensp;clickhouse官方为了解决这个问题，自己开发了clickhouse-keeper来代替。clickhouse-keeper用C++语言编写，在Clickhouse的21.8版本开始引入，目前22.5版的写性能和zookeeper相当，读的性能比zookeeper好，最新版本已经读写性能都超过zookeeper，更加适配大量数据的Clickhouse集群。

## 对比
**zookeeper：**
* 使用java开发
* 运维不便
* 要求独立部署
* zxid overflow问题
* snapshot和log没有经过压缩
* 不支持读的线性一致性
  
**keeper：**
* 使用c++开发，技术栈与ck统一
* 即可独立部署，又可集成到ck中
* 没有zxid overflow问题
* 读写性能更好
* 支持对snapshot和log的压缩和校验
* 支持读写的线性一致性

## 部署
因为当前Clickhouse集群是用zookeeper作为数据复制和分布式查询的，切换为Clickhouse-keeper需要保留现有的数据，所以需要进行数据迁移，官方提供了相关的方法：
1、准备 clickhouse-keeper的配置文件 (config.xml)
```xml
<keeper_server>
      <tcp_port>2181</tcp_port>
      <server_id>1</server_id>
      <log_storage_path>/var/lib/clickhouse/coordination/log</log_storage_path>
      <snapshot_storage_path>/var/lib/clickhouse/coordination/snapshots</snapshot_storage_path>

    <coordination_settings>
        <operation_timeout_ms>10000</operation_timeout_ms>
        <session_timeout_ms>30000</session_timeout_ms>
        <raft_logs_level>warning</raft_logs_level>
    </coordination_settings>

    <raft_configuration>
        <server>
            <id>1</id>
            <hostname>10.0.0.1</hostname>
            <port>9234</port>
        </server>
        <server>
            <id>2</id>
            <hostname>10.0.0.2</hostname>
            <port>9234</port>
        </server>
        <server>
            <id>3</id>
            <hostname>10.0.0.3</hostname>
            <port>9234</port>
        </server>
    </raft_configuration>
</keeper_server>
```
2、停止所有zk节点
3、重启zk leader节点，并再次停止(这一步是为了让leader节点生成一份snapshot)
4、运行clickhouse-keeper-converter，生成keeper的snapshot文件
5、启动keeper, 使其加载上一步中的snapshot
6、重启clickhouse-server

## 参考
[官方文档ZH](https://clickhouse.com/docs/zh/operations/clickhouse-keeper)
[官方文档EN](https://clickhouse.com/docs/en/guides/sre/keeper/clickhouse-keeper)