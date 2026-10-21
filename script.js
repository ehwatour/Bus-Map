// ======================================
// Leaflet 지도 생성
// ======================================

const map = L.map("map", { zoomControl: false }).setView([37.28, 126.97], 11);

L.tileLayer("https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png", {
    maxZoom: 19,
    minZoom: 6,
    attribution: "&copy; 국토교통부 브이월드"
}).addTo(map);


// ======================================
// 버스 정류장 아이콘
// ======================================

const busStopIcon = L.icon({
    iconUrl:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="10" height="30" viewBox="0 0 26 38">
<path d="
M13 1
C7.5 1 3 5.5 3 11
C3 16.5 7 20.5 10.2 23
C11.5 25.5 12.5 30 13 37
C13.5 30 14.5 25.5 15.8 23
C19 20.5 23 16.5 23 11
C23 5.5 18.5 1 13 1
Z" fill="#FFFF00" stroke="#000000" stroke-width="2.5" stroke-linejoin="round"/>
</svg>`),
    iconSize: [16, 27],
    iconAnchor: [8, 27],
    popupAnchor: [0, -27]
});


const endStopIcon = L.icon({
    iconUrl:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="10" height="30" viewBox="0 0 26 38">
<path d="
M13 1
C7.5 1 3 5.5 3 11
C3 16.5 7 20.5 10.2 23
C11.5 25.5 12.5 30 13 37
C13.5 30 14.5 25.5 15.8 23
C19 20.5 23 16.5 23 11
C23 5.5 18.5 1 13 1
Z" fill="#FF0000" stroke="#000000" stroke-width="2.5" stroke-linejoin="round"/>
</svg>`),
    iconSize: [16, 27],
    iconAnchor: [8, 27],
    popupAnchor: [0, -27]
});


