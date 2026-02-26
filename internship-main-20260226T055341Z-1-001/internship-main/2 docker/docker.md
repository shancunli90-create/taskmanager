## Dockerとは

- Dockerとは、アプリケーションをコンテナという単位で実行する仕組みです。
- 開発環境と本番環境を同一構成で再現できます。
- OSやライブラリの差異を吸収し、環境依存の問題を防ぐことができます。

## なぜDockerを使用しているか

### 1. 開発環境を統一できるため

チーム全員が同じコンテナ環境を使用することで、
「自分のPCでは動くが他の環境では動かない」といった問題を防止できます。

### 2. 本番環境との差異をなくすため

本番環境もLinux上で動作しているため、
Dockerを使用することで同一構成を再現できます。

### 3. 環境構築を簡略化するため

必要なミドルウェア（Node.js、データベース等）を
個別にインストールする必要がありません。

## Docker のインストール（WSL内に直接インストール）

本プロジェクトでは、WSL内に Docker Engine を直接インストールします。

1. 既存パッケージの更新

```bash
sudo apt update
sudo apt upgrade -y
```

2. 必要なパッケージのインストール

```
sudo apt install -y \
  ca-certificates \
  curl \
  gnupg
```

3. Docker公式GPGキーの追加

```
sudo install -m 0755 -d /etc/apt/keyrings
```

```
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

```
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

4. Dockerリポジトリの追加

```
echo \
  "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

5. Docker Engine のインストール

```
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

6. sudoなしで実行できるように設定

```
sudo usermod -aG docker $USER
```

一度ログアウトして再ログイン、または以下を実行：

```
newgrp docker
```

7. インストール確認

```
docker --version
docker compose version
```

## Dockerの基本操作

### コンテナの起動

```
docker compose up -d
```

### コンテナの停止

```
docker compose down
```

### ログの確認

```
docker compose logs
```
