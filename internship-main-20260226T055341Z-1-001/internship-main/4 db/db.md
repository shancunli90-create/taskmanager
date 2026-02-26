## DB (PostgreSQL) 構築手順（Docker + Compose）

### 1. 作業ディレクトリに移動

```
cd /opt
```

### 2. DB用ディレクトリ作成

```
mkdir -p docker/postgres
cd docker/postgres
```

-p オプションで親ディレクトリも自動作成

### 3. Dockerfile 作成

```
touch Dockerfile
vim Dockerfile
```

Dockerfile の内容

```
FROM postgres:18

# 日本語ロケール & ビルドツール
RUN apt-get update && \
    apt-get install -y locales git build-essential postgresql-server-dev-18 wget ca-certificates && \
    localedef -i ja_JP -c -f UTF-8 -A /usr/share/locale/locale.alias ja_JP.UTF-8 && \
    rm -rf /var/lib/apt/lists/*

ENV LANG ja_JP.utf8
ENV LANGUAGE=ja_JP:ja
ENV LC_ALL=ja_JP.UTF-8
```

i で入力モードに入り、コピー＆ペースト  
esc → :wq で保存

### 4. Docker Compose ファイル作成

```
touch compose.yml
vim compose.yml
```

compose.yml の内容

```
version: '3'

services:
  postgres:
    build: .
    container_name: postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: example
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password123
    ports:
      - 5432:5432
    networks:
      - devill.local
    volumes:
      - postgres_data18:/var/lib/postgresql


  pgadmin:
    image: dpage/pgadmin4
    container_name: pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@supportas.co.jp
      PGADMIN_DEFAULT_PASSWORD: password123
    ports:
      - 50000:80
    networks:
      - devill.local
    volumes:
      - pgadmin4_data:/var/lib/pgadmin

volumes:
  postgres_data18:
    driver: local
  pgadmin4_data:
    driver: local

networks:
  devill.local:
    external: true
```

### 5. コンテナ間通信用のネットワークの作成

以下のコマンドを実行する。

```
docker network create devill.local
```

### 6. Docker Compose で起動

```
docker-compose up -d
```

-d → バックグラウンドで起動

postgres と pgadmin が同時に立ち上がります

### 7. 確認

```
docker ps
```

postgres と pgadmin が起動していることを確認

pgAdmin は http://localhost:50000 でアクセス可能

### ✅ ポイント

Dockerfile で日本語ロケールを設定

Docker Compose で PostgreSQL と pgAdmin を一括管理

データはボリュームに永続化

ネットワークは devill.local を使用
