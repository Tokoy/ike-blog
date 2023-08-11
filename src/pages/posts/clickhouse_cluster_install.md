---
layout: '../../layouts/MarkdownPost.astro'
title: 'clickhouse集群部署指南'
pubDate: 2023-08-11
description: '快速安装部署clickhouse集群'
author: 'ike'
cover:
    url: '\static\images\IMG_4972.JPG'
    square: '\static\images\IMG_4972.JPG'
    alt: 'cover'
tags: ["技术", "运维", "clickhouse", "集群"]
theme: 'light'
featured: false
---
## 起因
网上找到的集群安装博文各个都是复制粘贴，还缺胳膊少腿MD，各种坑，自己梳理下搭建过程。

## 步骤
### zookeeper安装
```shell
wget https://downloads.apache.org/zookeeper/stable/apache-zookeeper-3.6.3-bin.tar.gz   #注意要下载bin.tar.gz
tar -xvf apache-zookeeper-3.6.3-bin.tar.gz  #解压到目录
cp zoo_sample.cfg zoo.cfg                   #参考下面zoo.cfg配置
mkdir -p /data/zookeeper/{data,logs}        #创建数据目录
echo "1" > /data/zookeeper/data/myid        #注意myid里的数字一定要和cfg里的server顺序一致
./zkServer.sh start                         #启动zk
```

zoo.cfg配置参考
```yaml
tickTime=2000
dataDir=/data/zookeeper/data
dataLogDir=/data/zookeeper/logs
clientPort=2181
admin.serverPort=2182
initLimit=10
syncLimit=5
server.1=zk1:2888:3888
server.2=zk2:2888:3888
server.3=zk3:2888:3888
```

### clickhouse安装
```shell
yum install -y yum-utils
yum-config-manager --add-repo https://packages.clickhouse.com/rpm/clickhouse.repo
yum install -y clickhouse-server clickhouse-client
chmod a+x /etc/clickhouse-server/*
```
#### 配置
1. 新建一个```/etc/clickhouse-server/metrika.xml```文件，添加zookeeper和集群配置
```xml
<yandex>
    <clickhouse_remote_servers>
        <!--自定义集群名称-->
        <ck_cluster>
            <!--定义集群的分片数量-->
            <shard>
                <internal_replication>true</internal_replication>
                <replica>
                    <host>ck1</host>
                    <port>9000</port>
                    <user>default</user>  <!--默认是default用户-->
                    <password>xxxxxxxxx</password> <!--你在user.xml里配置的密码-->
                </replica>
            </shard>
            <shard>
                <internal_replication>true</internal_replication>
                <replica>
                    <host>ck2</host>
                    <port>9000</port>
                    <user>default</user>
                    <password>xxxxxxxxx</password>
                </replica>
            </shard>
            <shard>
                <internal_replication>true</internal_replication>
                <replica>
                    <host>ck3</host>
                    <port>9000</port>
                    <user>default</user>
                    <password>xxxxxxxxx</password>
                </replica>
            </shard>
        </ck_cluster>
    </clickhouse_remote_servers>

    <networks>
        <ip>::</ip>
    </networks>

    <macros>
        <replica>ck1</replica>  <!--此处填写各个节点名称，唯一值，不能重复-->
    </macros>

    <zookeeper-servers>
        <node index="1">    <!--index 是你部署zookeeper的时候设置的myid-->
            <host>zk1</host>
            <port>2181</port>
        </node>
        <node index="2">
            <host>zk2</host>
            <port>2181</port>
        </node>
        <node index="3">
            <host>zk3</host>
            <port>2181</port>
        </node>
    </zookeeper-servers>


    <clickhouse_compression> <!--可加可不加-->
        <case>
            <min_part_size>10000000000</min_part_size>
            <min_part_size_ratio>0.01</min_part_size_ratio>
            <method>lz4</method>
        </case>
    </clickhouse_compression>
</yandex>
```

2. 修改```/etc/clickhouse-server/config.xml```文件，把```listen_host```标签取消注释，并新增标签启用metrika的配置
```xml
    <listen_host>::</listen_host>
    <include_from>/etc/clickhouse-server/metrika.xml</include_from>
    <macros incl="macros" optional="true"/>
    <zookeeper incl="zookeeper-servers" optional="true" />
    <remote_servers incl="clickhouse_remote_servers"/>

```

3. 如果需要添加密码的话修改```/etc/clickhouse-server/user.xml```文件，把明文密码加到password标签中即可,或者也可以使用SHA256加密后的密码，请将其放置在 password_sha256_hex 配置段。
```shell
#shell生成加密密码的示例
  PASSWORD=$(base64 < /dev/urandom | head -c8); echo "$PASSWORD"; echo -n "$PASSWORD" | sha256sum | tr -d '-'
```
最后启动clickhouse-server.service
```service clickhouse-server restart```

启动后可以```lsof -i:8123``` 查看端口是否有启动，```service clickhouse-server status```服务是否正常启动，```/var/log/clickhouse-server/clickhouse-server.err.log```相关日志是否都正常，没有报错。  
> 8123是默认客户端端口，用于接收客户端的连接和处理来自客户端的查询请求。
> 9000是默认数据端口，用于处理 ClickHouse 数据节点之间的内部通信。 

没问题后执行```clickhouse-client```后即可登陆clickhouse。

4. 登陆clickhouse后```select * from system.clusters\G;``` 看下是否节点都可以正常，如果显示正常那就搭建完毕啦！