function baseStopIcon(zoom) {
    let size = 14;
    if (zoom <= 14) size = 0;
    else if (zoom <= 15) size = 14; 
    else size = 18;

    const half = size / 2;
    return L.icon({
        iconUrl:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="${size}" height="${size}">
  <circle cx="10" cy="10" r="9.2" fill="#2EA1CD" stroke="#ffffff" stroke-width="1.3"/>
  <path d="M6 4.5C5.2 4.5 4.5 5.2 4.5 6v7.5c0 .7.5 1.3 1.2 1.4L5.3 16c-.1.2 0 .5.2.6.2.1.5 0 .6-.2l.7-1.4h6.4l.7 1.4c.1.2.4.3.6.2.2-.1.3-.4.2-.6l-.4-1.1c.7-.1 1.2-.7 1.2-1.4V6c0-.8-.7-1.5-1.5-1.5H6zm0 1.2h8c.3 0 .5.2.5.5v3.2c0 .3-.2.5-.5.5H6c-.3 0-.5-.2-.5-.5V6.2c0-.3.2-.5.5-.5zm.8 6.1c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm6.4 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" fill="#ffffff"/>
</svg>`),
        iconSize: [size, size],
        iconAnchor: [half, half],
        popupAnchor: [0, -half]
    });
}


// ======================================
// 전역 변수
// ======================================

const routeInfo = [];

const colorList = [
    "#E4CDE6", //  1. 라벤더 핑크 (쿨톤 연보라)
    "#00A86B", //  2. 제이드 그린 (진한 비취초록 - 지도 녹지와 확연히 다름)
    "#7B1FA2", //  3. 딥 퍼플 (짙은 자주보라)
    "#00E676", //  4. 네온 에메랄드 (눈에 확 띄는 밝은 녹색)

    "#7FFFD4", //  5. 아쿠아 마린(밝은 민트)
    "#E91E63", //  6. 핫 마젠타 (선명한 자홍/진핑크)
    "#556B2F", //  7. 다크 올리브 (어두운 국방/카키)

    "#8D6E63", //  8. 웜 브라운 (부드러운 밤색)
    "#AEEA00", //  9. 네온 라임 (강한 형광 라임)
    "#ff8787", // 10. 튤립 (밝은 코랄)
    "#FFD600", // 11. 선플라워 옐로우 (진한 노랑 - 검은 외곽선 위에서 극강 시인성)
    "#006064", // 12. 딥 틸 (어두운 청록)
    "#9DB8D4", // 13. 미스티 블루 (연한 회청색)
    "#FF6D00", // 14. 비비드 오렌지 (쨍한 감귤 주황)
    "#C084FC", // 15. 밝은 라벤더(화사한 연보라)
    "#FF8F00", // 16. 앰버 골드 (호박색/황금주황)
    "#D500F9", // 17. 네온 마젠타 (형광 보라)
    "#1B5E20", // 18. 다크 포레스트 (매우 짙은 숲색)
    "#00B0FF", // 19. 비비드 스카이 (고채도 파랑)
    "#880E4F", // 20. 딥 버건디 (와인색)
    "#FF6F61", // 21. 리빙 코랄 (화사한 산호색)
    "#00E5FF", // 22. 일렉트릭 사이언 (형광빛 밝은 청록)
    "#9C27B0", // 23. 미디엄 퍼플 (밝은 보라)
    "#B71C1C", // 24. 다크 마룬 (피색/암적색)
    "#1DE9B6", // 25. 아쿠아 민트 (밝은 민트)
    "#B45309", // 26. 카라멜 브라운 (구리/갈색)
    "#2979FF", // 27. 로열 블루 (원색 파랑)
    "#C2185B", // 28. 루비 로즈 (장미빛 자주)
    "#76FF03", // 29. 일렉트릭 그린 (형광 연두)
    "#263238"  // 30. 다크 블루그레이 (먹색빛 네이비)
];

let colorIndex = 0;

function hexToRgba(hex, opacity) {
    if (!hex) return "rgba(200, 200, 200, 0.2)";
    hex = String(hex).replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function updateVariantTagVisual(cell, checked, color) {
    const icon = cell.querySelector(".route-tag-check-icon");
    if (checked) {
        cell.style.backgroundColor = color;
        cell.style.borderColor = color;
        if (icon) icon.style.display = "flex";
    } else {
        cell.style.backgroundColor = hexToRgba(color, 0.18);
        cell.style.borderColor = color;
        if (icon) icon.style.display = "none";
    }
}


// ======================================
// 레이어 ON / OFF
// ======================================

function toggleRouteLayer(data, checked) {
    if (!data || !data.layer) return;
    data.isMapSelected = checked;

    if (data.isMapSelected) {
        if (!map.hasLayer(data.layer)) map.addLayer(data.layer);
    } else {
        if (map.hasLayer(data.layer)) map.removeLayer(data.layer);
    }
}


// ======================================
// 기존 대분류
// ======================================

function getRouteGroup(routeName) {
    if (routeName.includes("소하리") || routeName.includes("석수") || routeName.includes("안산") || routeName.includes("인덕원")) {
        return "금정/석수/안산";
    }
    if (routeName.includes("한일타운") || routeName.includes("향남") || routeName.includes("정자동") || routeName.includes("선경")) {
        return "농대/역전/남수원";
    }
    if (routeName.includes("성대") || routeName.includes("칠보") || routeName.includes("의왕/송정지구") || routeName.includes("입북동")) {
        return "성대/칠보";
    }
    if (routeName.includes("조암/생활관") || routeName.includes("조암/한라비발디")) {
        return "조암";
    }
    if (routeName.includes("영통") || routeName.includes("아주대") || routeName.includes("그린빌")) {
        return "현대/영통/동수원";
    }
    return "기타";
}


// ======================================
// 노선명 분석
// ======================================

function parseRouteName(fullName) {
    const match = fullName.match(/^(.+)\((.+)\)$/);
    if (!match) return { baseName: fullName.trim(), categories: [] };

    const baseName = match[1].trim();
    const inside = match[2].trim();

    if (!inside.includes("평일") && !inside.includes("주말")) {
        return { baseName: fullName.trim(), categories: [] };
    }

    const categories = [];
    const combinations = inside.split("_").map(v => v.trim()).filter(Boolean);

    combinations.forEach(combination => {
        const firstSlash = combination.indexOf("/");
        if (firstSlash === -1) return;

        const dayPart = combination.slice(0, firstSlash).trim();
        const routePart = combination.slice(firstSlash + 1).trim();
        if (!dayPart || !routePart) return;

        const days = dayPart.split("&").map(v => v.trim()).filter(Boolean);
        const types = routePart.split("&").map(v => v.trim()).filter(Boolean);

        days.forEach(day => {
            types.forEach(type => {
                categories.push({ day: day, type: type });
            });
        });
    });

    const unique = [];
    const seen = new Set();
    categories.forEach(item => {
        const key = item.day + "||" + item.type;
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(item);
    });

    return { baseName: baseName, categories: unique };
}


// ======================================
// GeoJSON 노선 구조
// ======================================

const routes = {};

routeGeojson.features.forEach(feature => {
    const fullName = feature.properties["노선명"];
    if (!fullName) return;

    const parsed = parseRouteName(fullName);
    const group = getRouteGroup(parsed.baseName);

    if (!routes[group]) routes[group] = {};
    if (!routes[group][parsed.baseName]) {
        routes[group][parsed.baseName] = { variants: {}, variantOrder: [] };
    }

    const baseRoute = routes[group][parsed.baseName];
    if (!baseRoute.variants[fullName]) {
        baseRoute.variants[fullName] = {
            features: [],
            categories: parsed.categories
        };
        baseRoute.variantOrder.push(fullName);
    }

    baseRoute.variants[fullName].features.push(feature);
});


// ======================================
// 전체 데이터에 실제 존재하는 열만 수집
// ======================================

function getAllDayTypes(allRoutes, day) {
    const types = [];
    const seen = new Set();

    Object.values(allRoutes).forEach(groupRoutes => {
        Object.values(groupRoutes).forEach(route => {
            route.variantOrder.forEach(variantName => {
                const variant = route.variants[variantName];
                variant.categories.forEach(category => {
                    if (category.day !== day) return;
                    const type = category.type;
                    if (!type || seen.has(type)) return;
                    seen.add(type);
                    types.push(type);
                });
            });
        });
    });

    return types;
}


// ======================================
// 전역 평일 / 주말 열
// ======================================

const weekdayTypes = getAllDayTypes(routes, "평일");
const weekendTypes = getAllDayTypes(routes, "주말");

const typeOrder = [
    "주출/조출", "주출", "야출", "주퇴/유연제", "주퇴",
    "야출/C조", "주퇴/C조", "야출/특수", "주퇴/특수",
    "야퇴/C조", "야퇴", "야퇴/시차"
];

function sortDayTypes(types) {
    return types
        .filter(type => typeOrder.includes(type))
        .sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));
}

weekdayTypes.splice(0, weekdayTypes.length, ...sortDayTypes(weekdayTypes));
weekendTypes.splice(0, weekendTypes.length, ...sortDayTypes(weekendTypes));

let visibleWeekdayTypes = [...weekdayTypes];
let visibleWeekendTypes = [...weekendTypes];


// ======================================
// 노선명 실제 폭 측정
// ======================================

function measureRouteNameWidth() {
    const allRouteNames = [];
    Object.values(routes).forEach(groupRoutes => {
        Object.keys(groupRoutes).forEach(baseName => {
            allRouteNames.push(baseName);
        });
    });

    if (allRouteNames.length === 0) return 120;

    const mobile = window.matchMedia("(max-width: 600px)").matches;
    const verySmall = window.matchMedia("(max-width: 360px)").matches;

    let fontSize = "14px";
    let fontWeight = "500";
    let paddingLeft = 5;
    let paddingRight = 5;

    if (mobile) fontSize = "12px";
    if (verySmall) fontSize = "12px";

    const measure = document.createElement("span");
    measure.style.position = "absolute";
    measure.style.left = "-100000px";
    measure.style.top = "-100000px";
    measure.style.visibility = "hidden";
    measure.style.whiteSpace = "nowrap";
    measure.style.width = "max-content";
    measure.style.minWidth = "max-content";
    measure.style.paddingLeft = paddingLeft + "px";
    measure.style.paddingRight = paddingRight + "px";
    measure.style.boxSizing = "border-box";
    measure.style.fontFamily = '"Malgun Gothic", Arial, sans-serif';
    measure.style.fontSize = fontSize;
    measure.style.fontWeight = fontWeight;
    measure.style.lineHeight = "normal";

    document.body.appendChild(measure);

    let maxWidth = 0;
    allRouteNames.forEach(name => {
        measure.textContent = name;
        const width = Math.ceil(measure.getBoundingClientRect().width);
        if (width > maxWidth) maxWidth = width;
    });

    measure.remove();
    return maxWidth + 24;
}

let routeNameWidth = measureRouteNameWidth();


// ======================================
// 검색 요소 및 상태
// ======================================

const searchBox = document.getElementById("route-search");
const searchBtn = document.getElementById("search-btn");
const searchCheck = document.getElementById("search-check");

let searchLocked = false;
let lockedKeyword = "";


// ======================================
// 노선명 정렬
// ======================================

function sortRouteNames(a, b) {
    const aFirst = a.charAt(0);
    const bFirst = b.charAt(0);
    const aEng = /^[A-Za-z]/.test(aFirst);
    const bEng = /^[A-Za-z]/.test(bFirst);

    if (aEng && !bEng) return -1;
    if (!aEng && bEng) return 1;

    return a.localeCompare(b, "ko", { numeric: true });
}


// ======================================
// [핵심 개선] 체크박스 계층 일괄 동기화 (Bottom-Up)
// 하위(카테고리) -> 노선명 -> 대분류 -> 전체(searchCheck)
// indeterminate(대시 표시) 지원
// ======================================

function updateAllCheckboxHierarchy() {
    let totalVisibleCats = 0;
    let checkedVisibleCats = 0;

    document.querySelectorAll(".group-title").forEach(groupTitle => {
        const groupCheck = groupTitle.querySelector(".group-checkbox");
        const tableWrapper = groupTitle.nextElementSibling;
        if (!tableWrapper) return;

        const rows = Array.from(tableWrapper.querySelectorAll(".route-row"));
        if (rows.length === 0) return;

        rows.forEach(row => {
            const isVisible = row.style.display !== "none";
            const nameCheck = row.querySelector(".route-name-checkbox");
            const catChecks = Array.from(row.querySelectorAll(".route-category-checkbox"));

            if (catChecks.length > 0 && nameCheck) {
                // 하위가 '전부' 켜졌을 때만 true, 하나라도 꺼지면 무조건 false (대시 없음)
                const checkedCount = catChecks.filter(cb => cb.checked).length;
                const totalCount = catChecks.length;

if (checkedCount === totalCount) {
    // 1) 전부 켜졌을 때: 체크(ON), 대시 해제
    nameCheck.checked = true;
    nameCheck.indeterminate = false;
} else if (checkedCount === 0) {
    // 2) 완전히 다 꺼졌을 때만: 체크 해제(OFF), 대시 해제
    nameCheck.checked = false;
    nameCheck.indeterminate = false;
} else {
    // 3) 하나라도 꺼져있지만 전부는 아닐 때: 체크 해제 + 대시(Dash) 표시
    nameCheck.checked = false;
    nameCheck.indeterminate = true;
}

if (isVisible) {
                    totalVisibleCats += totalCount;
                    checkedVisibleCats += checkedCount;
                }
            }
        });

        if (groupCheck) {
            const groupCatChecks = Array.from(tableWrapper.querySelectorAll(".route-category-checkbox"));
            const groupTotalCount = groupCatChecks.length;
            const groupCheckedCount = groupCatChecks.filter(cb => cb.checked).length;

            if (groupCheckedCount === groupTotalCount && groupTotalCount > 0) {
                groupCheck.checked = true;
                groupCheck.indeterminate = false;
            } else if (groupCheckedCount === 0) {
                groupCheck.checked = false;
                groupCheck.indeterminate = false;
            } else {
                groupCheck.checked = false;
                groupCheck.indeterminate = true;
            }
        }
    });

    if (searchCheck) {
    if (checkedVisibleCats === totalVisibleCats && totalVisibleCats > 0) {
        // 화면에 보이는 노선이 전부 켜짐 (ON)
        searchCheck.checked = true;
        searchCheck.indeterminate = false;
    } else if (checkedVisibleCats === 0) {
        // 화면에 보이는 노선이 전부 꺼짐 (완전 OFF)
        searchCheck.checked = false;
        searchCheck.indeterminate = false;
    } else {
        // 화면에 보이는 노선 중 일부만 켜짐 (대시 표시)
        searchCheck.checked = false;
        searchCheck.indeterminate = true;
    }
}

    // 상위 체크박스를 눌렀을 때 시간대 태그 색상 일치 갱신
    document.querySelectorAll(".route-variant").forEach(tag => {
        const cb = tag.querySelector(".route-category-checkbox");
        const info = routeInfo.find(item => item.variantName === cb?.dataset.variant);
        if (cb && info) updateVariantTagVisual(tag, cb.checked, info.color);
    });
}

// ======================================
// 1. [전체 선택 버튼] - 모든 노선 100% 켜기
// ======================================
document.getElementById("checkAll").onclick = function () {
    // 모든 체크박스 전부 ON
    document.querySelectorAll(".route-name-checkbox, .route-category-checkbox, .group-checkbox").forEach(cb => {
        cb.checked = true;
        cb.indeterminate = false;
    });

    // 지도 상의 모든 노선 레이어 전부 켜기
    routeInfo.forEach(data => {
        toggleRouteLayer(data, true);
    });

    // 검색 체크박스도 ON으로 일치
    if (searchCheck) {
        searchCheck.checked = true;
        searchCheck.indeterminate = false;
    }

    // 시간대 태그 색상 활성화 동기화
    updateAllCheckboxHierarchy();
};


// ======================================
// 2. [전체 해제 버튼] - 모든 노선 100% 끄기
// ======================================
document.getElementById("uncheckAll").onclick = function () {
    // 모든 체크박스 전부 OFF
    document.querySelectorAll(".route-name-checkbox, .route-category-checkbox, .group-checkbox").forEach(cb => {
        cb.checked = false;
        cb.indeterminate = false;
    });

    // 지도 상의 모든 노선 레이어 전부 끄기
    routeInfo.forEach(data => {
        toggleRouteLayer(data, false);
    });

    // 검색 체크박스도 OFF로 일치
    if (searchCheck) {
        searchCheck.checked = false;
        searchCheck.indeterminate = false;
    }

    // 시간대 태그 색상 비활성화 동기화
    updateAllCheckboxHierarchy();
};


// ======================================
// 3. [검색창 옆 체크박스] - "검색되어 유효한 노선만" ON/OFF
// ======================================
searchCheck.onchange = function () {
    const isChecked = searchCheck.checked;

    document.querySelectorAll(".route-row").forEach(row => {
        // [수정] 대분류 접힘과 상관없이, "검색어와 안 맞아서 숨겨진 노선"만 제외!
        if (row.style.display === "none") return;

        // 화면에 열려 있는 요일/시간대 칸 속의 체크박스만 제어
        row.querySelectorAll(".route-type-cell").forEach(cell => {
            if (cell.style.display === "none") return; // '열 표시'로 꺼둔 숨겨진 칸 제외

            cell.querySelectorAll(".route-category-checkbox").forEach(cb => {
                cb.checked = isChecked;

                // 지도 레이어도 화면에 보이는 해당 시간대 노선만 켜고 끔
                const info = routeInfo.find(item => item.variantName === cb.dataset.variant);
                if (info) {
                    toggleRouteLayer(info, isChecked);
                }
            });
        });

        // 해당 행의 노선명 체크박스 상태 동기화
        const nameCheck = row.querySelector(".route-name-checkbox");
        if (nameCheck) {
            const catChecks = Array.from(row.querySelectorAll(".route-category-checkbox"));
            const checkedCount = catChecks.filter(cb => cb.checked).length;
            nameCheck.checked = checkedCount === catChecks.length && catChecks.length > 0;
            nameCheck.indeterminate = checkedCount > 0 && checkedCount < catChecks.length;
        }
    });

    // 상위 대분류 및 태그 색상 계층 동기화
    updateAllCheckboxHierarchy();
};

// ======================================
// 열 표시 / 숨김 적용
// ======================================

function applyColumnVisibility() {
    panelManualWidth = false;

    // 열 표시 변경 전 기존 콘텐츠 너비와 카테고리 열 너비 측정
    const panelContent = document.querySelector(".panel-content");
    const previousContentWidth = panelContent
        ? panelContent.scrollWidth
        : 0;

    const previousCategoryWidth =
        (syncedCategoryColumnWidths["평일"] || [])
            .reduce((sum, width) => sum + width, 0) +
        (syncedCategoryColumnWidths["주말"] || [])
            .reduce((sum, width) => sum + width, 0);

    // 카테고리 열 이외의 너비를 보존
    const nonCategoryWidth = Math.max(
        0,
        previousContentWidth - previousCategoryWidth
    );

    categoryHeaderInner.querySelectorAll(".day-type-header").forEach(header => {
        const type = header.dataset.type;
        const dayHeader = header.closest(".day-header-wrapper");
        if (!dayHeader) return;

        const day = dayHeader.querySelector(".day-title-row")?.textContent;
        const visible = day === "평일"
            ? visibleWeekdayTypes.includes(type)
            : visibleWeekendTypes.includes(type);

        header.style.visibility = visible ? "visible" : "hidden";
        header.style.pointerEvents = visible ? "auto" : "none";
    });

    document.querySelectorAll(".route-type-cell").forEach(cell => {
        const day = cell.dataset.day;
        const type = cell.dataset.type;
        const visible = day === "평일"
            ? visibleWeekdayTypes.includes(type)
            : visibleWeekendTypes.includes(type);

        cell.style.display = visible ? "flex" : "none";
    });

        
    syncCategoryColumnWidths();

    requestAnimationFrame(() => {
        updateVerticalColumnLines();

        // 토글 후 변경된 평일/주말 분류 열 너비
        const currentCategoryWidth =
            (syncedCategoryColumnWidths["평일"] || [])
                .reduce((sum, width) => sum + width, 0) +
            (syncedCategoryColumnWidths["주말"] || [])
                .reduce((sum, width) => sum + width, 0);

        // 분류 열 이외의 기존 너비에 변경 후 분류 열 너비를 더함
        autoResizeControlPanel(routeNameWidth + currentCategoryWidth+1);
    });
}


// ======================================
// 평일/주말 열 표시 토글 패널 생성
// ======================================

function createColumnTogglePanel() {
    const wrapper = document.createElement("div");
    wrapper.id = "column-toggle-wrapper";

    const button = document.createElement("button");
    button.id = "column-toggle-button";
    button.type = "button";
    button.innerHTML = `
        <span>열 표시</span>
        <span class="toggle-arrow">▼</span>
    `;

    const panel = document.createElement("div");
    panel.id = "column-toggle-panel";
    panel.style.display = "none";

    function createDayToggleGroup(dayName, types, visibleTypes) {
        const group = document.createElement("div");
        group.className = "column-toggle-group";

        const getVisibleTypes = () =>
            dayName === "평일" ? visibleWeekdayTypes : visibleWeekendTypes;

        const updateDayCheckbox = () => {
            dayInput.checked = types.length > 0 && types.every(type => getVisibleTypes().includes(type));
            const someChecked = types.some(type => getVisibleTypes().includes(type));
            dayInput.indeterminate = someChecked && !dayInput.checked;
        };

        const dayRow = document.createElement("div");
        dayRow.className = "column-toggle-header-row";

        const title = document.createElement("span");
        title.className = "column-toggle-day-title";
        title.textContent = dayName;

        const dayInput = document.createElement("input");
        dayInput.type = "checkbox";
        dayInput.className = "column-toggle-checkbox"; // 숨김 처리됨
        dayInput.checked = types.length > 0 && types.every(type => visibleTypes.includes(type));

        dayInput.addEventListener("change", () => {
            if (dayName === "평일") {
                visibleWeekdayTypes = dayInput.checked ? [...weekdayTypes] : [];
            } else {
                visibleWeekendTypes = dayInput.checked ? [...weekendTypes] : [];
            }
            group.querySelectorAll(".column-toggle-pill-input").forEach(input => {
                input.checked = dayInput.checked;
            });
            applyColumnVisibility();
        });

        const daySwitch = document.createElement("label");
        daySwitch.className = "switch header-switch";
        const daySlider = document.createElement("span");
        daySlider.className = "slider";
        daySwitch.append(dayInput, daySlider);

        dayRow.append(title, daySwitch);
        group.appendChild(dayRow);

        dayRow.addEventListener("click", e => {
            if (!daySwitch.contains(e.target)) dayInput.click();
        });

        // 캡슐 버튼(Pill)들을 담을 2열 그리드
        const pillsGrid = document.createElement("div");
        pillsGrid.className = "column-toggle-pills-grid";

        types.forEach(type => {
            const pill = document.createElement("label");
            pill.className = "column-toggle-pill";

            const input = document.createElement("input");
            input.type = "checkbox";
            input.className = "column-toggle-pill-input";
            input.checked = visibleTypes.includes(type);
            input.dataset.type = type;

            input.addEventListener("change", () => {
                if (dayName === "평일") {
                    visibleWeekdayTypes = input.checked
                        ? [...new Set([...visibleWeekdayTypes, type])]
                        : visibleWeekdayTypes.filter(t => t !== type);
                } else {
                    visibleWeekendTypes = input.checked
                        ? [...new Set([...visibleWeekendTypes, type])]
                        : visibleWeekendTypes.filter(t => t !== type);
                }
                updateDayCheckbox();
                applyColumnVisibility();
            });

            const pillContent = document.createElement("span");
            pillContent.className = "column-toggle-pill-content";
            pillContent.innerHTML = `
                <span class="pill-icon"></span>
                <span class="pill-text">${type}</span>
            `;

            pill.append(input, pillContent);
            pillsGrid.appendChild(pill);
        });

        group.appendChild(pillsGrid);
        updateDayCheckbox();
        return group;
    }

    panel.appendChild(createDayToggleGroup("평일", weekdayTypes, visibleWeekdayTypes));
    panel.appendChild(createDayToggleGroup("주말", weekendTypes, visibleWeekendTypes));

// [추가] 가장 긴 버튼 길이를 동적으로 측정해서 모든 버튼 폭을 일치시키는 함수
    function syncPillButtonWidths() {
        const mobile = window.matchMedia("(max-width: 600px)").matches;
        const allPillContents = panel.querySelectorAll(".column-toggle-pill-content");
        if (allPillContents.length === 0) return;

        if (!mobile) {
            // PC 환경에서는 원래대로 스타일 초기화
            allPillContents.forEach(content => {
                content.style.width = "";
                content.style.minWidth = "";
            });
            panel.querySelectorAll(".column-toggle-pills-grid").forEach(grid => {
                grid.style.gridTemplateColumns = "";
            });
            return;
        }

        // 1. 임시 span으로 화면에 렌더링된 텍스트 중 가장 긴 너비 측정
        const measure = document.createElement("span");
        measure.style.position = "absolute";
        measure.style.visibility = "hidden";
        measure.style.whiteSpace = "nowrap";
        measure.style.fontFamily = '"Malgun Gothic", Arial, sans-serif';
        measure.style.fontSize = "11.5px";
        measure.style.letterSpacing = "-0.5px";
        measure.style.fontWeight = "600";
        document.body.appendChild(measure);

        let maxTextWidth = 0;
        panel.querySelectorAll(".pill-text").forEach(textSpan => {
            measure.textContent = textSpan.textContent;
            const w = Math.ceil(measure.getBoundingClientRect().width);
            if (w > maxTextWidth) maxTextWidth = w;
        });
        measure.remove();

        // 2. 가장 긴 텍스트 + 체크아이콘(10px) + 아이콘여백(2px) + 좌우패딩(8px) + 시야 용이 넓이(10px)
        const finalPillWidth = maxTextWidth + 30;

        // 3. 모든 버튼의 너비를 가장 긴 크기로 일치시키고, 그리드 열 폭도 동일하게 적용
        allPillContents.forEach(content => {
            content.style.width = finalPillWidth + "px";
            content.style.minWidth = finalPillWidth + "px";
            content.style.boxSizing = "border-box";
        });

        panel.querySelectorAll(".column-toggle-pills-grid").forEach(grid => {
            grid.style.gridTemplateColumns = `repeat(3, ${finalPillWidth}px)`;
        });
    }

// 팝업 위치를 버튼 바로 아래로 갱신하는 함수

function updatePopupPosition() {
    if (panel.style.display === "none") return;

    const rect = button.getBoundingClientRect();

    panel.style.top = (rect.bottom + 4) + "px";
    panel.style.left = Math.max(8, rect.left) + "px";
}

button.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = panel.style.display !== "none";
    if (isOpen) {
        panel.style.display = "none";
        const arrow = button.querySelector(".toggle-arrow");
        if (arrow) arrow.textContent = "▼";
    } else {
        panel.style.display = "grid";
        syncPillButtonWidths();
updatePopupPosition();
        const arrow = button.querySelector(".toggle-arrow");
        if (arrow) arrow.textContent = "▲";
    }
});
window.addEventListener("resize", syncPillButtonWidths);
const closePopupOnOutside = (e) => {
    if (panel.style.display === "none") return;
    if (!panel.contains(e.target) && !button.contains(e.target)) {
        panel.style.display = "none";
        const arrow = button.querySelector(".toggle-arrow");
        if (arrow) arrow.textContent = "▼";
    }
};
document.addEventListener("click", closePopupOnOutside);
document.addEventListener("touchstart", closePopupOnOutside, { passive: true, capture: true });

window.addEventListener("scroll", updatePopupPosition, true);
window.addEventListener("resize", updatePopupPosition);

    wrapper.appendChild(button);
document.body.appendChild(panel);
    return wrapper;
}

const columnTogglePanel = createColumnTogglePanel();


// ======================================
// 상단 고정 분류 헤더
// ======================================

const categoryHeader = document.createElement("div");
categoryHeader.id = "route-category-header";

const categoryHeaderInner = document.createElement("div");
categoryHeaderInner.className = "category-header-inner"; 
categoryHeaderInner.style.gridTemplateColumns = routeNameWidth + "px max-content max-content";

const emptyHeader = document.createElement("div");
emptyHeader.style.width = routeNameWidth + "px";
emptyHeader.style.minWidth = routeNameWidth + "px";
categoryHeaderInner.appendChild(emptyHeader);


// ======================================
// 날짜 헤더
// ======================================

function createDayHeader(dayName, types) {
    const wrapper = document.createElement("div");
    wrapper.className = "day-header-wrapper";
    wrapper.style.display = "grid";
    wrapper.style.gridTemplateColumns = types.map(() => "34px").join(" ");
    wrapper.style.gridTemplateRows = "auto auto";
    wrapper.style.width = "max-content";
    wrapper.style.minWidth = "0";
    wrapper.style.boxSizing = "border-box";
    wrapper.style.textAlign = "center";
    wrapper.style.alignItems = "stretch";

    if (types.length === 0) {
        wrapper.style.display = "none";
        return wrapper;
    }

    const title = document.createElement("div");
    title.className = "day-title-row";
    title.textContent = dayName;
    title.style.gridColumn = `1 / span ${types.length}`;
    title.style.fontWeight = "bold";
    title.style.paddingBottom = "4px";
    title.style.boxSizing = "border-box";
    title.style.textAlign = "center";
    title.style.border = "0";
    wrapper.appendChild(title);

    types.forEach(type => {
        const typeHeader = document.createElement("div");
        typeHeader.className = "day-type-header";
        typeHeader.dataset.type = type;
        typeHeader.textContent = type;
        typeHeader.style.fontSize = "13px";
        typeHeader.style.fontWeight = "normal";
        typeHeader.style.textAlign = "center";
        typeHeader.style.whiteSpace = "nowrap";
        typeHeader.style.boxSizing = "border-box";
        typeHeader.style.minWidth = "0";
        typeHeader.style.height = "100%";
        typeHeader.style.padding = "0 2px";
        typeHeader.style.border = "0";
        wrapper.appendChild(typeHeader);
    });

    return wrapper;
}

categoryHeaderInner.appendChild(createDayHeader("평일", weekdayTypes));
categoryHeaderInner.appendChild(createDayHeader("주말", weekendTypes));
categoryHeader.appendChild(categoryHeaderInner);


// ======================================
// 노선명 열 폭 적용
// ======================================

function applyRouteNameWidth() {
    routeNameWidth = measureRouteNameWidth();
    const routeList = document.getElementById("route-list");
    if (routeList) {
        routeList.style.setProperty("--route-name-width", routeNameWidth + "px");
    }

    if (categoryHeaderInner) {
        categoryHeaderInner.style.gridTemplateColumns = routeNameWidth + "px max-content max-content";
    }

    if (emptyHeader) {
        emptyHeader.style.width = routeNameWidth + "px";
        emptyHeader.style.minWidth = routeNameWidth + "px";
    }
}


let syncedCategoryColumnWidths = { "평일": [], "주말": [] };


// ======================================
// [개선] 분류 하나 표시 및 개별 체크박스
// ======================================

function createRouteVariantCell(info, type) {
    const cell = document.createElement("div");
    cell.className = "route-variant";

    // 기존 체크박스를 보이지 않게만 두고 기존 로직을 그대로 사용
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = map.hasLayer(info.layer);
    cb.className = "route-category-checkbox";
    cb.dataset.variant = info.variantName;

    // 흰색 체크 아이콘 SVG
    const checkIcon = document.createElement("span");
    checkIcon.className = "route-tag-check-icon";
    checkIcon.innerHTML = `
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1.5 4.5L4 7L9.5 1.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    cell.append(cb, checkIcon);
    
    // 초기 로딩 시 지도에 노선이 켜져있으면 색 채우고, 꺼져있으면 연하게 테두리 표시
    updateVariantTagVisual(cell, cb.checked, info.color);

    // 체크박스 값이 바뀔 때 색상/지도/상위체크박스 갱신 (원본 로직 그대로 유지)
    cb.onchange = () => {
        updateVariantTagVisual(cell, cb.checked, info.color);

        // 동일한 노선 변형을 가진 다른 요일/시간대 셀의 태그도 같이 동기화
        document.querySelectorAll(`.route-category-checkbox[data-variant="${CSS.escape(info.variantName)}"]`)
            .forEach(otherCb => {
                otherCb.checked = cb.checked;
                const otherTag = otherCb.closest(".route-variant");
                if (otherTag) updateVariantTagVisual(otherTag, cb.checked, info.color);
            });

        toggleRouteLayer(info, cb.checked);
        updateAllCheckboxHierarchy();
    };

    return cell;
}
// ======================================
// 평일 / 주말 영역 생성
// ======================================

function createDayArea(infos, day, types) {
    const area = document.createElement("div");
    area.className = "route-day-area";
    area.style.display = "grid";
    area.style.gridTemplateColumns = types.map((type, index) => {
        const widths = day === "평일" ? syncedCategoryColumnWidths["평일"] : syncedCategoryColumnWidths["주말"];
        return (widths[index] || 34) + "px";
    }).join(" ");

    area.style.gridAutoFlow = "column";
    area.style.alignItems = "center";
    area.style.height = "100%";
    area.style.width = "100%";
    area.style.minWidth = "0";
    area.style.boxSizing = "border-box";

    if (types.length === 0) {
        area.style.display = "none";
        return area;
    }

    types.forEach(type => {
        const cell = document.createElement("div");
        cell.className = "route-type-cell";
        cell.dataset.day = day;
        cell.dataset.type = type;
        cell.style.borderBottom = "0";
        cell.style.boxSizing = "border-box";
        cell.style.minWidth = "0";
        cell.style.width = "100%";
        cell.style.height = "100%";
        cell.style.padding = "3px 6px";
        cell.style.whiteSpace = "nowrap";
        cell.style.display = "flex";
        cell.style.alignItems = "center";
        cell.style.justifyContent = "center";
        cell.style.gap = "3px";

        const matched = [];
        infos.forEach(info => {
            info.categories.forEach(category => {
                if (category.day === day && category.type === type) {
                    if (!matched.includes(info)) matched.push(info);
                }
            });
        });

matched.forEach(info => {
            const item = createRouteVariantCell(info, type);
            cell.appendChild(item);
        });

        // [수정된 부분] 중복 클릭 버그를 없애고 안전하게 1번만 토글되도록 처리
        cell.onclick = function (e) {
            const checkbox = cell.querySelector(".route-category-checkbox");
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event("change"));
            }
        };

        area.appendChild(cell);
    });

    return area;
}


