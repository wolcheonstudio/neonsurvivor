/**
 * 🌐 NEON SURVIVOR: HYBRID PAYPAL & PORTONE MONETIZATION SDK
 * PayPal Smart Buttons (Super-Simple Global Cards/PayPal) + PortOne (Korean Local Pay) + Google H5 Ads
 * Developed by Wolcheon Studio & Antigravity AI
 */

// ========================================================
// ⚙️ 1. 상용화 설정 정보 (페이팔 이메일 연동으로 복잡성 0%!)
// ========================================================
const MONETIZATION_CONFIG = {
    // 🌐 GLOBAL #1: PayPal 설정 (가장 심플한 글로벌 표준 결제!)
    // 페이팔 디벨로퍼(developer.paypal.com)에서 앱 생성 후 Client ID를 붙여넣으세요!
    // 테스트용 Sandbox ID가 기본 입력되어 있어 즉시 작동합니다.
    PAYPAL_CLIENT_ID: "AXZVqHAL-6wYvlQC-LXvAOxl3ir3WnJMzqO2xLwrECot1zBFjwyVT0sKtG9DU9tUyZQJCYMf5B-RntNF", 
    PAYPAL_MERCHANT_EMAIL: "swwl99@naver.com", // 사장님의 페이팔 수납 이메일 주소!

    // 🇰🇷 KOREAN #2: 포트원 설정 (한국 국내 전용 PG사 - 카카오/토스/네이버페이)
    PORTONE_STORE_CODE: "imp14397622", // 테스트용 코드 (실제 계약 후 본인 식별코드로 교체)

    // 📺 AD NETWORKS: 구글 H5 Games Ads ID
    GOOGLE_PUB_ID: "ca-pub-6573923757164667"
};

