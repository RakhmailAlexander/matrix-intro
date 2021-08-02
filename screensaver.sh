#!/usr/bin/env bash

if [[ -x "$(command -v chromium-browser)" ]]; then
  BROWSER=chromium-browser
elif [[ -x "$(command -v google-chrome)" ]]; then
  BROWSER=google-chrome
else
  echo "Can't find a valid browser. Please install chromium based browser first."
  exit 1
fi

${BROWSER} --start-fullscreen index.html