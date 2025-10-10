#!/usr/bin/env bash
#zip -f -r ../time-compass.xpi . -x ".git/*" -x "./bin/*"
zip -f -r ../time-compass.xpi . -x ".git/*" -x "./bin/*"
unzip -l ../time-compass.xpi