// ======================================
// 색상 배정
// ======================================

function getRouteColor(baseName, variantName, categories) {
    const usedColors = new Set();

    routeInfo.forEach(info => {
        if (!info) return;
        if (info.variantName === variantName) return;
        if (info.baseName === baseName) {
            usedColors.add(info.color);
            return;
        }
        const sameColumn = categories.some(category =>
            info.categories.some(otherCategory =>
                otherCategory.day === category.day &&
                otherCategory.type === category.type
            )
        );
        if (sameColumn) {
            usedColors.add(info.color);
        }
    });

    for (let i = 0; i < colorList.length; i++) {
        const index = (colorIndex + i) % colorList.length;
        const color = colorList[index];
        if (!usedColors.has(color)) {
            colorIndex = (index + 1) % colorList.length;
            return color;
        }
    }

    const color = colorList[colorIndex % colorList.length];
    colorIndex++;
    return color;
}


// ======================================
// [개선] 대분류 테이블 생성 및 계층 이벤트 연결
// ======================================

function createRouteTable(groupName, groupRoutes) {
    const container = document.getElementById("route-list");
    const groupTitle = document.createElement("div");
    groupTitle.className = "group-title";
    groupTitle.dataset.groupName = groupName;

    const arrow = document.createElement("span");
    arrow.textContent = "▼";
    arrow.className = "group-arrow";

    const groupCheck = document.createElement("input");
    groupCheck.type = "checkbox";
    groupCheck.checked = true;
    groupCheck.className = "group-checkbox";

const groupNameSpan = document.createElement("span");
    groupNameSpan.textContent = " " + groupName;
    groupNameSpan.style.fontWeight = "bold";

    // 대분류 행 전체 클릭 시 체크박스 토글 (화살표, 체크박스 본체 제외)
    groupTitle.onclick = function (e) {
        if (e.target === arrow || e.target === groupCheck) return;
        groupCheck.click();
    };

    groupTitle.append(arrow, groupCheck, groupNameSpan);
    container.appendChild(groupTitle);

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "route-table-wrapper";

    const routeBody = document.createElement("div");
    routeBody.className = "route-body";

    Object.keys(groupRoutes)
        .sort(sortRouteNames)
        .forEach((baseName, routeIndex) => {
            const route = groupRoutes[baseName];
            const row = document.createElement("div");
            row.className = "route-row";
            row.dataset.baseName = baseName;

            if (routeIndex === 0) {
                row.style.borderTop = "1px solid #eeeeee";
            }

            row.style.display = "grid";
            row.style.gridTemplateColumns = routeNameWidth + "px max-content max-content";

            const nameCell = document.createElement("div");
            nameCell.className = "route-name-cell";

            const routeCheck = document.createElement("input");
            routeCheck.type = "checkbox";
            routeCheck.className = "route-name-checkbox";
            routeCheck.checked = true;

            // [개선] 노선명 체크박스 변경 시 해당 노선의 하위 항목 일괄 제어
            routeCheck.onchange = function () {
                const isChecked = routeCheck.checked;
                row.querySelectorAll(".route-category-checkbox").forEach(cb => {
                    cb.checked = isChecked;
                });

                route.variantOrder.forEach(variantName => {
                    const info = routeInfo.find(item => item.baseName === baseName && item.variantName === variantName);
                    if (info) toggleRouteLayer(info, isChecked);
                });

                updateAllCheckboxHierarchy();
            };

            nameCell.onclick = function (e) {
                if (e.target === routeCheck) return;
                routeCheck.click();
            };

            const routeNameText = document.createElement("span");
            routeNameText.textContent = baseName;
            nameCell.append(routeCheck, routeNameText);

routeList.style.setProperty("--route-name-width", routeNameWidth + "px");
            row.appendChild(nameCell);

            const categoryMap = { "평일": [], "주말": [] };

            route.variantOrder.forEach(variantName => {
                const variant = route.variants[variantName];
                const color = getRouteColor(baseName, variantName, variant.categories);
                const featureData = {
                    type: "FeatureCollection",
                    features: variant.features
                };

                const outlineLayer = L.geoJSON(featureData, {
                    style: {
                        color: "#000000",
                        weight: 7,
                        opacity: 1,
                        lineCap: "round",
                        lineJoin: "round"
                    }
                });

                const routeLayer = L.geoJSON(featureData, {
                    style: {
                        color: color,
                        weight: 4,
                        opacity: 1,
                        lineCap: "round",
                        lineJoin: "round"
                    },
                    onEachFeature(feature, layer) {
    layer.bindPopup(feature.properties["노선명"] || baseName);
}
                });

                const layer = L.layerGroup([outlineLayer, routeLayer]);
                layer.addTo(map);

                const info = {
                    layer: layer,
                    color: color,
                    group: groupName,
                    isMapSelected: true,
                    baseName: baseName,
                    variantName: variantName,
                    categories: variant.categories
                };

                routeInfo.push(info);

                const days = new Set();
                variant.categories.forEach(category => {
                    if (categoryMap[category.day]) {
                        days.add(category.day);
                    }
                });

                days.forEach(day => {
                    categoryMap[day].push(info);
                });
            });

            const weekdayArea = createDayArea(categoryMap["평일"], "평일", weekdayTypes);
            weekdayArea.classList.add("weekday-route-area");
            row.appendChild(weekdayArea);

            const weekendArea = createDayArea(categoryMap["주말"], "주말", weekendTypes);
            weekendArea.classList.add("weekend-route-area");
            row.appendChild(weekendArea);

            routeBody.appendChild(row);
        });

    tableWrapper.appendChild(routeBody);
    container.appendChild(tableWrapper);

    arrow.onclick = () => {
        if (tableWrapper.style.display === "none") {
            tableWrapper.style.display = "block";
            groupTitle.style.display = "flex";
            arrow.textContent = "▼";
        } else {
            tableWrapper.style.display = "none";
            arrow.textContent = "▶";
        }
        requestAnimationFrame(() => {
            syncCategoryColumnWidths();
        });
    };

    // [개선] 대분류 체크박스 변경 시 하위 모든 노선 및 카테고리 일괄 제어
    groupCheck.onchange = () => {
        const isChecked = groupCheck.checked;
        tableWrapper.querySelectorAll(".route-name-checkbox, .route-category-checkbox").forEach(cb => {
            cb.checked = isChecked;
            cb.indeterminate = false;
        });

        routeInfo.forEach(data => {
            if (data.group === groupName) {
                toggleRouteLayer(data, isChecked);
            }
        });

        updateAllCheckboxHierarchy();
    };
}


