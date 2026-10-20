@echo off
chcp 65001 > nul

set "OUTPUT=노선지도.html"

echo ===========================
echo 노선 지도 HTML 생성 시작
echo ===========================
echo 생성 중: %OUTPUT%
echo.

(
echo(^<!DOCTYPE html^>
echo(^<html lang="ko"^>
echo(
echo(^<head^>
echo(
echo(    ^<meta charset="utf-8"^>
echo(
echo(    ^<title^>노선 지도^</title^>
echo(
echo(    ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo(
echo(
echo(    ^<!-- Leaflet CSS --^>
echo(
echo(    ^<link
echo(        rel="stylesheet"
echo(        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
echo(    ^>
echo(
echo(
echo(    ^<!-- 사용자 CSS --^>
echo(
echo(    ^<style^>
type "%~dp0style.css"
echo(    ^</style^>
echo(
echo(^</head^>
echo(
echo(^<body^>
echo(
echo(
echo(    ^<!-- 패널 열기 / 닫기 --^>
echo(
echo(    ^<button
echo(        id="panel-toggle"
echo(        type="button"
echo(        aria-label="노선 선택 패널 열기/닫기"
echo(    ^>☰^</button^>
echo(
echo(
echo(    ^<!-- 지도 --^>
echo(
echo(    ^<div id="map"^>^</div^>
echo(
echo(
echo(    ^<!-- 노선 선택 패널 --^>
echo(
echo(    ^<div id="control-panel"^>
echo(
echo(        ^<h2^>노선 선택^</h2^>
echo(
echo(
echo(        ^<div class="fixed-top"^>
echo(
echo(            ^<div class="buttons"^>
echo(
echo(                ^<button
echo(                    id="checkAll"
echo(                    type="button"
echo(                ^>전체 선택^</button^>
echo(
echo(
echo(                ^<button
echo(                    id="uncheckAll"
echo(                    type="button"
echo(                ^>전체 해제^</button^>
echo(
echo(            ^</div^>
echo(
echo(
echo(            ^<div class="search-box"^>
echo(
echo(                ^<input
echo(                    id="route-search"
echo(                    type="text"
echo(                    placeholder="노선 검색"
echo(                    autocomplete="off"
echo(                ^>
echo(
echo(
echo(                ^<button
echo(                    id="search-btn"
echo(                    type="button"
echo(                ^>검색^</button^>
echo(
echo(
echo(                ^<label
echo(                    class="search-check-label"
echo(                    title="검색된 노선 전체 선택/해제"
echo(                ^>
echo(
echo(                    ^<input
echo(                        id="search-check"
echo(                        type="checkbox"
echo(                        checked
echo(                    ^>
echo(
echo(
echo(                ^</label^>
echo(
echo(            ^</div^>
echo(
echo(
echo(            ^<hr^>
echo(
echo(        ^</div^>
echo(
echo(
echo(        ^<div class="panel-content"^>
echo(
echo(            ^<div id="route-list"^>^</div^>
echo(
echo(        ^</div^>
echo(
echo(    ^</div^>
echo(
echo(
echo(    ^<!-- Leaflet JS --^>
echo(
echo(    ^<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"^>^</script^>
echo(
echo(
echo(    ^<!-- GeoJSON 데이터 --^>
echo(
echo(    ^<script^>
type RouteAndStop.js
echo(    ^</script^>
echo(
echo(
echo(    ^<!-- 지도 / 노선 제어 JS --^>
echo(
echo(    ^<script^>
type script.js
echo(    ^</script^>
echo(
echo(^</body^>
echo(
echo(^</html^>
) > "%OUTPUT%"

echo.
echo ===========================
echo 생성 완료
echo %OUTPUT%
echo ===========================
echo.

pause