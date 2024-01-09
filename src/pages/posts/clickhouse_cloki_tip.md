---
layout: '../../layouts/MarkdownPost.astro'
title: 'clickhouse的一些优化建议和工具'
pubDate: 2024-01-09
description: 'clickhouse踩坑'
author: 'ike'
cover:
    url: 'https://image.gcores.com/97e2d1c8c7ee66743c0ebb72bcc1580c-1410-784.png'
    square: 'https://image.gcores.com/97e2d1c8c7ee66743c0ebb72bcc1580c-1410-784.png'
    alt: 'cover'
tags: ["技术", "运维", "clickhouse", "cloki"]
theme: 'light'
featured: false
---

## 起因
自从用cloki+clickhouse来替代日志系统后真是一波三折，问题不断Orz。
只能感叹不亏是小众的开源工具，还是一堆坑，下面记一下踩到的一些坑和对clickhouse的优化。

* **Q**：主查询最后的查询会进行全表查询，但是left join的time_series_dist表巨大，有几百G，几十亿条数据，导致每次查询都得全部读取到内存里，一次查询占用80G内存，查询5分钟还查不出结果！
```sql
# 查询语句
WITH sel_a AS
    (
        SELECT
            samples.string AS string,
            samples.fingerprint AS fingerprint,
            samples.timestamp_ns AS timestamp_ns
        FROM cloki.samples_v3_dist AS samples
        WHERE ((samples.timestamp_ns >= 1704440225031000000) AND (samples.timestamp_ns <= 1704440525031000000)) AND (samples.fingerprint IN (
            SELECT sel_1.fingerprint
            FROM
            (
                SELECT fingerprint
                FROM cloki.time_series_gin
                WHERE (key = 'app') AND (val = 'myapp')
            ) AS sel_1
            ANY INNER JOIN
            (
                SELECT fingerprint
                FROM cloki.time_series_gin
                WHERE (key = 'cluster') AND (val = 'test-prod')
            ) AS sel_2 ON sel_1.fingerprint = sel_2.fingerprint
        ))
        ORDER BY timestamp_ns DESC
        LIMIT 100
    )
SELECT
    JSONExtractKeysAndValues(time_series.labels, 'String') AS labels,
    sel_a.*
FROM sel_a
ANY LEFT JOIN cloki.time_series_dist AS time_series ON sel_a.fingerprint = time_series.fingerprint
ORDER BY
    labels DESC,
    timestamp_ns DESC
```
* **A**: 估计是开源cloki根据的bug，而且和orderby也有区别，调查了蛮多优化建议，其中比较有用的是
1. 让表的orderby和查询的orderby一致，这样可以减少最后排序时间，所以我把ORDER BY fingerprint改成ORDER BY (fingerprint, labels)。
2. left join后的表尽量要是小表，不过这里是固定了所以没法优化，所以只能减少表的大小，还好这个表只是存储标签，把TTL（生命周期）改成1天后就好多了。
3. 网上还有说让经常查询的key作为主键分区，相当于做了索引，也可以加快查询速度和效率，所以我PARTITION BY date改成了PARTITION BY fingerprint，但其实是有问题的！
   因为PARTITION BY是分区，如果是date的话，一天一个分区，这样查询如果是跨天查询就很快，如果改成fingerprint会变成每一个数据一个分区！CK集群直接报错Too many parts (100018) in all partitions in total，分区中存在过多的数据分片了，赶紧删了重新改回来了date，没有完全懂的东西还是不要乱动的好。当然可以把分区时间改成半天，也有一定的效果。
   ```sql
    CREATE TABLE cloki.time_series
    (
        `date` Date,
        `fingerprint` UInt64,
        `labels` String,
        `name` String,
      INDEX idx_fingerprint_labels (fingerprint) TYPE minmax GRANULARITY 8192
    )
    ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/time_series/{shard}', '{replica}', date)
    PARTITION BY date
    ORDER BY (fingerprint, labels)
    TTL date + toIntervalDay(1)
    SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1, merge_with_ttl_timeout = 3600
   ```
