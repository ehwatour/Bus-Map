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
        DEFAULT_NAVI_ZOOM: 16      // 네비 시작 시 확대 배율 (16~17 추천)
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

let map3d = null;
let marker3d = null;
let is3DMode = false;

    let watchId = null;
    let isTracking = false;
    let userMarker = null;
    let userAccuracyCircle = null;
    let wakeLock = null;

    async function requestWakeLock() {
        try {
            if ("wakeLock" in navigator) {
                wakeLock = await navigator.wakeLock.request("screen");
            }
        } catch (e) {}
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
        const map3dEl = document.getElementById("map-3d");
        const exitBtn = document.getElementById("navi-3d-exit-btn");

        // 1. 3D 네비 화면 활성화
        is3DMode = true;
        if (map3dEl) map3dEl.style.display = "block";
        if (exitBtn) exitBtn.style.display = "block";
        if (map3d) map3d.resize();

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const heading = pos.coords.heading;
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                // 2. 3D 지도가 아직 없으면 최초 1회 생성 (OpenFreeMap 무료 3D 벡터 연결)
                if (!map3d) {
                    map3d = new maplibregl.Map({
                        container: 'map-3d',
                        style: 'https://tiles.openfreemap.org/styles/liberty', // 무료 초고속 3D 벡터 지도
                        center: [lng, lat], // MapLibre는 [경도, 위도] 순서
                        zoom: 16,
                        pitch: 50, // ★ 티맵처럼 지도를 50도 앞으로 눕힘!
                        bearing: (heading !== null && !isNaN(heading)) ? heading : 0
                    });

                    // 3D 빨간 화살표 마커 생성 (항상 화면 12시 정면을 봄)
                    const arrowDiv = document.createElement("div");
                    arrowDiv.className = "maplibre-navi-arrow";
                    arrowDiv.innerHTML = `
                        <svg viewBox="0 0 24 24" width="32" height="32">
                            <path d="M12 2 L22 21 L12 17 L2 21 Z" fill="#ff2a2a" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
                        </svg>
                    `;
                    marker3d = new maplibregl.Marker({ element: arrowDiv })
                        .setLngLat([lng, lat])
                        .addTo(map3d);

                    // 3D 지도 위에 기존 버스 노선선 그대로 얹기
                    map3d.on('load', () => {
                        if (typeof routeGeojson !== 'undefined') {
                            map3d.addSource('bus-routes', { type: 'geojson', data: routeGeojson });
                            map3d.addLayer({
                                id: 'bus-routes-line',
                                type: 'line',
                                source: 'bus-routes',
                                paint: {
                                    'line-color': '#1976d2',
                                    'line-width': 6
                                }
                            });
                        }
                    });
                } else {
                    // 3. 주행 중: 카메라를 3D로 실시간 회전시키며 내 차 따라가기 (60fps 무한 회전)
                    map3d.easeTo({
                        center: [lng, lat],
                        bearing: (heading !== null && !isNaN(heading)) ? heading : map3d.getBearing(),
                        pitch: 50,
                        duration: 600,
                        easing: (t) => t
                    });

                    if (marker3d) {
                        marker3d.setLngLat([lng, lat]);
                    }
                }
            },
            (err) => {
                console.error("GPS 위치 획득 실패:", err);
                if (err.code === 1) alert("위치 권한을 허용해 주세요.");
                stopTracking();
            },
            {
                enableHighAccuracy: true,
                maximumAge: 3000,
                timeout: 10000
            }
        );

        isTracking = true;
        if (gpsBtn) gpsBtn.classList.add("active");
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
        if (gpsBtn) gpsBtn.classList.remove("active");

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
        // ★ [이 아래에 3D 종료 이벤트 추가]
        const exitBtn = document.getElementById("navi-3d-exit-btn");
        if (exitBtn) {
            exitBtn.onclick = () => {
                // 3D 화면을 숨겨서 원래의 2D Leaflet 화면으로 복귀
                const map3dEl = document.getElementById("map-3d");
                if (map3dEl) map3dEl.style.display = "none";
                exitBtn.style.display = "none";
                is3DMode = false;
                stopTracking(); // GPS 추적 종료
            };
        }
    }

    // --------------------------------------------------
    // 초기화 실행
    // --------------------------------------------------
    function init() {
       // initPasswordSecurity();
        createNavigationUI();
        bindNavigationEvents();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();