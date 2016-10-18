/// <reference path="./storage.ts" />

class StarMesse {
  private storage: FavoriteMessageStorage

  constructor() {
    this.storage = new FavoriteMessageStorage()

    this.addFilterFavoriteMessageRoomButton()
    this.addSidebar()
    this.addShowSidebarButton()
  }

  /**
   * DOMの監視を開始
   * 監視したいDOMがある場合はここに追加していく
   */
  public startMutationObserver () {
    // callback関数内のthisがMutationObserverになってしまうので、自分自身を指すようにbindする
    const timeLineMo = new MutationObserver(this.callbackTimeLine.bind(this))
    const roomListMo = new MutationObserver(this.callbackRoomList.bind(this))
    const roomTitleMo = new MutationObserver(this.callbackRoomTitle.bind(this))

    const options = {
      childList: true
    }

    const timeLine = document.getElementById('_timeLine')
    const roomList = document.getElementById('_roomListItems')
    const roomTitle = document.getElementById('_roomTitle')

    timeLineMo.observe(timeLine, options)
    roomListMo.observe(roomList, options)
    roomTitleMo.observe(roomTitle, options)
  }

  /**
   * お気に入りメッセージを持つチャットのみを表示するボタンを追加
   */
  private addFilterFavoriteMessageRoomButton () {
    $('#_chatFilterList').append('<li role="menuitemradio" class="_cwBBButton button" data-cwui-bb-idx="3" aria-label="お気に入りメッセージがあるチャットのみ表示"><span class="icoSizeLarge fa fa-star"></span></li>')
  }

  /**
   * お気に入りメッセージを表示するサイドバーを追加
   */
  private addSidebar () {
    $('#_wrapper').append('<div class="sidebar"><div class="sidebar-content"></div></div>')
    $('.sidebar').prepend('<h1 id="_favoriteRoomTitle" class="contentHl mainContentHl"></h1>')
    $('#_favoriteRoomTitle').append('<span class="_roomTitleText autotrim">お気に入りメッセージを表示</span>')
    $('#_favoriteRoomTitle').append('<i id="sidebarCloseBtn" class="fa fa-times close-btn" aria-hidden="true" style="margin-right: 5px;"></i>')
    $('#sidebarCloseBtn').on('click', () => {
      this.closeSidebar()
    })
  }

  /**
   * サイドバーを表示するボタンを追加
   */
  private addShowSidebarButton () {
    let $button = $('<div id="showFavoriteMessageButton" class="_button _showDescription btnLarge button" style="text-align: center;padding: initial;" aria-label="お気に入りメッセージ" role="button" aria-disabled="false"></div>')
    $button.append('<sapn class="fa fa-star"></sapn>')

    $button.on('click', () => {
      if (this.checkedFilterIcon()) {
        this.closeSidebar()
      } else {
        const roomId: string = this.getCurrentRoomId()
        this.storage.getFavoriteMessageList(roomId, this.showSidebar.bind(this))
      }
    })

    $('#_mainContent > div.chatRoomHeaderBtn.btnGroup').prepend($button)

    // ボタンを追加した分、メンバーリストを左にずらす
    $('#_subRoomMemberArea').css('right', '185px')
  }

  /**
   * チャットのメッセージ一覧が更新された際に呼ばれるコールバック関数
   * @param records 更新されたDOMの配列
   */
  private callbackTimeLine (records: Array<MutationRecord>) {
    if (records.length === 0) return

    const $messages = $(records[0].addedNodes).filter('._message')
    const roomId = this.getCurrentRoomId()

    // メッセージにお気に入り登録するためのアイコンボタンを追加
    $messages.get().forEach(message => {
      this.addFavoriteIcon($(message))
    })

    // お気に入り登録されているメッセージのお気に入りアイコンをチェック状態にする
    this.storage.getMessageIdList(roomId, messageIdList => {
      messageIdList.forEach(id => {
        const $favoriteIcon = $messages.filter(`[data-mid="${id}"]`).find('.favorite-icon')
        if ($favoriteIcon) this.checkIcon($favoriteIcon)
      })
    })
  }

  /**
   * チャットのタイトルが更新された際に呼ばれるコールバック関数
   * @param records 更新されたDOMの配列
   */
  private callbackRoomTitle (records: Array<MutationRecord>) {
    if (records.length === 0) return

    const addedFilterIcon = _.some($(records[0].addedNodes), el => $(el).hasClass('favorite-message-filter-icon'))
    if (addedFilterIcon) return

    $('#_roomTitle').find('._pin').after('<sapn class="fa fa-star favorite-message-filter-icon un-checked"></span>')
  }

  /**
   * 左側のチャットの一覧が更新された際に呼ばれるコールバック関数
   * @param records 更新されたDOMの配列
   */
  private callbackRoomList (records: Array<MutationRecord>) {
    if (records.length === 0) return

    if (this.selectedFilterFavoriteMessageButton()) {
      this.storage.getRoomIdList(this.filterFavoriteMessageRoom)
    }
  }