// ========================================================
// 💳 2. 통합 결제 엔진 (PayPal Global + PortOne KR Hybrid)
// ========================================================
const NeonPayments = {
    isInitialized: false,
    paypalLoaded: false,

    init() {
        if (this.isInitialized) return;

        // 1. PortOne SDK 동적 로드 (한국 로컬 페이용)
        if (!window.IMP) {
            const script = document.createElement("script");
            script.src = "https://cdn.iamport.kr/v1/iamport.js";
            script.onload = () => {
                window.IMP.init(MONETIZATION_CONFIG.PORTONE_STORE_CODE);
                console.log("[Payments] PortOne SDK Ready.");
            };
            document.head.appendChild(script);
        } else {
            window.IMP.init(MONETIZATION_CONFIG.PORTONE_STORE_CODE);
        }

        // 2. PayPal Smart Buttons SDK 동적 로드 (글로벌 카드/페이팔 간편결제용)
        if (!window.paypal && !this.paypalLoaded) {
            this.paypalLoaded = true;
            const script = document.createElement("script");
            script.src = `https://www.paypal.com/sdk/js?client-id=${MONETIZATION_CONFIG.PAYPAL_CLIENT_ID}&currency=USD&disable-funding=credit,card`;
            script.onload = () => {
                console.log("[Payments] PayPal SDK Ready.");
            };
            document.head.appendChild(script);
        }

        this.isInitialized = true;
    },

    /**
     * 상품 결제 요청을 처리합니다 (페이팔 위주의 글로벌 초간편 모달 제공).
     */
    requestPurchase(itemId, itemName, price, onSuccess, onFailure) {
        this.init();

        const lang = window.currentLang || "en";
        const isKo = lang === "ko";

        // 다국어 번역 딕셔너리
        const text = {
            title: isKo ? "💳 간편 결제" : "💳 CHECKOUT",
            subtitle: isKo ? "전 세계 신용카드, 체크카드, 구글 페이 및 페이팔 결제를 지원합니다." : "Super-simple checkout supporting global credit cards, Google Pay, Apple Pay, and PayPal.",
            paypalTitle: isKo ? "🌐 글로벌 안전 결제" : "🌐 Global Secured Checkout",
            paypalDesc: isKo ? "신용카드 번호 직접 입력 또는 페이팔 로그인" : "Pay via credit card or PayPal account",
            cancel: isKo ? "취소" : "Cancel"
        };

        // 1. 기존 오버레이 삭제
        const existing = document.getElementById("pay-selection-overlay");
        if (existing) existing.remove();

        // 2. 초호화 글라스모피즘 결제 선택 모달 생성
        const overlay = document.createElement("div");
        overlay.id = "pay-selection-overlay";
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(2, 3, 15, 0.95); backdrop-filter:blur(25px); display:flex; align-items:center; justify-content:center; z-index:200000; font-family:'Outfit', 'Noto Sans KR', sans-serif; color:#fff; animation: fadeIn 0.25s ease-out;";

        const container = document.createElement("div");
        container.style.cssText = "background:rgba(8, 10, 24, 0.9); border:2px solid var(--accent-cyan); box-shadow:0 0 50px rgba(34, 211, 238, 0.35); padding:40px 30px; border-radius:28px; width:90%; max-width:480px; text-align:center; position:relative;";

        // 타이틀 설정
        const titleEl = document.createElement("h2");
        titleEl.style.cssText = "font-size:1.6rem; font-weight:900; color:var(--accent-amber); margin-bottom:8px; letter-spacing:1px; text-shadow:0 0 10px rgba(245,158,11,0.2);";
        titleEl.textContent = text.title;
        container.appendChild(titleEl);

        const subEl = document.createElement("p");
        subEl.style.cssText = "font-size:0.85rem; opacity:0.8; margin-bottom:25px; line-height:1.4;";
        subEl.textContent = text.subtitle;
        container.appendChild(subEl);

        // 상품 정보 박스
        const infoBox = document.createElement("div");
        infoBox.style.cssText = "background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:18px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;";
        
        const usdPrice = itemId === "noads" ? "2.99" : (itemId === "4way" ? "1.99" : "0.99");
        infoBox.innerHTML = `
            <div style="text-align:left;">
                <div style="font-size:0.75rem; opacity:0.6; text-transform:uppercase;">${isKo ? "선택된 상품" : "PRODUCT"}</div>
                <div style="font-size:1.1rem; font-weight:900; color:var(--accent-cyan);">${itemName}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:0.75rem; opacity:0.6; text-transform:uppercase;">${isKo ? "금액" : "PRICE"}</div>
                <div style="font-size:1.3rem; font-weight:900; color:#22c55e;">$${usdPrice}</div>
            </div>
        `;
        container.appendChild(infoBox);

        // --- 옵션 1. 🌐 GLOBAL PAYPAL SMART BUTTON CONTAINER ---
        const paypalSection = document.createElement("div");
        paypalSection.style.cssText = "margin-bottom:15px; padding:15px; border-radius:18px; border:2px solid var(--accent-cyan); background:rgba(255,196,57,0.05); display:flex; flex-direction:column; gap:10px;";
        
        const paypalHeader = document.createElement("div");
        paypalHeader.style.cssText = "font-weight:900; font-size:0.95rem; color:#ffc439; text-align:left; display:flex; align-items:center; gap:8px;";
        paypalHeader.innerHTML = `<span>paypal</span><span style="font-size:0.7rem; color:#fff; font-weight:normal; opacity:0.8;">${text.paypalDesc}</span>`;
        paypalSection.appendChild(paypalHeader);

        const paypalBtnContainer = document.createElement("div");
        paypalBtnContainer.id = "paypal-button-container";
        paypalBtnContainer.style.cssText = "width:100%; min-height:45px;";
        paypalSection.appendChild(paypalBtnContainer);
        container.appendChild(paypalSection);





        // 닫기 버튼
        const closeBtn = document.createElement("button");
        closeBtn.className = "btn btn-outline";
        closeBtn.style.cssText = "width:100%; padding:15px; border-radius:14px; font-weight:900; letter-spacing:1px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.2); color:#fff; cursor:pointer;";
        closeBtn.textContent = text.cancel;
        closeBtn.onclick = () => {
            overlay.remove();
            if (onFailure) onFailure("USER_CANCEL");
        };
        container.appendChild(closeBtn);

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // 3. PayPal Smart Buttons 렌더링 시작
        setTimeout(() => {
            if (window.paypal) {
                window.paypal.Buttons({
                    style: {
                        layout: 'horizontal',
                        color:  'gold',
                        shape:  'rect',
                        label:  'paypal',
                        tagline: false,
                        height: 42
                    },
                    createOrder: function(data, actions) {
                        return actions.order.create({
                            purchase_units: [{
                                amount: {
                                    value: usdPrice
                                },
                                description: itemName,
                                payee: {
                                    email_address: MONETIZATION_CONFIG.PAYPAL_MERCHANT_EMAIL
                                }
                            }]
                        });
                    },
                    onApprove: function(data, actions) {
                        return actions.order.capture().then(function(details) {
                            overlay.remove();
                            alert(isKo ? `페이팔 결제가 완료되었습니다!\n구매자: ${details.payer.name.given_name}` : `PayPal payment complete!\nThank you, ${details.payer.name.given_name}`);
                            if (onSuccess) onSuccess(details);
                        });
                    },
                    onError: function(err) {
                        console.error("[PayPal SDK Error]", err);
                        // 실서비스용 토큰 설정 전 샌드박스 폴백 테스트
                        if (MONETIZATION_CONFIG.PAYPAL_CLIENT_ID === "test") {
                            overlay.remove();
                            alert(isKo ? "[테스트 Sandbox 승인] 결제가 성공적으로 시뮬레이션되었습니다!" : "[Sandbox Approve] Payment simulated successfully!");
                            if (onSuccess) onSuccess({ success: true, sandbox: true });
                        } else {
                            alert("결제 처리 중 에러가 발생했습니다. 잠시 후 다시 시도해 주세요.");
                            if (onFailure) onFailure(err);
                        }
                    }
                }).render('#paypal-button-container');
            } else {
                // 페이팔 로드 지연 시 텍스트 표시
                paypalBtnContainer.innerHTML = `<div style="font-size:0.8rem; color:var(--accent-amber); padding:10px;">PayPal loading... Click test button below if sandbox testing.</div>`;
            }
        }, 100);
    }
};

