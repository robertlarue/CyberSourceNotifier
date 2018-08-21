// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let warningIntervalSelect = document.getElementById('warningIntervalSelect');

let expireIntervalSelect = document.getElementById('expireIntervalSelect');

chrome.storage.sync.get(['warningInterval','expireInterval'], function(data) {
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

warningIntervalSelect.onchange = function(element){
    chrome.storage.sync.set({warningInterval: element.target.value});
}

expireIntervalSelect.onchange = function(element){
    chrome.storage.sync.set({expireInterval: element.target.value});
}