  private observeSidebar(records: Array<MutationRecord>) {
    if (records.length) return

    $(records[0].addedNodes).filter('.favorite-icon').each(function() {

    })
  }

  /**
   * お気に入りメッセージを持つチャットのみ表示するボタンが選択されているかを返す
   * @returns {boolean}
   */
  private selectedFilterFavoriteMessageButton (): boolean {
    return $('.button:has(".fa-star")').hasClass('selected')
  }

  /**
   * 現在のチャットルームのIDを返す
   * @returns チャットルームのID
   */
  private getCurrentRoomId (): string {
    return $('#_chatContent ._message').attr('data-rid')
  }

  /**
   * メッセージにお気に入り登録アイコンを追加
   * FIX: 役割を持たせ過ぎな気がする。アイコンのクリックイベント付与は別でやった方がよい？
   * @param $messaage アイコンを追加するメッセージ
   */
  private addFavoriteIcon ($message: JQuery) {
    // お気に入りアイコンを追加
    const $timeStamp = $message.find('._timeStamp')
    const $favoriteIcon = $('<sapn class="favorite-icon fa fa-star un-checked" style="margin-left: 5px;"></sapn>')
    $timeStamp.append($favoriteIcon)

    const html = $message.prop('outerHTML')
    const messageId = $message.attr('data-mid')

    // アイコンをクリックした時にメッセージを追加or削除する
    const _this = this
    const roomId = this.getCurrentRoomId()
    $favoriteIcon.on('click', function () {
      // アイコンのチェック状態を更新
      // _this.reverseIconChecked($favoriteIcon)

      // 更新された状態がチェック状態ならメッセージを保存
      if ($favoriteIcon.hasClass('checked')) {
        _this.storage.removeMessage(roomId, messageId)
        _this.unCheckIcon($favoriteIcon);
      } else {
        _this.storage.saveMessage(roomId, messageId, html)
        _this.checkIcon($favoriteIcon);
      }
    })
  }

  /**
   * アイコンのチェック状態を反転させる
   * @param $icon
   */
  private reverseIconChecked($icon: JQuery) {
    if($icon.hasClass('checked')) {
      this.unCheckIcon($icon);
    }
    else {
      this.checkIcon($icon);
    }
  }

  /**
   * アイコンをチェック状態にする
   * @param $icon
   */
  private checkIcon ($icon: JQuery) {
    $icon.removeClass('un-checked')
    $icon.addClass('checked')
  }

  /**
   * アイコンをチェック状態を解除する
   * @param $icon
   */
  private unCheckIcon ($icon: JQuery) {
    $icon.removeClass('checked')
    $icon.addClass('un-checked')
  }

  /**
   * お気に入りのメッセージがあるチャットのみを表示
   * @param favoriteMessageRoomIdList お気に入りのメッセージがあるチャットのID一覧
   */
  private filterFavoriteMessageRoom (favoriteMessageRoomIdList: Array<string>) {
    $('#_roomListItems').find('[role="listitem"]').each(function () {
      const roomId = $(this).attr('data-rid')
      if (favoriteMessageRoomIdList.indexOf(roomId) === -1) {
        $(this).hide()
      }
    })
  }

  /**
   * お気に入り登録されたメッセージ(サイドバー)を表示
   * @param favoriteMessageList
   */
  private showSidebar (favoriteMessageList: Array<string>) {
    // メッセージ一覧のDOMをサイドバーで表示するために修正
    let $favoriteTimeline = $('#_timeLine').clone()
    $favoriteTimeline.attr('id', '_favoriteTimeline')
    $favoriteTimeline.css('height', '')
    $favoriteTimeline.children().remove()

    // お気に入りメッセージを追加
    favoriteMessageList.forEach(html => {
      const $message = $(html)
      let $favoriteIcon = $message.find('.favorite-icon')
      this.checkIcon($favoriteIcon)

      $favoriteIcon.get(0).addEventListener('click', () => {
        this.storage.removeMessage(this.getCurrentRoomId(), html)
        $message.remove()
        const messageId = $message.attr('data-mid')

        const $icon = $(`#_mainContent ._message[data-mid="${messageId}"]`).find('.favorite-icon')
        this.unCheckIcon($icon)
      })

      $favoriteTimeline.append($message)
    })

    // チャット部屋の名前をサイドバーの名前に設定
    const roomTitleText = $('#_mainContent ._roomTitleText').text()
    $('.sidebar ._roomTitleText').text(roomTitleText)

    // お気に入りメッセージ一覧を追加
    $('.sidebar-content').append($favoriteTimeline)

    $('.sidebar').addClass('open')
  }

  /**
   * サイドバーを閉じる
   */
  private closeSidebar () {
    $('.sidebar').find('#_favoriteTimeline').remove()
    $('.sidebar').removeClass('open')
  }

  /**
   * フィルタリングアイコンがチェックされているか真偽値を返す
   * @returns チェックされている場合に真を返す
   */
  private checkedFilterIcon (): boolean {
    return $('.favorite-message-filter-icon').hasClass('checked')
  }
  
}

const starMesse = new StarMesse()
starMesse.startMutationObserver()
