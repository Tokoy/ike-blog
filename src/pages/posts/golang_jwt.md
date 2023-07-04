---
layout: '../../layouts/MarkdownPost.astro'
title: '如何使用go的jwt'
pubDate: 2023-07-04
description: '在golang语言中是如何使用jwt的吧'
author: 'ike'
cover:
    url: '\static\images\IMG_4933.JPG'
    square: '\static\images\IMG_4933.JPG'
    alt: 'cover'
tags: ["技术", "golang", "jwt","编程"]
theme: 'light'
featured: false
---

## 什么是jwt
JWT 是一种轻量级的身份认证和授权机制，它可以在不同的系统之间安全地传递信息，JWT 的信息是以 JSON 格式存储在 Token 中，包含三部分：头部（header）、载荷（payload）和签名（signature）。其中，载荷部分包含了一些声明信息，比如 Token 的有效期、Token 的颁发者、Token 的使用者等。

## jwt bearer和bearer token的区别
Bearer是HTTP授权标头的一种类型，用于指示在HTTP请求中使用OAuth 2.0访问令牌进行身份验证。

JWT Bearer是使用JSON Web Token（JWT）进行身份验证的一种方式，它将JWT作为Bearer令牌的值发送到服务器。

Bearer Token则是OAuth 2.0协议中使用的一种访问令牌类型，它表示访问令牌的类型是Bearer。Bearer Token是一种无状态的令牌，它通常具有一定的有效期，在有效期内可以使用该令牌进行身份验证和授权。Bearer Token可以使用各种技术实现，如JWT、OAuth 2.0、OpenID Connect等。

这里我们用的就是Bearer Token

## 安装jwt包
```shell
go get github.com/dgrijalva/jwt-go
```
一般jwt是配合go gin一起使用的

## 如何使用jwt
```go

import (
	"time"

	"github.com/dgrijalva/jwt-go"
)


type TokenInterface interface {
	GenerateToken(id int, accountName string) (string, error)
	ParseToken(token string) (*Claims, error)
}

type Token struct {
	JwtSecret  string // 加密秘钥
	ExpireTime int    // 多少小时过期
}

func NewToken(f ...func(token *Token)) TokenInterface {
	t := &Token{}
	for _, i := range f {
		i(t)
	}
	// 未赋值则初始化
	if t.ExpireTime == 0 {
		t.ExpireTime = 24
	}
	if t.JwtSecret == "" {
		t.JwtSecret = "JwtSecret"
	}
	return t
}

type Claims struct {
	UserID      int    `json:"user_id"`
	AccountName string `json:"account_name"`
	jwt.StandardClaims
}

// GenerateToken 生成Token
func (t *Token) GenerateToken(id int, accountName string) (string, error) {
	nowTime := time.Now()
	expireTime := nowTime.Add(time.Duration(t.ExpireTime) * time.Hour)

	claims := Claims{
		UserID:      id,
		AccountName: accountName,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(TokenExpireDuration).Unix(),
			Issuer:    "my-project",
		},
	}

	tokenClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	token, err := tokenClaims.SignedString([]byte(t.JwtSecret))

	return token, err
}

// ParseToken 解析Token
func (t *Token) ParseToken(token string) (*Claims, error) {
	tokenClaims, err := jwt.ParseWithClaims(token, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(t.JwtSecret), nil
	})

	if tokenClaims != nil {
		if claims, ok := tokenClaims.Claims.(*Claims); ok && tokenClaims.Valid {
			return claims, nil
		}
	}
	return nil, err
}
```

```golang
func ValidatorQueryInfo(ctx *gin.Context) {

	authHeader := ctx.Request.Header.Get("Authorization")
	if authHeader == "" {
		err = errors.New("请求头中的auth为空")
		return
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if !(len(parts) == 2 && parts[0] == "Bearer") {
		err = errors.New("请请求头中的auth格式错误")
		return
	}
	t := jwt.NewToken()
	claims, err := t.ParseToken(parts[1])
	if err != nil {
		err = errors.New("无效的token")
		return
	}
	log.DefaultLogs.Log.Error("jwt解析正常", claims)
	return
}

```