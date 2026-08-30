let latestToken = null;
let latestUserId = null;
let isDownloading = false;
const CORS_RULE_ID = 1;

// Setup declarativeNetRequest rules to bypass CORS restrictions for api.stryd.com
async function setupCorsRules() {
    try {
        if (!chrome.declarativeNetRequest) return;
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [CORS_RULE_ID],
            addRules: [
                {
                    id: CORS_RULE_ID,
                    priority: 1,
                    action: {
                        type: "modifyHeaders",
                        requestHeaders: [
                            { header: "Origin", operation: "set", value: "https://www.stryd.com" }
                        ],
                        responseHeaders: [
                            { header: "Access-Control-Allow-Origin", operation: "set", value: "*" },
                            { header: "Access-Control-Allow-Methods", operation: "set", value: "GET, POST, PUT, DELETE, OPTIONS, HEAD" },
                            { header: "Access-Control-Allow-Headers", operation: "set", value: "*" }
                        ]
                    },
                    condition: {
                        urlFilter: "||api.stryd.com/*",
                        resourceTypes: ["xmlhttprequest", "other"]
                    }
                }
            ]
        });
    } catch (err) {
        console.warn("Failed to configure declarativeNetRequest CORS rules:", err);
    }
}

// Ensure rules are initialized on script startup and install
setupCorsRules();
chrome.runtime.onInstalled?.addListener(setupCorsRules);
chrome.runtime.onStartup?.addListener(setupCorsRules);

// Extract athlete/user ID from URL paths like /athletes/{userId} or /users/{userId}
function extractUserId(url) {
    if (!url) return null;
    const match = url.match(/(?:athletes|users)\/([a-f0-9-]+)/i);
    return match ? match[1] : null;
}

// Construct target user endpoint URL dynamically
function getUserDataUrl(userId) {
    return `https://api.stryd.com/b/api/v1/users/${userId}`;
}

// Construct target PDC endpoint URL dynamically
function getTargetDataUrl(userId) {
    return `https://api.stryd.com/b/api/v1/users/${userId}/pdc?include_breakdown=1`;
}

// Get current date in YYYY-MM-DD format
function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Fetch user profile data to extract username and critical power
async function fetchUserData(token, userId, tabId) {
    await setupCorsRules();
    try {
        const response = await fetch(getUserDataUrl(userId), {
            method: "GET",
            headers: {
                "Authorization": token,
                "Accept": "application/json"
            }
        });

        if (response.ok) {
            return await response.json();
        }
        console.warn(`Direct fetch failed with status: ${response.status} ${response.statusText}`);
    } catch (error) {
        console.warn("Direct fetch for user data encountered error:", error);
    }

    // Fallback: If tabId is available on a Stryd page, execute fetch inside page context
    if (tabId && chrome.scripting) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: async (url, authToken) => {
                    try {
                        const res = await fetch(url, {
                            method: "GET",
                            headers: {
                                "Authorization": authToken,
                                "Accept": "application/json"
                            }
                        });
                        return res.ok ? await res.json() : null;
                    } catch (e) {
                        return null;
                    }
                },
                args: [getUserDataUrl(userId), token]
            });

            if (results && results[0] && results[0].result) {
                return results[0].result;
            }
        } catch (scriptError) {
            console.warn("Scripting fallback for user data failed:", scriptError);
        }
    }

    return null;
}

// Listen to outgoing headers to capture and store the Bearer token and user ID from requests
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        const authHeader = details.requestHeaders?.find(
            (header) => header.name.toLowerCase() === 'authorization'
        );

        if (authHeader && authHeader.value) {
            latestToken = authHeader.value;
            chrome.storage.local.set({ authToken: authHeader.value });
        }

        const idFromUrl = extractUserId(details.url);
        if (idFromUrl) {
            latestUserId = idFromUrl;
            chrome.storage.local.set({ userId: idFromUrl });
        }
    },
    { urls: ["https://stryd.com/*", "https://www.stryd.com/*", "https://api.stryd.com/*"] },
    ["requestHeaders"]
);

// Trigger download when the extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
    if (isDownloading) return;

    let token = latestToken;
    let userId = latestUserId;

    // Try extracting the user ID from the active tab URL if available
    if (tab?.url) {
        const idFromTab = extractUserId(tab.url);
        if (idFromTab) {
            userId = idFromTab;
            latestUserId = idFromTab;
            chrome.storage.local.set({ userId: idFromTab });
        }
    }

    // Retrieve from storage if not already cached in memory
    if (!token || !userId) {
        const stored = await chrome.storage.local.get(["authToken", "userId"]);
        if (!token) token = stored.authToken;
        if (!userId) userId = stored.userId;
    }

    if (!token) {
        console.warn("No Stryd authorization token found yet. Please browse or refresh stryd.com first.");
        return;
    }

    if (!userId) {
        console.warn("No Stryd user ID found yet. Please navigate to your Stryd profile page (e.g., https://www.stryd.com/powercenter/athletes/.../profile).");
        return;
    }

    isDownloading = true;
    fetchPowerData(token, userId, tab?.id);
});

// Fetch the data and trigger a browser download
async function fetchPowerData(token, userId, tabId) {
    try {
        let filename = "stryd_power_data.json";
        const dateStr = getFormattedDate();

        // Fetch user data to format the filename
        const userData = await fetchUserData(token, userId, tabId);
        console.log("User data:", userData);
        if (userData) {
            const rawUserName = userData.user_name || "user";
            const userName = rawUserName.replace(/[/\\?%*:|"<>]/g, '_');
            const rawCp = userData.training_info?.critical_power;
            const cpStr = (rawCp !== undefined && rawCp !== null && !isNaN(rawCp))
                ? `CP${Math.round(Number(rawCp))}`
                : "CP";

            filename = `stryd_${userName}_${cpStr}_${dateStr}.json`;
        } else {
            filename = `stryd_user_${dateStr}_data.json`;
        }

        const targetUrl = getTargetDataUrl(userId);
        chrome.downloads.download({
            url: targetUrl,
            filename: filename,
            headers: [
                { name: "Authorization", value: token },
                { name: "Accept", value: "application/json" }
            ],
            saveAs: true
        }, (downloadId) => {
            isDownloading = false;
            if (chrome.runtime.lastError) {
                console.error("Download failed:", chrome.runtime.lastError.message);
            }
        });
    } catch (error) {
        console.error("Extraction failed:", error);
        isDownloading = false;
    }
}
