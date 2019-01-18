#!/bin/sh
now=$(date +"%y-%m-%d")
ssh maroggo@v22015123209630421.goodsrv.de "docker exec mongodb mongodump -d rezepte --archive --gzip" > "backups/$now.gz"