// ======================================
// 전체 노선 목록 DOM 설정
// ======================================

const routeList = document.getElementById("route-list");
routeList.style.position = "relative";
routeList.style.webkitOverflowScrolling = "touch";
routeList.style.setProperty("--route-name-width", routeNameWidth + "px");

routeList.style.scrollbarWidth = "none";
routeList.style.msOverflowStyle = "none";

routeList.appendChild(categoryHeader);
categoryHeader.appendChild(columnTogglePanel);
columnTogglePanel.style.boxSizing = "border-box";


// ======================================
// 모든 그룹 생성
// ======================================

Object.keys(routes)
    .sort((a, b) => a.localeCompare(b, "ko"))
    .forEach(groupName => {
        createRouteTable(groupName, routes[groupName]);
    });


// ======================================
// 카테고리 열 폭 계산 및 동기화
// ======================================

function syncCategoryColumnWidths() {
    const dayConfigs = [
        { day: "평일", types: weekdayTypes, visibleTypes: visibleWeekdayTypes, selector: ".weekday-route-area", headerIndex: 1 },
        { day: "주말", types: weekendTypes, visibleTypes: visibleWeekendTypes, selector: ".weekend-route-area", headerIndex: 2 }
    ];

    const allWidths = {};
    let globalMaxHeaderWidth = 0;

    dayConfigs.forEach(config => {
        const header = categoryHeaderInner.children[config.headerIndex];
        if (!header || config.types.length === 0) return;

        config.types.forEach(type => {
            const typeHeader = Array.from(header.querySelectorAll(".day-type-header"))
                .find(element => element.dataset.type === type);
            if (!typeHeader) return;
            const headerWidth = Math.ceil(typeHeader.scrollWidth);
            if (headerWidth > globalMaxHeaderWidth) globalMaxHeaderWidth = headerWidth;
        });
    });

    dayConfigs.forEach(config => {
        allWidths[config.day] = config.types.map(type =>
            config.visibleTypes.includes(type) ? globalMaxHeaderWidth : 0
        );
    });

    syncedCategoryColumnWidths = allWidths;

    document.querySelectorAll(".weekday-route-area").forEach(area => {
        const widths = allWidths["평일"];
        area.style.gridTemplateColumns = widths.map(width => width + "px").join(" ");
        area.style.width = widths.reduce((sum, width) => sum + width, 0) + "px";
        area.style.minWidth = area.style.width;

        area.querySelectorAll(".route-type-cell").forEach(cell => {
            const visible = visibleWeekdayTypes.includes(cell.dataset.type);
            cell.style.display = "flex";
            cell.style.overflow = "hidden";
            cell.style.padding = visible ? "3px 6px" : "0";
            cell.querySelectorAll(".route-variant").forEach(item => {
                item.style.display = visible ? "inline-flex" : "none";
            });
        });
    });

    document.querySelectorAll(".weekend-route-area").forEach(area => {
        const widths = allWidths["주말"];
        area.style.gridTemplateColumns = widths.map(width => width + "px").join(" ");
        area.style.width = widths.reduce((sum, width) => sum + width, 0) + "px";
        area.style.minWidth = area.style.width;

        area.querySelectorAll(".route-type-cell").forEach((cell, index) => {
            const visible = visibleWeekendTypes.includes(cell.dataset.type);
            cell.style.display = "flex";
            cell.style.overflow = "hidden";
            cell.style.padding = visible ? "3px 6px" : "0";
            cell.querySelectorAll(".route-variant").forEach(item => {
                item.style.display = visible ? "inline-flex" : "none";
            });
        });
    });

    const headers = categoryHeaderInner.children;
    const weekdayHeader = headers[1];
    const weekendHeader = headers[2];

    if (weekdayHeader) {
        const widths = allWidths["평일"];
        weekdayHeader.style.display = widths.length > 0 ? "grid" : "none";
        weekdayHeader.style.gridTemplateColumns = widths.map(width => width + "px").join(" ");
        weekdayHeader.style.width = widths.reduce((sum, width) => sum + width, 0) + "px";
        weekdayHeader.style.minWidth = weekdayHeader.style.width;
        weekdayHeader.querySelectorAll(".day-type-header").forEach(header => {
    const visible = visibleWeekdayTypes.includes(header.dataset.type);

    header.style.display = "block";
    header.style.padding = visible ? "0 2px" : "0";
});
    }

    if (weekendHeader) {
        const widths = allWidths["주말"];
        weekendHeader.style.display = widths.length > 0 ? "grid" : "none";
        weekendHeader.style.gridTemplateColumns = widths.map(width => width + "px").join(" ");
        weekendHeader.style.width = widths.reduce((sum, width) => sum + width, 0) + "px";
        weekendHeader.style.minWidth = weekendHeader.style.width;
        weekendHeader.querySelectorAll(".day-type-header").forEach(header => {
    const visible = visibleWeekendTypes.includes(header.dataset.type);

    header.style.display = "block";
    header.style.padding = visible ? "0 2px" : "0";
});
    }

    const weekdayWidth = allWidths["평일"].reduce((sum, width) => sum + width, 0);
    const weekendWidth = allWidths["주말"].reduce((sum, width) => sum + width, 0);

    document.querySelectorAll(".route-row").forEach(row => {
        row.style.gridTemplateColumns = `${routeNameWidth}px ${weekdayWidth}px ${weekendWidth}px`;
    });

    categoryHeaderInner.style.gridTemplateColumns = `${routeNameWidth}px ${weekdayWidth}px ${weekendWidth}px`;

    requestAnimationFrame(() => {updateVerticalColumnLines();});
}


