---
layout: '../../layouts/MarkdownPost.astro'
title: 'cloki分布式查询和clickhouse副本存储'
pubDate: 2023-09-04
description: 'cloki和clickhouse的一些坑'
author: 'ike'
cover:
    url: 'https://img.ikeno.top/2023/IMG_6614.PNG.JPG'
    square: 'https://img.ikeno.top/2023/IMG_6614.PNG.JPG'
    alt: 'cover'
tags: ["技术", "运维", "clickhouse", "cloki"]
theme: 'light'
featured: false
---
## 相关开源工具

* [clickhouse](https://github.com/ClickHouse/ClickHouse) 【文档：https://clickhouse.com/docs/zh】  
* [cloki](https://github.com/metrico/qryn)  【文档：https://qryn.metrico.in/#/installation】  

## cloki
记录一些部署cloki分布式遇到的一些坑吧，cloki因为开源的，但是活跃度不高，所以蛮多坑的。
* ~~默认表不支持分布式~~  **最新的版本已经支持分布式表，只需要加CLUSTER_NAME的环境变量即可自动创建分布式表**
* 下面的sql仅供参考，也可以自动创建完成后```show create table your_table_name```来查看创建表语句然后自己修改替换。

```sql
// NOTE: You also need to set "distributed_product_mode" to "global" in your profile.
// https://clickhouse.com/docs/en/operations/settings/settings-profiles/

CREATE TABLE cloki.samples_read on cluster ck_cluster(
    `fingerprint` UInt64, 
    `timestamp_ms` Int64, 
    `value` Float64, 
    `string` String
)
ENGINE = Merge('cloki', '^(samples|samples_v2)$');

////

CREATE VIEW cloki.samples_read_v2_1 on cluster ck_cluster(
    `fingerprint` UInt64, 
    `timestamp_ns` Int64, 
    `value` Float64, 
    `string` String
) AS SELECT fingerprint, timestamp_ms * 1000000 AS timestamp_ns, value, string FROM cloki.samples_read;

////

CREATE TABLE cloki.samples_read_v2_2 on cluster ck_cluster(
    `fingerprint` UInt64, 
    `timestamp_ns` Int64, 
    `value` Float64, 
    `string` String
)
ENGINE = Merge('cloki', '^(samples_read_v2_1|samples_v3)$');

////

CREATE TABLE cloki.samples_v3_ on cluster ck_cluster(
    `fingerprint` UInt64, 
    `timestamp_ns` Int64 CODEC(DoubleDelta), 
    `value` Float64 CODEC(Gorilla), 
    `string` String
)
ENGINE = ReplicatedMergeTree('/clickhouse/ck_cluster/tables/{shard}/{uuid}', '{replica}') 
PARTITION BY toStartOfDay(toDateTime(timestamp_ns / 1000000000)) 
ORDER BY timestamp_ns TTL toDateTime(timestamp_ns / 1000000000) + toIntervalDay(3650) 
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1, merge_with_ttl_timeout = 3600;

CREATE TABLE cloki.samples_v3 on cluster ck_cluster(
    `fingerprint` UInt64, 
    `timestamp_ns` Int64 CODEC(DoubleDelta), 
    `value` Float64 CODEC(Gorilla), 
    `string` String
)
ENGINE = Distributed('ck_cluster', 'cloki', 'samples_v3_', fingerprint);

////

CREATE TABLE cloki.settings_ on cluster ck_cluster(
    `fingerprint` UInt64, 
    `type` String, 
    `name` String, 
    `value` String, 
    `inserted_at` DateTime64(9, 'UTC')
)
ENGINE = ReplicatedReplacingMergeTree('/clickhouse/ck_cluster/tables/{shard}/{uuid}', '{replica}', inserted_at) 
ORDER BY fingerprint 
SETTINGS index_granularity = 8192;

CREATE TABLE cloki.settings on cluster ck_cluster(
    `fingerprint` UInt64, 
    `type` String, 
    `name` String, 
    `value` String, 
    `inserted_at` DateTime64(9, 'UTC')
)
ENGINE = Distributed('ck_cluster', 'cloki', 'settings_', fingerprint);

////

CREATE TABLE cloki.time_series_ on cluster ck_cluster(
    `date` Date, 
    `fingerprint` UInt64, 
    `labels` String, 
    `name` String
)
ENGINE = ReplicatedReplacingMergeTree('/clickhouse/ck_cluster/tables/{shard}/{uuid}', '{replica}', date) 
PARTITION BY date 
ORDER BY fingerprint TTL date + toIntervalDay(3650) 
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1, merge_with_ttl_timeout = 3600;

CREATE TABLE cloki.time_series on cluster ck_cluster(
    `date` Date, 
    `fingerprint` UInt64, 
    `labels` String, 
    `name` String
)
ENGINE = Distributed('ck_cluster', 'cloki', 'time_series_', fingerprint);

////

CREATE TABLE cloki.time_series_gin_ on cluster ck_cluster(
    `date` Date, 
    `key` String, 
    `val` String, 
    `fingerprint` UInt64
)
ENGINE = ReplicatedReplacingMergeTree('/clickhouse/ck_cluster/tables/{shard}/{uuid}', '{replica}') 
PARTITION BY date 
ORDER BY (key, val, fingerprint) TTL date + toIntervalDay(3650) 
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1, merge_with_ttl_timeout = 3600;

CREATE TABLE cloki.time_series_gin on cluster ck_cluster(
    `date` Date, 
    `key` String, 
    `val` String, 
    `fingerprint` UInt64
)
ENGINE = Distributed('ck_cluster', 'cloki', 'time_series_gin_', fingerprint);

////

CREATE MATERIALIZED VIEW cloki.time_series_gin_view TO cloki.time_series_gin (
    `date` Date, 
    `key` String, 
    `val` String, 
    `fingerprint` UInt64
) AS SELECT date, pairs.1 AS key, pairs.2 AS val, fingerprint FROM cloki.time_series ARRAY JOIN JSONExtractKeysAndValues(time_series.labels, 'String') AS pairs;

////

CREATE TABLE cloki.ver_ on cluster ck_cluster(
    `k` UInt64, 
    `ver` UInt64
)
ENGINE = ReplicatedReplacingMergeTree('/clickhouse/ck_cluster/tables/{shard}/{uuid}', '{replica}', ver) 
ORDER BY k 
SETTINGS index_granularity = 8192;

CREATE TABLE cloki.ver on cluster ck_cluster(
    `k` UInt64, 
    `ver` UInt64
)
ENGINE = Distributed('ck_cluster', 'cloki', 'ver_', k);

////设置下日志默认保存时间，当前是7天

INSERT INTO cloki.settings (`fingerprint`, `type`, `name`, `value`, `inserted_at`) 
VALUES (990984054, 'rotate', 'v3_samples_days', '7', NOW())
, (4103757074, 'rotate', 'v3_time_series_days', '7', NOW())
, (cityHash64('update_v3_5'), 'update',
     'v3_1', toString(toUnixTimestamp(NOW())), NOW());

////

INSERT INTO cloki.ver (`k`, `ver`) 
VALUES (1, 10);
```

**然后记得设置clickhouse的distributed_product_mode配置，可以添加到users.xml里**
```xml
<profiles>
...
        <default>
            ...
            <distributed_product_mode>global</distributed_product_mode>
            ...
        </default>
...
</profiles>

```
**最后重启clickhouse后检查下是否设置成功了**
```select * from system.settings where name like '%product%'```


## clickhouse
clickhouse 的分布式查询和副本配置也是需要注意

- ReplicatedMergeTree：
ReplicatedMergeTree是ClickHouse中的一种表引擎，用于在多个节点上复制和分布数据，以提供数据冗余和故障恢复能力。它使用了分片和复制的概念，并将数据按照主键范围分布在不同的节点上。

ReplicatedMergeTree使用MergeTree的存储和索引结构，该结构适合于大规模数据的插入和查询操作。数据按照主键进行排序，并且以数据块（block）的形式存储。每个数据块可以在多个副本节点上进行复制，以提供冗余和容错能力。

当数据写入ReplicatedMergeTree表时，数据会被分成多个数据块，并按照主键的顺序插入到合适的位置。数据块的数量和大小可以通过配置进行调整，以满足特定的需求。数据块在节点之间进行复制，以确保数据的冗余存储。

ReplicatedMergeTree表还提供了数据合并和清理机制。ClickHouse会周期性地合并数据块，以减少存储空间的使用和提高查询性能。同时，它还支持数据的分区和副本的自动管理。

- Distributed：
Distributed是ClickHouse中的另一种表引擎，用于将查询分发到多个节点上进行并行处理。它提供了分布式查询的能力，可以加速大规模数据查询操作。

Distributed表引擎通过逻辑上的表映射和查询分发来实现分布式查询。在创建Distributed表时，需要指定一个或多个表作为底层数据源。当执行查询时，ClickHouse会将查询解析为子查询，并将其分发到底层数据源上进行并行处理。最后，查询结果会被汇总到一个结果集中返回给用户。

Distributed表引擎隐藏了分布式查询的复杂性，并提供了透明的接口。用户可以像查询单个表一样查询Distributed表，而不需要关心底层数据的分布和位置。

配置需要注意分片配置和副本配置以及宏配置