* **R**：查询问题解决后，基本上每次查询都可以在10s内完成，而且内存也不需要太大了，clickhouse里也有一些users.xml的default标签参数可以优化查询啥的，例如  
**max_threads** 这个值不要太高，一般是默认就好了，并不是说线程越高越好，越高内存占用也越大  
**distributed_product_mode**  ReplicatedReplacingMergeTree+Distributed的分布式表一定要弄为global，如果只是MergeTree+Distributed可以local  
**group_by_overflow_mode**  默认是查询失败就throw丢弃，也可以改成查询超出内存后返回部分结果，一般不需要改  
**max_memory_usage** 单个查询最大多少内存，默认是10g，当然也可以改大，我是改成90%的内存大小  
**max_bytes_before_external_group_by** groupby超了多少内存后就写入到磁盘里，防止内存占用过多，虽然会影响效率，一般是改成max_memory_usage的一半  
**max_bytes_before_external_sort** orderby超了多少内存后就写入到磁盘里，防止内存占用过多，虽然会影响效率，一般是改成max_memory_usage的一半  
  
---------
  
* **Q**：clickhouse其实更适合一次性插入几百万的数据，而不是短时间内大量一条一条的数据插入，就好像现在cloki每一条日志都是一个insert请求，导致大量的单条插入给到clickhouse，然后ck集群的同步会扛不住，会报错merge速度比不上insert速度，然后zookeeper或clickhouse-keeper的负载非常高，触发表readonly的保护机制，只要没merge完就不给写入，因为没有缓存的中间件，一堆日志写入失败丢失。
  
* **A**：说白了就是clickhouse的使用方法不对，如果是数据量不大还好，官方说只要超过500k每秒的插入，基本上就会导致同步不过来表readonly无法写入。所以网上有一些解决方法：
1. 用buffer表来做缓冲，```Buffer(database, table, num_layers, min_time, max_time, min_rows, max_rows, min_bytes, max_bytes [,flush_time [,flush_rows [,flush_bytes]]])```， 用下面的例子里的参数解释就是，如果满足最大max的100s或者100w行或者100m的数据其中一个条件，就触发缓存写入到目标表，又或者同时满足所有min的条件过了10s且1w行且10m的数据就会触发写入数据到目标表。不过这个方法官方也说了其实不怎么适用，因为本身clickhouse还是不适合用于短时间大量单条数据的插入，更适合单条插入大量数据的场景，官方建议是每秒不超过1条插入语句。  
  ```sql
    CREATE TABLE cloki.samples_v3_buffer
  (
      `fingerprint` UInt64,
      `timestamp_ns` Int64 CODEC(DoubleDelta),
      `value` Float64 CODEC(Gorilla),
      `string` String CODEC(ZSTD(5))
  )
  ENGINE = Buffer('cloki', 'samples_v3', 16, 10, 100, 10000, 1000000, 10000000, 100000000)
  ```
2. buffer表不管用，那就只能想想其他办法，还好这个问题也有解决，(clickhouse-bulk)[https://github.com/nikepan/clickhouse-bulk]是第三方的开源小工具，主要目的就是把小插入变成大插入，只需要设置好配置文件nohup ./clickhouse-bulk -config config.json >/dev/null 2>&1 &启动即可，所有的小插入会先缓存然后满足配置条件后写入到clickhouse集群里，而且写入失败会生成dump文件，重新尝试插入，相当于缓存了。  
```yaml
    {
    "listen": ":8124",   #启动的端口，clickhouse是8123 ，这个是8124，小心别漏了分号
    "flush_count": 1000000,  #缓存多少行后写入，我这边指定的是100w行写入一次
    "flush_interval": 5000,  #缓存多少秒后写入，我这边指定5秒后写入
    "clean_interval": 0,     #清理内部表的频率，例如插入到不同的临时表，或作为解决query_id等问题的方法，单位：毫秒
    "remove_query_id": true,  #有些驱动程序发送的query_id会阻止批量插入
    "dump_check_interval": 60, #尝试发送转储文件的间隔（秒）；-1表示禁用，就是重新尝试插入dump文件的时间
    "debug": false,  # 记录传入的请求日志
    "log_queries": true, 
    "dump_dir": "dumps",   # 转储未发送的数据的目录（如果ClickHouse出错）
    "clickhouse": {
      "down_timeout": 60,  # 服务器宕机时等待的时间（秒）
      "connect_timeout": 10,  # 等待服务器连接的时间（秒）
      "tls_server_name": "", # 覆盖用于证书验证的TLS serverName（例如，如果在多个节点上共享相同的"cluster"证书）
      "insecure_tls_skip_verify": false, # 证书验证
      "servers": [
        "http://127.0.0.1:8123"
      ]
    },
    "use_tls": false,
    "tls_cert_file": "",
    "tls_key_file": ""
  }
```

# 最后  
到目前为止大部分问题解决了，虽然还有一些小问题，但日志系统也慢慢趋于稳定，clickhouse数据库号称比传统mysql数据库快一万倍，但坑还是蛮多的，目前国内用的其实不多，但以后估计会变成香饽饽吧。  