// ======================================
// 세로선 관리
// ======================================

let verticalColumnLineLayer = null;
let verticalColumnHeaderLineLayer = null;
let verticalWeekendBoundaryHeaderLine = null;

function updateVerticalColumnLines() {
    if (!routeList || !categoryHeader || !categoryHeaderInner) return;

    if (verticalColumnLineLayer) {
        verticalColumnLineLayer.remove();
        verticalColumnLineLayer = null;
    }
    if (verticalColumnHeaderLineLayer) {
        verticalColumnHeaderLineLayer.remove();
        verticalColumnHeaderLineLayer = null;
    }
    if (verticalWeekendBoundaryHeaderLine) {
        verticalWeekendBoundaryHeaderLine.remove();
        verticalWeekendBoundaryHeaderLine = null;
    }

    const weekdayHeader = categoryHeaderInner.children[1];
    const weekendHeader = categoryHeaderInner.children[2];
    const weekdayWidths = syncedCategoryColumnWidths["평일"] || [];
    const weekendWidths = syncedCategoryColumnWidths["주말"] || [];

    const linePositions = [];
    let currentX = routeNameWidth;
    linePositions.push(currentX);
    let weekdayWeekendBoundary = null;

    const weekdayWidth = weekdayWidths.reduce((sum, width) => sum + width, 0);
const weekendWidth = weekendWidths.reduce((sum, width) => sum + width, 0);

if (weekdayHeader && weekdayWidth > 0) {
    weekdayWidths.forEach(width => {
        if (width <= 0) return;

        currentX += width;
        linePositions.push(currentX);
    });

    weekdayWeekendBoundary = currentX;
}

if (weekendHeader && weekendWidth > 0) {
    weekendWidths.forEach(width => {
        if (width <= 0) return;

        currentX += width;
        linePositions.push(currentX);
    });
}

    const uniquePositions = [...new Set(linePositions.map(value => Math.round(value)))];

    let typeRowStartY = null;
    const firstTypeHeader = categoryHeader.querySelector(".day-type-header");
    if (firstTypeHeader) {
        const routeListRect = routeList.getBoundingClientRect();
        const typeHeaderRect = firstTypeHeader.getBoundingClientRect();
        typeRowStartY = Math.round(typeHeaderRect.top - routeListRect.top);
        updateColumnTogglePosition();
    }
    if (typeRowStartY === null) {
        typeRowStartY = categoryHeader.offsetHeight;
    }

    const routeListBottom = Math.max(routeList.scrollHeight, routeList.getBoundingClientRect().height);
    const totalRouteHeight = Math.max(routeListBottom - typeRowStartY, 0);

    verticalColumnLineLayer = document.createElement("div");
    verticalColumnLineLayer.className = "vertical-column-line-layer";
    verticalColumnLineLayer.style.position = "absolute";
    verticalColumnLineLayer.style.left = "0px";
    verticalColumnLineLayer.style.top = typeRowStartY + "px";
    verticalColumnLineLayer.style.width = "0px";
    verticalColumnLineLayer.style.height = totalRouteHeight + "px";
    verticalColumnLineLayer.style.pointerEvents = "none";
    verticalColumnLineLayer.style.zIndex = "5001";

    uniquePositions.forEach(position => {
        const line = document.createElement("div");
        line.className = "vertical-column-line";
        line.style.position = "absolute";
        line.style.left = position + "px";
        line.style.top = "0px";
        line.style.width = "1px";
        line.style.height = totalRouteHeight + "px";
        line.style.opacity = "1";
        line.style.pointerEvents = "none";
        line.style.margin = "0";
        line.style.padding = "0";
        line.style.border = "0";
        line.style.boxSizing = "border-box";

        if (weekdayWeekendBoundary !== null && Math.round(position) === Math.round(weekdayWeekendBoundary)) {
            line.style.width = "1px";
            line.style.background = "#c8c8c8";
        }

        verticalColumnLineLayer.appendChild(line);
    });

    verticalColumnHeaderLineLayer = document.createElement("div");
    verticalColumnHeaderLineLayer.style.position = "absolute";
    verticalColumnHeaderLineLayer.style.left = "0px";
    verticalColumnHeaderLineLayer.style.top = "0px";
    verticalColumnHeaderLineLayer.style.width = "0px";
    verticalColumnHeaderLineLayer.style.height = categoryHeader.offsetHeight + "px";
    verticalColumnHeaderLineLayer.style.pointerEvents = "none";
    verticalColumnHeaderLineLayer.style.zIndex = "5002";

const headerRect = categoryHeader.getBoundingClientRect();
    const typeRect = firstTypeHeader ? firstTypeHeader.getBoundingClientRect() : null;
    const typeTop = typeRect ? Math.round(typeRect.top - headerRect.top) : 0;
const typeHeight = categoryHeader.offsetHeight - typeTop;

    uniquePositions.forEach(position => {
        if (weekdayWeekendBoundary !== null && Math.round(position) === Math.round(weekdayWeekendBoundary)) return;

        const hLine = document.createElement("div");
        hLine.className = "vertical-column-header-line";
        hLine.style.left = position + "px";
        hLine.style.top = typeTop + "px";
        hLine.style.height = typeHeight + "px";
        verticalColumnHeaderLineLayer.appendChild(hLine);
    });

    categoryHeader.appendChild(verticalColumnHeaderLineLayer);

    if (weekdayWeekendBoundary !== null) {
        const weekendBoundaryHeaderLine = document.createElement("div");
        weekendBoundaryHeaderLine.className = "vertical-weekend-boundary-header-line";
        weekendBoundaryHeaderLine.style.left = Math.round(weekdayWeekendBoundary) + "px";
        weekendBoundaryHeaderLine.style.height = (categoryHeader.offsetHeight + 1) + "px";

        verticalWeekendBoundaryHeaderLine = weekendBoundaryHeaderLine;
        categoryHeader.appendChild(verticalWeekendBoundaryHeaderLine);
    }

    routeList.appendChild(verticalColumnLineLayer);
}


