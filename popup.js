'use strict';
let keepAliveIntervalSelect = document.getElementById('keepAliveIntervalSelect');
let warningIntervalSelect = document.getElementById('warningIntervalSelect');
let expireIntervalSelect = document.getElementById('expireIntervalSelect');

chrome.storage.sync.get(['keepAliveInterval','warningInterval','expireInterval'], function(data) {
    setSelectedValue(keepAliveIntervalSelect, data.keepAliveInterval);
    setSelectedValue(warningIntervalSelect, data.warningInterval);
    setSelectedValue(expireIntervalSelect, data.expireInterval);
});

function setSelectedValue(select, value){
    for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].text== value) {
            select.options[i].selected = true;
            return;
        }
    }
}

keepAliveIntervalSelect.onchange = function(element){
    var keepAliveValue = parseInt(element.target.value);
    chrome.storage.sync.get(['warningInterval'], function(data) {
        if(keepAliveValue >= data.warningInterval){
            keepAliveValue = data.warningInterval - 1;
            if(keepAliveValue < 1){
                keepAliveValue = 1;
            }
            setSelectedValue(keepAliveIntervalSelect, keepAliveValue)
        }
        chrome.storage.sync.set({keepAliveInterval: keepAliveValue});
    });
}

warningIntervalSelect.onchange = function(element){
    var warningValue = parseInt(element.target.value);
    chrome.storage.sync.get(['keepAliveInterval','expireInterval'], function(data) {
        var keepAliveValue = data.keepAliveInterval;
        if(warningValue >= data.expireInterval){
            warningValue = data.expireInterval - 1;
            if(warningValue < 1){
                warningValue = 1;
            }
        }
        chrome.storage.sync.set({warningInterval: warningValue}, function(){
            setSelectedValue(warningIntervalSelect, warningValue);
        });
        if(keepAliveValue >= warningValue){
            keepAliveValue = warningValue - 1;
            if(keepAliveValue < 1){
                keepAliveValue = 1;
            }
            chrome.storage.sync.set({keepAliveInterval: keepAliveValue}, function(){
                setSelectedValue(keepAliveIntervalSelect, keepAliveValue);
            });
        }
    });
}

expireIntervalSelect.onchange = function(element){
    var expireValue = parseInt(element.target.value);
    chrome.storage.sync.get(['keepAliveInterval','warningInterval'], function(data) {
        var keepAliveValue = data.keepAliveInterval;
        var warningValue = data.warningInterval;
        if(warningValue >= expireValue){
            warningValue = expireValue - 1;
            if(warningValue < 1){
                warningValue = 1;
            }
            chrome.storage.sync.set({warningInterval: warningValue}, function(){
                setSelectedValue(warningIntervalSelect, warningValue);
            });
        }
        if(keepAliveValue >= warningValue){
            keepAliveValue = warningValue - 1;
            if(keepAliveValue < 1){
                keepAliveValue = 1;
            }
            chrome.storage.sync.set({keepAliveInterval: keepAliveValue}, function(){
                setSelectedValue(keepAliveIntervalSelect, keepAliveValue);
            });
        }
        chrome.storage.sync.set({expireInterval: expireValue});
    });
}

