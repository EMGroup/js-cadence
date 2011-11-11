#!/bin/sh

g++ -o service.bin service.cpp tinystr.cpp tinyxml.cpp tinyxmlerror.cpp tinyxmlparser.cpp protocol.cpp graphdb.cpp client.cpp observerdb.cpp -ldb
cp ./service.bin ../
chmod a+rx ../service.bin
