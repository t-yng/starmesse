/* global chrome */
(function () {
  'use strict'

  // タブの更新時のイベント処理を追加
  chrome.tabs.onUpdated.addListener(showIcon)

  // 外部からメッセージを受信してメッセージに応じた処理を実行
  chrome.extension.onMessage.addListener((request, _, response) => {
    // オプションの設定値を返す
    if (request.method === 'hogehoge') {
    }
  })

  // チャットワークのタブの時だけアイコンを表示する
  function showIcon (tabId, _, tab) {
    if (validateTabUrl(tab)) {
      chrome.pageAction.show(tabId)
    } else {
      chrome.pageAction.hide(tabId)
    }
  }

  // 開いているタブのURLがextensionで有効か確認
  function validateTabUrl (tab) {
    let validated = chrome.runtime.getManifest().content_scripts[0].matches.some(url => {
      if (tab.url.match(url)) return true
    })

    return validated
  }
}())