// ======================================
// PC 패널 크기 자동 조절
// ======================================

let panelManualWidth = false;

function autoResizeControlPanel(contentWidthOverride = null) {
    if (panelManualWidth) {
        clampManualPanelWidth();
        updatePanelTogglePosition();
        return;
    }

    const panel = document.getElementById("control-panel");
    const panelContent = document.querySelector(".panel-content");
    const header = document.getElementById("route-category-header");
    if (!panel || !panelContent || !header) return;

    const panelStyle = getComputedStyle(panel);
    const paddingLeft = parseFloat(panelStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(panelStyle.paddingRight) || 0;

    // 패널의 실제 좌측 시작 위치 (닫힘 transform 상태에서도 10px/20px 유지)
    const mobile = window.matchMedia("(max-width: 600px)").matches;
    const panelLeft = mobile ? 10 : 20;

    
    const contentWidth =
        contentWidthOverride !== null
            ? contentWidthOverride
            : panelContent.scrollWidth;

    const scrollbarWidth = panelContent.offsetWidth - panelContent.clientWidth;
    const requiredWidth =
        contentWidth + paddingLeft + paddingRight + scrollbarWidth;

    const toggleButtonReserve = 65; // ✕ 버튼(42px) + 여백 확보

    // [코드 상의 실제 최대 넓이]: 화면 전체 너비 - 패널 시작 위치 - 버튼 여백(65px)
    const screenLimitWidth = Math.max(window.innerWidth - panelLeft - paddingRight - toggleButtonReserve, 0);

    // 열이 아무리 넓어져도 screenLimitWidth(최대 넓이)를 초과하지 않음
    const finalWidth = Math.min(requiredWidth, screenLimitWidth);
    panel.dataset.maxWidth = finalWidth;

    panel.style.width = finalWidth + "px";
    panelContent.style.maxWidth = "100%";

    updatePanelTogglePosition();
}

// ======================================
// 검색 기능
// ======================================

function applyRouteSearch(keyword) {
    keyword = String(keyword ?? "").trim().toLowerCase();
    const keywords = keyword.split(/\s+/).filter(Boolean);

    document.querySelectorAll(".route-row").forEach(row => {
        const baseName = (row.dataset.baseName || "").toLowerCase();
        const match = keywords.length === 0 || keywords.every(kw => baseName.includes(kw));
        row.style.display = match ? "grid" : "none";
    });

    document.querySelectorAll(".route-table-wrapper").forEach(wrapper => {
        const visibleRows = Array.from(wrapper.querySelectorAll(".route-row"))
            .filter(row => row.style.display !== "none");
        const title = wrapper.previousElementSibling;

        if (visibleRows.length > 0) {
            wrapper.style.display = "block";
            if (title) title.style.display = "flex";
        } else {
            wrapper.style.display = "none";
            if (title) title.style.display = "none";
        }
    });

    requestAnimationFrame(() => {
        updateVerticalColumnLines();
        updateAllCheckboxHierarchy();
    });
}

searchBox.addEventListener("input", function () {
    if (searchLocked) return;
    applyRouteSearch(searchBox.value.trim().toLowerCase());
});

searchBtn.onclick = function (e) {
    if (e) e.preventDefault();
    const keyword = searchBox.value.trim().toLowerCase();
    if (keyword === "") {
        searchLocked = false;
        lockedKeyword = "";
        applyRouteSearch("");
        return;
    }
    searchLocked = true;
    lockedKeyword = keyword;
    applyRouteSearch(lockedKeyword);
};

searchBox.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    searchBtn.click();
});


