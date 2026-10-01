#!/usr/bin/env python3
"""Generate an 'A' (Adesh) monogram logo PNG — pure Python, no image libraries."""
import struct, zlib, sys

def png(width, height, buf):
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    raw = bytearray()
    row = width * 4
    for y in range(height):
        raw.append(0); raw += buf[y*row:(y+1)*row]
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b""))

def make(size):
    w = h = size
    buf = bytearray(w*h*4)
    s = size/512.0
    radius = size*0.22
    def put(x, y, col):
        x = int(x); y = int(y)
        if 0 <= x < w and 0 <= y < h:
            i = (y*w+x)*4
            buf[i], buf[i+1], buf[i+2], buf[i+3] = col[0], col[1], col[2], 255
    # rounded-square diagonal gradient (blue -> purple -> pink)
    for y in range(h):
        for x in range(w):
            cx = min(x, w-1-x); cy = min(y, h-1-y)
            if cx < radius and cy < radius:
                dx = radius-cx; dy = radius-cy
                if dx*dx+dy*dy > radius*radius:
                    continue
            t = (x + y) / (w + h - 2)   # diagonal 0..1
            if t < 0.5:
                u = t/0.5; r = int(0+(88-0)*u); g = int(122+(86-122)*u); b = int(255+(214-255)*u)
            else:
                u = (t-0.5)/0.5; r = int(88+(255-88)*u); g = int(86+(45-86)*u); b = int(214+(146-214)*u)
            i = (y*w+x)*4
            buf[i], buf[i+1], buf[i+2], buf[i+3] = r, g, b, 255
    white = (255, 255, 255)
    apex = (256*s, 120*s); bl = (150*s, 404*s); br = (362*s, 404*s)
    hw = 27*s
    # two diagonal strokes
    for y in range(int(apex[1]), int(bl[1])):
        tt = (y-apex[1])/(bl[1]-apex[1])
        lx = apex[0] + (bl[0]-apex[0])*tt
        rx = apex[0] + (br[0]-apex[0])*tt
        for x in range(int(lx-hw), int(lx+hw)): put(x, y, white)
        for x in range(int(rx-hw), int(rx+hw)): put(x, y, white)
    # crossbar
    cby = 322*s
    for y in range(int(cby-16*s), int(cby+16*s)):
        tt = (y-apex[1])/(bl[1]-apex[1])
        lx = apex[0] + (bl[0]-apex[0])*tt + hw
        rx = apex[0] + (br[0]-apex[0])*tt - hw
        for x in range(int(lx), int(rx)): put(x, y, white)
    return png(w, h, buf)

open(sys.argv[1], "wb").write(make(512))
print("wrote", sys.argv[1])
