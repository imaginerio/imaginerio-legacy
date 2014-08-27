for f in SSID*
do
   gdal_translate $f ../$f  -ot Byte -co PHOTOMETRIC=RGB -co TILED=YES -co COMPRESS=LZW -co BLOCKXSIZE=128 -co BLOCKYSIZE=128
done