// ======================================
// 지도 범위 이동
// ======================================

const bounds = L.latLngBounds();
routeInfo.forEach(data => {
    data.layer.eachLayer(layer => {
        if (layer.getBounds) {
            bounds.extend(layer.getBounds());
        }
    });
});
if (bounds.isValid()) map.fitBounds(bounds);


// ======================================
// 패널 토글 및 정류장 레이어
// ======================================

// [추가] 정중앙에 완벽히 정렬되는 SVG 아이콘 2개 정의
const ICON_HAMBURGER = `
<svg viewBox="0 0 24 24" fill="none" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
</svg>`;

const ICON_CLOSE = `
<svg viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>`;

const panelToggle = document.getElementById("panel-toggle");
const panel = document.getElementById("control-panel");
panel.classList.remove("hidden");

// [변경] 글자 대신 SVG 아이콘 삽입
panelToggle.innerHTML = ICON_CLOSE;
panelToggle.classList.add("open");

panelToggle.onclick = function () {
    panel.classList.toggle("hidden");
    const isHidden = panel.classList.contains("hidden");
panelToggle.setAttribute("aria-expanded", String(!isHidden));
    
    // [변경] textContent 대신 innerHTML로 햄버거/닫기 아이콘 교체
    panelToggle.innerHTML = isHidden ? ICON_HAMBURGER : ICON_CLOSE;
    panelToggle.classList.toggle("open", !isHidden);

    updatePanelTogglePosition();

    setTimeout(() => {
        map.invalidateSize();
        syncCategoryColumnWidths();
        autoResizeControlPanel();
        updateVerticalColumnLines();
        updatePanelTogglePosition();
        updatePanelResizeHandlePosition();
    }, 300);
};
const stopLayer = L.geoJSON(stopGeojson, {
    pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: busStopIcon });
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties["정류장명"]);
    }
});
stopLayer.addTo(map);

if (typeof endStopGeojson !== "undefined") {
    const endStopLayer = L.geoJSON(endStopGeojson, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, { 
                icon: endStopIcon,
                zIndexOffset: 1000 // ★ 노란색 마커보다 무조건 화면 앞쪽 렌더링
            });
        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup(feature.properties["정류장명"]);
        }
    });
    endStopLayer.addTo(map);
}


// ======================================
// 패널 위치 및 수동 리사이즈 핸들
// ======================================

function updatePanelTogglePosition() {
    const panel = document.getElementById("control-panel");
    const panelToggle = document.getElementById("panel-toggle");
    if (!panel || !panelToggle) return;

    if (panel.classList.contains("hidden")) {
     const mobile = window.matchMedia("(max-width: 600px)").matches;
     panelToggle.style.left = (mobile ? 10 : 20) + "px";
        return;
    }
    const rect = panel.getBoundingClientRect();
    const maxLeft = window.innerWidth - 65;
    panelToggle.style.left = Math.min(rect.right + 5, maxLeft) + "px";
}

