## WSLとは

- WSL（Windows Subsystem for Linux）とは、
  Windows上でLinux環境を動作させる仕組みです。
- 仮想マシンを別途構築することなく、
  Windows内でLinuxコマンドや開発ツールを利用できます。

## 本プロジェクトでの開発環境構成

本プロジェクトでは以下の構成で開発を行っています。

- プロジェクトファイルは WSL（Linux環境）上に配置
- エディタは Visual Studio Code（Windows側）を使用
- VS Codeの Remote - WSL拡張機能 を利用してWSLに接続

つまり、
実行環境はLinux（WSL）
操作画面はWindowsのVS Codeという構成になっています。

## なぜこの構成を採用しているか

1. 本番環境がLinuxであるため
   - WebサーバーはLinux環境で動作しているため、開発環境もLinuxに揃えることで環境差異による不具合を防止できます。

1. パフォーマンスと安定性のため
   - Node.js や npm、Docker などのツールはLinux環境のほうが安定して動作します。
   - Windows直下にプロジェクトを置くよりも、WSL内に配置するほうがファイルアクセス速度も安定します。

1. 改行コード・パス問題の回避
   - WindowsとLinuxでは以下が異なります：

     改行コード（CRLF / LF）

     パス区切り文字（\ /）

WSLを使用することで、
Linux基準で統一でき、トラブルを防げます。

## wslの起動

① WSLを起動する

```
wsl
```

② 正常に起動すると

以下のように表示されます：

```
username@PC名:~$
```

③ 終了する場合

```
exit
```
