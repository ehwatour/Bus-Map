@echo off
chcp 65001 > nul

echo ===========================
echo GeoJSON - 변환 시작
echo ===========================

set "ROUTE=노선.geojson"
set "STOP=정류장.geojson"
set "END_STOP=양끝 정류장.geojson"
set "BASE_STOP=배경 정류장.geojson"
set "OUTPUT=RouteAndStop.js"

(
echo var routeGeojson =
type "%ROUTE%"
echo ;
echo.
echo var stopGeojson =
type "%STOP%"
echo ;
echo.
echo var endStopGeojson =
type "%END_STOP%"
echo ;
echo.
echo var baseStopGeojson =
type "%BASE_STOP%"
echo ;
) > "%OUTPUT%"

echo.
echo 변환 완료:
echo %OUTPUT%

pause