function clampManualPanelWidth() {
    const panel = document.getElementById("control-panel");
    if (!panel) return;

    const mobile = window.matchMedia("(max-width: 600px)").matches;
    const rect = panel.getBoundingClientRect();
    let minWidth = mobile ? 240 : 300;

    const panelStyle = getComputedStyle(panel);
    const paddingLeft = parseFloat(panelStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(panelStyle.paddingRight) || 0;

    const screenLimitWidth = window.innerWidth - panel.getBoundingClientRect().left - 55;

    const autoMaxWidth = parseFloat(panel.dataset.maxWidth);

let maxWidth = Number.isFinite(autoMaxWidth)
    ? autoMaxWidth
    : Math.min(contentWidth + paddingLeft + paddingRight, screenLimitWidth);
    let width = parseFloat(panel.style.width);
    if (!Number.isFinite(width)) width = rect.width;

    width = Math.max(minWidth, Math.min(width, maxWidth));
    panel.style.width = width + "px";
    updatePanelTogglePosition();
}

function updateColumnTogglePosition() {
    const wrapper = document.getElementById("column-toggle-wrapper");
    const categoryHeader = document.getElementById("route-category-header");
    const firstTypeHeader = document.querySelector("#route-category-header .day-type-header");
    if (!wrapper || !categoryHeader || !firstTypeHeader) return;

    const categoryHeaderRect = categoryHeader.getBoundingClientRect();
    const typeHeaderRect = firstTypeHeader.getBoundingClientRect();

    wrapper.style.left = "0px";
    wrapper.style.top = Math.round(typeHeaderRect.top - categoryHeaderRect.top - 13) + "px";
}

function updatePanelResizeHandlePosition() {
    const panel = document.getElementById("control-panel");
    const panelContent = document.querySelector(".panel-content");
    if (!panel || !panelContent) return;

    const handle = document.getElementById("panel-resize-handle");
    if (!handle) return;

    const mobile = window.matchMedia("(max-width: 600px)").matches;
    if (panel.classList.contains("hidden")) {
        handle.style.display = "none";
        return;
    }
    handle.style.display = "block";

    if (mobile) {
        const contentRect = panelContent.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        handle.style.left = (contentRect.right - panelRect.left + 2) + "px";
        handle.style.right = "auto";
        handle.style.top = "0px";
        handle.style.bottom = "0px";
    } else {
        handle.style.left = "auto";
        handle.style.right = "-6px";
        handle.style.top = "0px";
        handle.style.bottom = "0px";
    }
}

function initPanelResize() {
    const panel = document.getElementById("control-panel");
    const panelContent = document.querySelector(".panel-content");
    if (!panel || !panelContent) return;
    if (document.getElementById("panel-resize-handle")) return;

    const handle = document.createElement("div");
    handle.id = "panel-resize-handle";
    handle.style.position = "absolute";
    handle.style.width = "12px";
    handle.style.cursor = "ew-resize";
    handle.style.touchAction = "none";
    handle.style.userSelect = "none";
    handle.style.webkitUserSelect = "none";
    handle.style.zIndex = "3000";
    handle.style.background = "transparent";
    handle.style.border = "0";
    handle.style.padding = "0";
    panel.appendChild(handle);

    let resizing = false;
    let startX = 0;
    let startWidth = 0;

    const startResize = function (e) {
        const mobile = window.matchMedia("(max-width: 600px)").matches;
        if (!mobile && e.button !== undefined && e.button !== 0) return;
        if (panel.classList.contains("hidden")) return;

        resizing = true;
        panelManualWidth = true;
        const point = e.touches && e.touches.length > 0 ? e.touches[0] : e;
        startX = point.clientX;
        startWidth = panel.getBoundingClientRect().width;

        if (e.pointerId !== undefined) {
            handle.setPointerCapture(e.pointerId);
        }
        e.preventDefault();
    };

    const moveResize = function (e) {
        if (!resizing) return;
        const point = e.touches && e.touches.length > 0 ? e.touches[0] : e;
        const deltaX = point.clientX - startX;
        const mobile = window.matchMedia("(max-width: 600px)").matches;
        const minWidth = mobile ? 240 : 300;

        const panelStyle = getComputedStyle(panel);
        const paddingLeft = parseFloat(panelStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(panelStyle.paddingRight) || 0;
        const contentWidth =
            routeNameWidth +
            syncedCategoryColumnWidths["평일"].reduce((sum, width) => sum + width, 0) +
            syncedCategoryColumnWidths["주말"].reduce((sum, width) => sum + width, 0);

const screenLimitWidth = window.innerWidth - panel.getBoundingClientRect().left - 65;

const autoMaxWidth = parseFloat(panel.dataset.maxWidth);
let maxWidth = Number.isFinite(autoMaxWidth) ? autoMaxWidth : screenLimitWidth;

        let newWidth = Math.max(minWidth, Math.min(startWidth + deltaX, maxWidth));

        panel.style.width = newWidth + "px";
        updatePanelTogglePosition();
        updatePanelResizeHandlePosition();
    };

    const endResize = function (e) {
        if (!resizing) return;
        resizing = false;

        if (e.pointerId !== undefined) {
            try { handle.releasePointerCapture(e.pointerId); } catch (error) {}
        }

        panelManualWidth = true;
        clampManualPanelWidth();
        updatePanelTogglePosition();
        updatePanelResizeHandlePosition();
    };

    handle.addEventListener("pointerdown", startResize);
    handle.addEventListener("pointermove", moveResize);
    handle.addEventListener("pointerup", endResize);
    handle.addEventListener("pointercancel", endResize);
    updatePanelResizeHandlePosition();
}


// ======================================
// 초기화 및 리사이즈 이벤트
// ======================================

initPanelResize();
applyRouteNameWidth();

requestAnimationFrame(() => {
    syncCategoryColumnWidths();
    autoResizeControlPanel();
    updateVerticalColumnLines();
    updateAllCheckboxHierarchy();
});

let resizeTimer = null;
window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        applyRouteNameWidth();
        requestAnimationFrame(() => {
            syncCategoryColumnWidths();
            autoResizeControlPanel();
            updateVerticalColumnLines();
            updatePanelResizeHandlePosition();
        });
    }, 100);
});

setTimeout(() => {
    applyRouteNameWidth();
    syncCategoryColumnWidths();
    autoResizeControlPanel();
    updatePanelTogglePosition();
    updatePanelResizeHandlePosition();
    updateVerticalColumnLines();
    updateAllCheckboxHierarchy();
}, 100);

setTimeout(() => {
    applyRouteNameWidth();
    syncCategoryColumnWidths();
    autoResizeControlPanel();
    updateVerticalColumnLines();
    updatePanelTogglePosition();
    updatePanelResizeHandlePosition();
    updateAllCheckboxHierarchy();
}, 500);


// ======================================
// 1. 노선(400)보다 아래인 전용 바닥 층 생성
// ======================================
if (!map.getPane('baseStopPane')) {
    map.createPane('baseStopPane');
    map.getPane('baseStopPane').style.zIndex = 350; // 노선 선 아래 바닥
}

// ======================================
// 2. 배경 정류장
// ======================================

const BASE_STOP_MIN_ZOOM = 15;

let baseStopLayer = L.layerGroup();
let baseStopInitialized = false;
let baseStopIconSize = null;


// ======================================
// 실제 배경 정류장 레이어 생성
// ======================================

function createBaseStopLayer() {

    if (baseStopInitialized) {
 return;
    }

    if (typeof baseStopGeojson === "undefined") {
        return;
    }

    baseStopLayer = L.geoJSON(baseStopGeojson, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: baseStopIcon(map.getZoom()),
                pane: "baseStopPane"
            });
        },

        onEachFeature: function (feature, layer) {
            const name =
                feature.properties["정류장명"] ||
                feature.properties["정류소명"] ||
                "정류장";
            layer.bindPopup(`<b>${name}</b>`);
        }
    });
    baseStopInitialized = true;
}


// ======================================
// 배경 정류장 표시 / 숨김
// ======================================

function updateBaseStopVisibility() {
    const zoom = map.getZoom();

    // --------------------------------------
    // 14 이하
    // 실제 마커 레이어를 지도에서 제거
    // --------------------------------------

    if (zoom < BASE_STOP_MIN_ZOOM) {
        if (map.hasLayer(baseStopLayer)) {
            map.removeLayer(baseStopLayer);
        }
        baseStopIconSize = null;
        return;
    }

    // --------------------------------------
    // 15 이상
    // 처음 필요해질 때만 마커 생성
    // --------------------------------------

    createBaseStopLayer();
    if (!baseStopInitialized) {
        return;
    }

    // --------------------------------------
    // 레이어를 지도에 표시
    // --------------------------------------

    if (!map.hasLayer(baseStopLayer)) {
        map.addLayer(baseStopLayer);
    }

    // --------------------------------------
    // 현재 줌에 맞는 아이콘 크기 계산
    // --------------------------------------

    const newSize = zoom <= 15 ? 14 : 18;

    // --------------------------------------
    // 실제 크기가 바뀐 경우에만
    // 모든 마커 아이콘을 다시 변경
    // --------------------------------------

    if (baseStopIconSize !== newSize) {
        const updatedIcon = baseStopIcon(zoom);
        baseStopLayer.eachLayer(
            function (layer) {
                if (layer.setIcon) {
                    layer.setIcon(updatedIcon);
                }
            }
        );
        baseStopIconSize = newSize;
    }
}


// ======================================
// 초기 상태 + 줌 변경
// ======================================

if (typeof baseStopGeojson !== "undefined") {
    updateBaseStopVisibility();
    map.on("zoomend", updateBaseStopVisibility);
}