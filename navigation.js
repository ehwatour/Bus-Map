// ==================================================
// navigation.js : 비밀번호 보안, 실시간 GPS 네비, 화면 꺼짐 방지, HUD
// ==========================================================

(function () {
    // --------------------------------------------------
    // 설정값 (원하는 값으로 수정 가능)
    // --------------------------------------------------
    const CONFIG = {
        PASSWORD: "88",          // ★ 접속 비밀번호 (원하는 번호로 변경)
        AUTH_DAYS: 7,              // 한 번 인증 후 비밀번호 면제 기간 (일)
        DEFAULT_NAVI_ZOOM: 18      // 네비 시작 시 확대 배율 (16~17 추천)
    };

    const AUTH_STORAGE_KEY = "shuttle_bus_auth_timestamp";

    // --------------------------------------------------
    // 1. 비밀번호 잠금화면 주입 및 검증
    // --------------------------------------------------
    function initPasswordSecurity() {
        const savedTime = localStorage.getItem(AUTH_STORAGE_KEY);
        const now = Date.now();
        const maxAge = CONFIG.AUTH_DAYS * 24 * 60 * 60 * 1000;

        // 이미 최근에 로그인한 기기면 건너뜀
        if (savedTime && (now - Number(savedTime) < maxAge)) {
            return;
        }

        const overlay = document.createElement("div");
        overlay.id = "navi-lock-overlay";
        overlay.innerHTML = `
            <div class="navi-lock-card">
                <h3 class="navi-lock-title">🔒 사내 셔틀버스 노선</h3>
                <p class="navi-lock-desc">비밀번호를 입력해야 노선이 표시됩니다.</p>
                <input type="password" id="navi-lock-input" placeholder="비밀번호 입력" autocomplete="off" />
                <button type="button" id="navi-lock-btn">확인</button>
                <div id="navi-lock-error">비밀번호가 일치하지 않습니다.</div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = overlay.querySelector("#navi-lock-input");
        const btn = overlay.querySelector("#navi-lock-btn");
        const err = overlay.querySelector("#navi-lock-error");

        function verify() {
            if (input.value === CONFIG.PASSWORD) {
                localStorage.setItem(AUTH_STORAGE_KEY, Date.now());
                overlay.remove();
            } else {
                err.style.display = "block";
                input.value = "";
                input.focus();
            }
        }

        btn.addEventListener("click", verify);
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") verify();
        });
        setTimeout(() => input.focus(), 200);
    }

    // --------------------------------------------------
    // 2. 화면 UI 생성 (HUD 바 + 우측 하단 네비 버튼들)
    // --------------------------------------------------
    function createNavigationUI() {
        // 상단 안내 HUD
        const hud = document.createElement("div");
        hud.id = "navi-hud-bar";
        hud.innerHTML = `
            <span>📍 다음: <span class="navi-hud-name" id="hud-stop-name">계산 중...</span></span>
            <span class="navi-hud-dist" id="hud-stop-dist">-- m</span>
        `;
        document.body.appendChild(hud);

        // 우측 하단 플로팅 버튼들 (GPS, 확대, 축소)
        const controls = document.createElement("div");
        controls.id = "navi-floating-controls";
        controls.innerHTML = `
            <button class="navi-btn" id="navi-btn-gps" title="내 위치 추적">📍</button>
            <button class="navi-btn" id="navi-btn-zoom-in" title="확대">＋</button>
            <button class="navi-btn" id="navi-btn-zoom-out" title="축소">－</button>
        `;
        document.body.appendChild(controls);
    }

    // --------------------------------------------------
    // 3. 지리 계산 유틸 (두 점 사이 거리 m 계산)
    // --------------------------------------------------
    function getDistanceMeters(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }

    // --------------------------------------------------
    // 4. 실시간 네비게이션 & GPS 추적
    // --------------------------------------------------
    let watchId = null;
    let isTracking = false;
    let userMarker = null;
    let userAccuracyCircle = null;
    let wakeLock = null;

    // 운전 중 화면 꺼짐 방지 요청
    async function requestWakeLock() {
        try {
            if ("wakeLock" in navigator) {
                wakeLock = await navigator.wakeLock.request("screen");
            }
        } catch (e) {
            console.warn("Wake Lock 비활성:", e);
        }
    }

    function releaseWakeLock() {
        if (wakeLock) {
            wakeLock.release().catch(() => {});
            wakeLock = null;
        }
    }

    // 가장 가까운 정류장 찾아 HUD에 업데이트
    function updateNearestStopHUD(userLat, userLng) {
        if (typeof stopGeojson === "undefined" || !stopGeojson.features) return;

        let nearestStop = null;
        let minDistance = Infinity;

        stopGeojson.features.forEach(feat => {
            if (!feat.geometry || !feat.geometry.coordinates) return;
            const [lng, lat] = feat.geometry.coordinates;
            const dist = getDistanceMeters(userLat, userLng, lat, lng);
            if (dist < minDistance) {
                minDistance = dist;
                nearestStop = feat.properties["정류장명"] || feat.properties["정류소명"] || "정류장";
            }
        });

        const nameEl = document.getElementById("hud-stop-name");
        const distEl = document.getElementById("hud-stop-dist");
        if (nearestStop && nameEl && distEl) {
            nameEl.textContent = nearestStop;
            distEl.textContent = minDistance >= 1000 
                ? (minDistance / 1000).toFixed(1) + " km" 
                : minDistance + " m";
        }
    }

    function startTracking() {
        if (!navigator.geolocation) {
            alert("이 기기 또는 브라우저는 위치 서비스를 지원하지 않습니다.");
            return;
        }

        const gpsBtn = document.getElementById("navi-btn-gps");
        const hud = document.getElementById("navi-hud-bar");

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
const heading = pos.coords.heading;
if (heading !== null && !isNaN(heading)) {
    const mapContainer = document.getElementById("map");
    // 지도를 내 진행 방향의 반대 각도로 돌려 12시 방향을 전방으로 고정
    mapContainer.style.transform = `rotate(${-heading}deg)`;
    mapContainer.style.transition = "transform 0.4s ease-out";
}
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const accuracy = pos.coords.accuracy;
                const latlng = [lat, lng];

                // 1. 오차 반경 원 표시
                if (!userAccuracyCircle) {
                    userAccuracyCircle = L.circle(latlng, {
                        radius: accuracy,
                        color: "#007aff",
                        fillColor: "#007aff",
                        fillOpacity: 0.12,
                        weight: 1
                    }).addTo(map);
                } else {
                    userAccuracyCircle.setLatLng(latlng);
                    userAccuracyCircle.setRadius(accuracy);
                }

                // [수정 후] 빨간 삼각 네비 화살표 아이콘으로 교체
if (!userMarker) {
    const naviArrowIcon = L.divIcon({
        className: "user-navi-marker-container",
        html: `
            <div class="user-navi-arrow" style="width:28px; height:28px; transition: transform 0.3s ease;">
                <svg viewBox="0 0 24 24" width="28" height="28" style="display:block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
                    <!-- 네비게이션 전용 빨간색 입체 삼각 화살표 -->
                    <path d="M12 2 L22 21 L12 17 L2 21 Z" fill="#ff2a2a" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
                </svg>
            </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14] // 화살표 정중앙을 좌표에 맞춤
    });
    userMarker = L.marker(latlng, { icon: naviArrowIcon, zIndexOffset: 3000 }).addTo(map);
    map.setView(latlng, CONFIG.DEFAULT_NAVI_ZOOM);
    map.panBy([0, 120]);
} else {
                   
                    userMarker.setLatLng(latlng);
                    // 네비게이션: 부드럽게 화면을 내 위치로 계속 이동

// [수정 후]
if (heading !== null && !isNaN(heading)) {
    const markerEl = userMarker.getElement();
    if (markerEl) {
        // 안쪽에 넣어둔 빨간 화살표 엘리먼트만 콕 집어서 회전시킴
        const arrowEl = markerEl.querySelector(".user-navi-arrow");
        if (arrowEl) {
            arrowEl.style.transform = `rotate(${heading}deg)`;
        }
    }
}
                    map.panTo(latlng, { animate: true, duration: 0.8 });
                }

                // 3. 다음 정류장 거리 갱신
                updateNearestStopHUD(lat, lng);
            },
            (err) => {
                console.error("GPS 위치 획득 실패:", err);
                if (err.code === 1) alert("위치 권한을 허용해 주세요.");
                stopTracking();
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 10000
            }
        );

        isTracking = true;
        if (gpsBtn) gpsBtn.classList.add("active");
        if (hud) hud.style.display = "flex";
        requestWakeLock();
    }

    function stopTracking() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        if (userMarker) {
            map.removeLayer(userMarker);
            userMarker = null;
        }
        if (userAccuracyCircle) {
            map.removeLayer(userAccuracyCircle);
            userAccuracyCircle = null;
        }

        const gpsBtn = document.getElementById("navi-btn-gps");
        const hud = document.getElementById("navi-hud-bar");
        if (gpsBtn) gpsBtn.classList.remove("active");
        if (hud) hud.style.display = "none";

        isTracking = false;
        releaseWakeLock();
    }

    // --------------------------------------------------
    // 5. 버튼 이벤트 바인딩
    // --------------------------------------------------
    function bindNavigationEvents() {
        const gpsBtn = document.getElementById("navi-btn-gps");
        const zoomInBtn = document.getElementById("navi-btn-zoom-in");
        const zoomOutBtn = document.getElementById("navi-btn-zoom-out");

        if (gpsBtn) {
            gpsBtn.onclick = () => {
                if (!isTracking) {
                    startTracking();
                } else {
                    // 이미 켜진 상태에서 누르면 화면을 내 위치로 즉시 재정렬
                    if (userMarker) {
                        map.setView(userMarker.getLatLng(), CONFIG.DEFAULT_NAVI_ZOOM);
                    }
                }
            };
        }

        if (zoomInBtn) {
            zoomInBtn.onclick = () => {
                if (typeof map !== "undefined") map.zoomIn();
            };
        }

        if (zoomOutBtn) {
            zoomOutBtn.onclick = () => {
                if (typeof map !== "undefined") map.zoomOut();
            };
        }
    }

    // --------------------------------------------------
    // 초기화 실행
    // --------------------------------------------------
    function init() {
        initPasswordSecurity();
        createNavigationUI();
        bindNavigationEvents();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();