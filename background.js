// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

var sessionTimer = null;

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({warningInterval: 1, expireInterval: 2});
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {hostEquals: 'ebctest.cybersource.com'},
                }),
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {hostEquals: 'ebc.cybersource.com'}
                }),
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {hostEquals: 'businesscenter.cybersource.com'}
                })
            ],
            actions: [
                new chrome.declarativeContent.ShowPageAction()
            ]
        }]);
    });
});

chrome.webNavigation.onCompleted.addListener(function(e){
    console.log("Loading page " + e.url + " tab ID " + e.tabId);
    chrome.tabs.get(e.tabId, function(tab){
        console.log("Tab Title: " + tab.title)
        if(!tab.title.includes("Login")){
            console.log("Creating alarm warningAlarm");
            
            var settings = null;
            chrome.storage.sync.get(['warningInterval','expireInterval'], function(result){
                setInterval()
                chrome.browserAction.setBadgeText("")
                settings = result;
                chrome.alarms.create("warningAlarm", {delayInMinutes: settings.warningInterval});
                chrome.alarms.create("expirationAlarm", {delayInMinutes: settings.expireInterval});
                if(!chrome.alarms.onAlarm.hasListeners()){
                    console.log("Adding alarm listener");
                    chrome.alarms.onAlarm.addListener(function(alarm){
                        if(alarm.name == "warningAlarm"){
                            console.log(alarm.name + " firing now");
                            chrome.notifications.create("warningNotification", {type: "basic", iconUrl: null, title: "Cybersource Session Inactive", message: "Click this message to remain logged in"})
                        }
                        if(alarm.name == "expirationAlarm"){
                            console.log(alarm.name + " firing now");
                            chrome.notifications.create("expireNotification", {type: "basic", iconUrl: null, title: "Cybersource Session Ended", message: "Session has ended after " + settings.expireInterval + " minutes of inactivity"})
                            logout();
                        }
                    });
                }
            }); 
        }
    })
},{url: [{hostEquals: 'ebc.cybersource.com'},{hostEquals: 'ebctest.cybersource.com'},{hostEquals: 'businesscenter.cybersource.com'}]})

if(!chrome.notifications.onClicked.hasListeners()){
    console.log("Adding Notification Listener");
    chrome.notifications.onClicked.addListener(function(notificationId, byUser){
        if(notificationId == "warningNotification"){
            duplicatePage();
        }
    })
}

function duplicatePage(){
    chrome.tabs.query({url: ["https://ebctest.cybersource.com/*","https://ebc.cybersource.com/*","https://businesscenter.cybersource.com/*"]}, function(tabs){
        tabs.forEach(tab => {
            console.log("Duplicating tab " + tab.id)
            chrome.tabs.duplicate(tab.id, function(tab){
                console.log("Removing tab " + tab.id)
                chrome.tabs.remove(tab.id,function(){
                    console.log("Removed tab")
                })
            })
        });
    })
}

function logout(){
    chrome.tabs.query({url: ["https://ebctest.cybersource.com/*","https://ebc.cybersource.com/*","https://businesscenter.cybersource.com/*"]}, function(tabs){
        tabs.forEach(tab => {
            console.log("Logging out " + tab.id)
            var logoutUrl = tab.favIconUrl.replace("images/favicon.ico", "login/Logout.do")
            chrome.tabs.update({url: logoutUrl},function(){
                console.log("Logged out")
            })
        });
    })
}

function startSessionTimer(warningInterval, expireInterval){
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
        if(keepAliveSeconds >= 60 ){
            lastKeepAliveDate = new Date();
            dismissNotification();
        }
        if(sessionSeconds >= 60 * warningInterval && !countdownStarted){
            countdownStarted = true;
            startCountdown();
        }
        if(sessionSeconds >= 60 * expireInterval){
            closeIdleNotification();
            showTimeoutNotification();
            logout();
        }
    }, 1000);
}
