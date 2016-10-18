var FavoriteMessageStorage = (function () {
    function FavoriteMessageStorage() {
        this.storage = chrome.storage.local;
        this.storage.clear();
    }
    /**
     * メッセージをストレージに保存
     * @param {String} roomId ルームID
     * @param {String} mid メッセージID
     */
    FavoriteMessageStorage.prototype.saveMessage = function (roomId, messageId, html) {
        var defaults = (_a = {}, _a[roomId] = [], _a);
        var storage = this.storage;
        var compressed = this.compress(html);
        var message = { id: messageId, html: compressed };
        this.storage.get(defaults, function (items) {
            items[roomId].push(message);
            storage.set(items);
        });
        var _a;
    };
    /**
     * ストレージからメッセージを削除
     * @param {String} rid ルームID
     * @param {String} mid メッセージID
     */
    FavoriteMessageStorage.prototype.removeMessage = function (roomId, messageId) {
        var _this = this;
        var defaults = (_a = {}, _a[roomId] = [], _a);
        this.storage.get(defaults, function (items) {
            var messageList = items[roomId];
            var index = messageList.map(function (message) { return message.id; }).indexOf(messageId);
            messageList.splice(index, 1);
            _this.storage.set((_a = {}, _a[roomId] = messageList, _a));
            if (messageList.length === 0) {
                _this.storage.remove(roomId);
            }
            var _a;
        });
        var _a;
    };
    /**
     * 引数で指定したチャットのお気に入りメッセージのリストを返す
     * @param {String} rid ルームID
     * @param {messageListCallback} callback お気に入りされたメッセージのIDの配列を匹スト
     */
    FavoriteMessageStorage.prototype.getFavoriteMessageList = function (rid, callback) {
        var defaults = (_a = {}, _a[rid] = [], _a);
        var _this = this;
        this.storage.get(defaults, function (items) {
            callback(items[rid].map(function (message) { return _this.decompress(message.html); }));
        });
        var _a;
    };
    /**
     * 引数で指定したチャットのお気に入りメッセージIDのリストを返す
     * @param {String} rid ルームID
     * @param {messageIdListCallback} callback お気に入りされたメッセージのIDの配列を匹スト
     */
    FavoriteMessageStorage.prototype.getMessageIdList = function (rid, callback) {
        this.getFavoriteMessageList(rid, function (favoriteMessageList) {
            callback(favoriteMessageList.map(function (message) { return $(message.html).attr('data-mid'); }));
        });
    };
    /**
     * お気に入りメッセージを持つルームのIDの配列を返す
     * @param {roomIdListCallback} callback
     */
    FavoriteMessageStorage.prototype.getRoomIdList = function (callback) {
        Object.keys(this.storage.get(function (items) { return callback(Object.keys(items)); }));
    };
    /**
     * 文字列を圧縮
     * @param text 圧縮したい文字列
     */
    FavoriteMessageStorage.prototype.compress = function (text) {
        return LZString.compressToEncodedURIComponent(text);
    };
    /**
     * 圧縮された文字列を解凍
     * @param text 圧縮したい文字列
     */
    FavoriteMessageStorage.prototype.decompress = function (text) {
        return LZString.decompressFromEncodedURIComponent(text);
    };
    return FavoriteMessageStorage;
}());
/// <reference path="./storage.ts" />
var StarMesse = (function () {
    function StarMesse() {
        this.storage = new FavoriteMessageStorage();
        this.addFilterFavoriteMessageRoomButton();
        this.addSidebar();
        this.addShowSidebarButton();
    }
    /**
     * DOMの監視を開始
     * 監視したいDOMがある場合はここに追加していく
     */
    StarMesse.prototype.startMutationObserver = function () {
        // callback関数内のthisがMutationObserverになってしまうので、自分自身を指すようにbindする
        var timeLineMo = new MutationObserver(this.callbackTimeLine.bind(this));
        var roomListMo = new MutationObserver(this.callbackRoomList.bind(this));
        var roomTitleMo = new MutationObserver(this.callbackRoomTitle.bind(this));
        var options = {
            childList: true
        };
        var timeLine = document.getElementById('_timeLine');
        var roomList = document.getElementById('_roomListItems');
        var roomTitle = document.getElementById('_roomTitle');
        timeLineMo.observe(timeLine, options);
        roomListMo.observe(roomList, options);
        roomTitleMo.observe(roomTitle, options);
    };
    /**
     * お気に入りメッセージを持つチャットのみを表示するボタンを追加
     */
    StarMesse.prototype.addFilterFavoriteMessageRoomButton = function () {
        $('#_chatFilterList').append('<li role="menuitemradio" class="_cwBBButton button" data-cwui-bb-idx="3" aria-label="お気に入りメッセージがあるチャットのみ表示"><span class="icoSizeLarge fa fa-star"></span></li>');
    };
    /**
     * お気に入りメッセージを表示するサイドバーを追加
     */
    StarMesse.prototype.addSidebar = function () {
        var _this = this;
        $('#_wrapper').append('<div class="sidebar"><div class="sidebar-content"></div></div>');
        $('.sidebar').prepend('<h1 id="_favoriteRoomTitle" class="contentHl mainContentHl"></h1>');
        $('#_favoriteRoomTitle').append('<span class="_roomTitleText autotrim">お気に入りメッセージを表示</span>');
        $('#_favoriteRoomTitle').append('<i id="sidebarCloseBtn" class="fa fa-times close-btn" aria-hidden="true" style="margin-right: 5px;"></i>');
        $('#sidebarCloseBtn').on('click', function () {
            _this.closeSidebar();
        });
    };
    /**
     * サイドバーを表示するボタンを追加
     */
    StarMesse.prototype.addShowSidebarButton = function () {
        var _this = this;
        var $button = $('<div id="showFavoriteMessageButton" class="_button _showDescription btnLarge button" style="text-align: center;padding: initial;" aria-label="お気に入りメッセージ" role="button" aria-disabled="false"></div>');
        $button.append('<sapn class="fa fa-star"></sapn>');
        $button.on('click', function () {
            if (_this.checkedFilterIcon()) {
                _this.closeSidebar();
            }
            else {
                var roomId = _this.getCurrentRoomId();
                _this.storage.getFavoriteMessageList(roomId, _this.showSidebar.bind(_this));
            }
        });
        $('#_mainContent > div.chatRoomHeaderBtn.btnGroup').prepend($button);
        // ボタンを追加した分、メンバーリストを左にずらす
        $('#_subRoomMemberArea').css('right', '185px');
    };
    /**
     * チャットのメッセージ一覧が更新された際に呼ばれるコールバック関数
     * @param records 更新されたDOMの配列
     */
    StarMesse.prototype.callbackTimeLine = function (records) {
        var _this = this;
        if (records.length === 0)
            return;
        var $messages = $(records[0].addedNodes).filter('._message');
        var roomId = this.getCurrentRoomId();
        // メッセージにお気に入り登録するためのアイコンボタンを追加
        $messages.get().forEach(function (message) {
            _this.addFavoriteIcon($(message));
        });
        // お気に入り登録されているメッセージのお気に入りアイコンをチェック状態にする
        this.storage.getMessageIdList(roomId, function (messageIdList) {
            messageIdList.forEach(function (id) {
                var $favoriteIcon = $messages.filter("[data-mid=\"" + id + "\"]").find('.favorite-icon');
                if ($favoriteIcon)
                    _this.checkIcon($favoriteIcon);
            });
        });
    };
    /**
     * チャットのタイトルが更新された際に呼ばれるコールバック関数
     * @param records 更新されたDOMの配列
     */
    StarMesse.prototype.callbackRoomTitle = function (records) {
        if (records.length === 0)
            return;
        var addedFilterIcon = _.some($(records[0].addedNodes), function (el) { return $(el).hasClass('favorite-message-filter-icon'); });
        if (addedFilterIcon)
            return;
        $('#_roomTitle').find('._pin').after('<sapn class="fa fa-star favorite-message-filter-icon un-checked"></span>');
    };
    /**
     * 左側のチャットの一覧が更新された際に呼ばれるコールバック関数
     * @param records 更新されたDOMの配列
     */
    StarMesse.prototype.callbackRoomList = function (records) {
        if (records.length === 0)
            return;
        if (this.selectedFilterFavoriteMessageButton()) {
            this.storage.getRoomIdList(this.filterFavoriteMessageRoom);
        }
    };
    StarMesse.prototype.observeSidebar = function (records) {
        if (records.length)
            return;
        $(records[0].addedNodes).filter('.favorite-icon').each(function () {
        });
    };
    /**
     * お気に入りメッセージを持つチャットのみ表示するボタンが選択されているかを返す
     * @returns {boolean}
     */
    StarMesse.prototype.selectedFilterFavoriteMessageButton = function () {
        return $('.button:has(".fa-star")').hasClass('selected');
    };
    /**
     * 現在のチャットルームのIDを返す
     * @returns チャットルームのID
     */
    StarMesse.prototype.getCurrentRoomId = function () {
        return $('#_chatContent ._message').attr('data-rid');
    };
    /**
     * メッセージにお気に入り登録アイコンを追加
     * FIX: 役割を持たせ過ぎな気がする。アイコンのクリックイベント付与は別でやった方がよい？
     * @param $messaage アイコンを追加するメッセージ
     */
    StarMesse.prototype.addFavoriteIcon = function ($message) {
        // お気に入りアイコンを追加
        var $timeStamp = $message.find('._timeStamp');
        var $favoriteIcon = $('<sapn class="favorite-icon fa fa-star un-checked" style="margin-left: 5px;"></sapn>');
        $timeStamp.append($favoriteIcon);
        var html = $message.prop('outerHTML');
        var messageId = $message.attr('data-mid');
        // アイコンをクリックした時にメッセージを追加or削除する
        var _this = this;
        var roomId = this.getCurrentRoomId();
        $favoriteIcon.on('click', function () {
            // アイコンのチェック状態を更新
            // _this.reverseIconChecked($favoriteIcon)
            // 更新された状態がチェック状態ならメッセージを保存
            if ($favoriteIcon.hasClass('checked')) {
                _this.storage.removeMessage(roomId, messageId);
                _this.unCheckIcon($favoriteIcon);
            }
            else {
                _this.storage.saveMessage(roomId, messageId, html);
                _this.checkIcon($favoriteIcon);
            }
        });
    };
    /**
     * アイコンのチェック状態を反転させる
     * @param $icon
     */
    StarMesse.prototype.reverseIconChecked = function ($icon) {
        if ($icon.hasClass('checked')) {
            this.unCheckIcon($icon);
        }
        else {
            this.checkIcon($icon);
        }
    };
    /**
     * アイコンをチェック状態にする
     * @param $icon
     */
    StarMesse.prototype.checkIcon = function ($icon) {
        $icon.removeClass('un-checked');
        $icon.addClass('checked');
    };
    /**
     * アイコンをチェック状態を解除する
     * @param $icon
     */
    StarMesse.prototype.unCheckIcon = function ($icon) {
        $icon.removeClass('checked');
        $icon.addClass('un-checked');
    };
    /**
     * お気に入りのメッセージがあるチャットのみを表示
     * @param favoriteMessageRoomIdList お気に入りのメッセージがあるチャットのID一覧
     */
    StarMesse.prototype.filterFavoriteMessageRoom = function (favoriteMessageRoomIdList) {
        $('#_roomListItems').find('[role="listitem"]').each(function () {
            var roomId = $(this).attr('data-rid');
            if (favoriteMessageRoomIdList.indexOf(roomId) === -1) {
                $(this).hide();
            }
        });
    };
    /**
     * お気に入り登録されたメッセージ(サイドバー)を表示
     * @param favoriteMessageList
     */
    StarMesse.prototype.showSidebar = function (favoriteMessageList) {
        var _this = this;
        // メッセージ一覧のDOMをサイドバーで表示するために修正
        var $favoriteTimeline = $('#_timeLine').clone();
        $favoriteTimeline.attr('id', '_favoriteTimeline');
        $favoriteTimeline.css('height', '');
        $favoriteTimeline.children().remove();
        // お気に入りメッセージを追加
        favoriteMessageList.forEach(function (html) {
            var $message = $(html);
            var $favoriteIcon = $message.find('.favorite-icon');
            _this.checkIcon($favoriteIcon);
            $favoriteIcon.get(0).addEventListener('click', function () {
                _this.storage.removeMessage(_this.getCurrentRoomId(), html);
                $message.remove();
                var messageId = $message.attr('data-mid');
                console.log(messageId);
                var $icon = $("#_mainContent ._message[data-mid=\"" + messageId + "\"]").find('.favorite-icon');
                console.log($icon);
                _this.unCheckIcon($icon);
            });
            $favoriteTimeline.append($message);
        });
        // チャット部屋の名前をサイドバーの名前に設定
        var roomTitleText = $('#_mainContent ._roomTitleText').text();
        $('.sidebar ._roomTitleText').text(roomTitleText);
        // お気に入りメッセージ一覧を追加
        $('.sidebar-content').append($favoriteTimeline);
        $('.sidebar').addClass('open');
    };
    /**
     * サイドバーを閉じる
     */
    StarMesse.prototype.closeSidebar = function () {
        $('.sidebar').find('#_favoriteTimeline').remove();
        $('.sidebar').removeClass('open');
    };
    /**
     * フィルタリングアイコンがチェックされているか真偽値を返す
     * @returns チェックされている場合に真を返す
     */
    StarMesse.prototype.checkedFilterIcon = function () {
        return $('.favorite-message-filter-icon').hasClass('checked');
    };
    return StarMesse;
}());
var starMesse = new StarMesse();
starMesse.startMutationObserver();
