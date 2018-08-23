'use strict';

var sessionTimer = null;
var favIconUrl = null;

chrome.runtime.onInstalled.addListener(function(details) {
    if(details.reason == "install"){
        chrome.storage.sync.set({keepAliveInterval: 9, warningInterval: 13, expireInterval: 15});
    }
});

chrome.webNavigation.onCompleted.addListener(function(e){
    console.log("Loading page " + e.url + " tab ID " + e.tabId);
    chrome.tabs.get(e.tabId, function(tab){
        console.log("Tab Title: " + tab.title)
        if(!tab.title.includes("Login")){
            if(tab.favIconUrl != null){
                favIconUrl = tab.favIconUrl;
            }
            var keepAliveTabIndex = keepAliveTabIds.indexOf(tab.id)
            if(keepAliveTabIndex == -1){
                chrome.storage.sync.get(['keepAliveInterval','warningInterval','expireInterval'], function(result){
                    chrome.notifications.clear("warningNotification");
                    startSessionTimer(result.keepAliveInterval, result.warningInterval, result.expireInterval);
                }); 
            }
            else{
                keepAliveTabIds.splice(keepAliveTabIndex);
            }
        }
        else{
            chrome.browserAction.setBadgeText({text: ""});
            clearInterval(sessionTimer);
        }
    });
},{url: [{hostEquals: 'ebc.cybersource.com'},{hostEquals: 'ebctest.cybersource.com'},{hostEquals: 'businesscenter.cybersource.com'}]});

if(!chrome.notifications.onClicked.hasListeners()){
    console.log("Adding Notification Listener");
    chrome.notifications.onClicked.addListener(function(notificationId, byUser){
        if(notificationId == "warningNotification"){
            duplicatePage();
            chrome.notifications.clear(notificationId);
        }
    });
}

var keepAliveTabIds = [];

function duplicatePage(isKeepAlive = false){
    chrome.tabs.query({url: ["https://ebctest.cybersource.com/*","https://ebc.cybersource.com/*","https://businesscenter.cybersource.com/*"]}, function(tabs){
        var virtualTerminalUrl = favIconUrl.replace("images/favicon.ico","virtualterminal/VirtualTerminalLoad.do");    
        if(tabs.length == 0 && !isKeepAlive){
            chrome.tabs.create({url: virtualTerminalUrl}, function(newTab){
                console.log("Opened virtual terminal in tab ID " + newTab.id);
            });
        }
        if(tabs.length == 0 && isKeepAlive){
            tabs.push({url: virtualTerminalUrl})
        }
        tabs.forEach(tab => {
            console.log("Duplicating tab " + tab.id);
            chrome.tabs.create({url: tab.url, active: false, windowId: tab.windowId, openerTabId: tab.id}, function(newTab){
                if(isKeepAlive){
                    keepAliveTabIds.push(newTab.id);
                }
                var checkTabLoadedInterval = setInterval(function(){
                    chrome.tabs.get(newTab.id, function(tabFound){
                        if(tabFound.status == "complete"){
                            console.log("Removing tab " + tabFound.id)
                            chrome.tabs.remove(tabFound.id,function(){
                                console.log("Removed tab")
                            })
                            clearInterval(checkTabLoadedInterval);
                        }
                    })
                }, 500);
            });
        });
    });
}

function logout(){
    chrome.tabs.query({url: ["https://ebctest.cybersource.com/*","https://ebc.cybersource.com/*","https://businesscenter.cybersource.com/*"]}, function(tabs){
        if(tabs.length == 0){
            var logoutUrl = favIconUrl.replace("images/favicon.ico", "login/Logout.do");
            chrome.tabs.create({url: logoutUrl}, function(newTab){
                console.log("Logged out");
            });
        }
        else{
            tabs.forEach(tab => {
                console.log("Logging out " + tab.id);
                var tabFavIconUrl = tab.favIconUrl;
                if(tabFavIconUrl == null){
                    tabFavIconUrl = favIconUrl;
                }
                var logoutUrl = tabFavIconUrl.replace("images/favicon.ico", "login/Logout.do");
                chrome.tabs.update(tab.id, {url: logoutUrl},function(){
                    console.log("Logged out");
                })
            });
        }
        chrome.notifications.clear("warningNotification");
    });
}


function startSessionTimer(keepAliveInterval, warningInterval, expireInterval){
    var sessionStartDate = new Date();
    var lastKeepAliveDate = new Date();
    var countdownStarted = false;
    if(sessionTimer !== null){
        clearInterval(sessionTimer);
    }
    sessionTimer = setInterval(function(){
        var intervalDate = new Date();
        var sessionSeconds = Math.floor((intervalDate - sessionStartDate) / 1000);
        var keepAliveSeconds = Math.floor((intervalDate - lastKeepAliveDate) / 1000);
        if(keepAliveSeconds >= 60 * keepAliveInterval ){
            lastKeepAliveDate = new Date();
            duplicatePage(true);
        }
        if(sessionSeconds >= 60 * warningInterval && !countdownStarted){
            countdownStarted = true;
            chrome.notifications.create("warningNotification", {type: "basic", iconUrl: "./images/credit_card128.png", title: "Cybersource Session Inactive", message: "Click this message to remain logged in", requireInteraction: true});
        }
        if(sessionSeconds >= 60 * expireInterval){
            chrome.notifications.create("expireNotification", {type: "basic", iconUrl: "./images/credit_card128.png", title: "Cybersource Session Ended", message: "Session has ended after " + expireInterval + " minutes of inactivity"});
            logout();
            clearInterval(sessionTimer);
            chrome.browserAction.setBadgeText({text: ""});
        }
        var badgeSeconds = (expireInterval * 60 - sessionSeconds) % 60;
        var badgeMinutes = Math.floor((expireInterval * 60 - sessionSeconds) / 60);
        chrome.browserAction.setBadgeText({text: badgeMinutes + ":" + ("00" + badgeSeconds).slice(-2)});
    }, 1000);
}