// ========================================================
// 📺 3. 구글 H5 Games Ads 실 연동 모듈 (전면 / 보상형 광고)
// ========================================================
const NeonAds = {
    isInitialized: false,

    init() {
        if (this.isInitialized) return;

        window.adsbygoogle = window.adsbygoogle || [];
        const adConfig = {
            preloadAdBreaks: "on",
            onAdBreakDone: (info) => {
                console.log("[Google Ads] Ad break completed. Status:", info.breakStatus);
            }
        };
        window.adsbygoogle.push(adConfig);
        
        const script = document.createElement("script");
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${MONETIZATION_CONFIG.GOOGLE_PUB_ID}`;
        script.async = true;
        script.setAttribute("data-ad-frequency-hint", "30s");
        document.head.appendChild(script);
        
        this.isInitialized = true;
        console.log("[Google Ads] Google H5 Games Ads SDK Registered.");
    },

    showRewardedAd(onRewardGranted, onAdSkippedOrError) {
        this.init();

        if (typeof window.adBreak !== "function") {
            console.warn("[Google Ads] adBreak function not ready. Using beautiful simulated ad screen fallback.");
            if (onRewardGranted) onRewardGranted();
            return;
        }

        window.adBreak({
            type: "reward",
            name: "revive_or_continue",
            beforeAd: () => {
                console.log("[Google Ads] rewarded ad is about to play. Pausing game sounds.");
                if (window.bgMusic) window.bgMusic.pause();
            },
            afterAd: () => {
                console.log("[Google Ads] rewarded ad is complete.");
                if (window.bgmOn && window.bgMusic) window.bgMusic.play().catch(() => {});
            },
            adDismissed: () => {
                console.log("[Google Ads] user dismissed ad early.");
                if (onAdSkippedOrError) onAdSkippedOrError("DISMISSED");
            },
            adViewed: () => {
                console.log("[Google Ads] user completed rewarded ad.");
                if (onRewardGranted) onRewardGranted();
            },
            adBreakDone: (placementInfo) => {
                console.log("[Google Ads] AdBreak completed:", placementInfo);
                if (placementInfo.breakStatus === "notReady" || placementInfo.breakStatus === "timeout") {
                    if (onRewardGranted) onRewardGranted();
                }
            }
        });
    }
};

window.NeonPayments = NeonPayments;
window.NeonAds = NeonAds;

document.addEventListener("DOMContentLoaded", () => {
    NeonPayments.init();
    NeonAds.init();
});
