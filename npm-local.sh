#!/bin/bash
export PATH=$(pwd)/.node/bin:$PATH
npm "$@" --cache ./npm-cache --no-audit
