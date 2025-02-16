#!/bin/bash

FONT_FAMILY="BitstromWera Nerd Font"
THEME="asciinema"
FONT_SIZE=120
SPEED=2

agg --font-family "$FONT_FAMILY" --theme $THEME --font-size $FONT_SIZE --speed $SPEED demo1.cast demo1.gif
agg --font-family "$FONT_FAMILY" --theme $THEME --font-size $FONT_SIZE --speed $SPEED demo2.cast demo2.gif
