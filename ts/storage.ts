declare var LZString: any

class FavoriteMessageStorage {

  private storage: chrome.storage.LocalStorageArea

  constructor () {
    this.storage = chrome.storage.local
    this.storage.clear()
  }

  /**
   * メッセージをストレージに保存
   * @param {String} roomId ルームID
   * @param {String} mid メッセージID
   */
  public saveMessage (roomId: string, messageId: string, html: string) {
    const defaults = {[roomId]: []}
    const storage = this.storage
    const compressed = this.compress(html)
    const message = {id: messageId, html: compressed}
    this.storage.get(defaults, function (items) {
      items[roomId].push(message)
      storage.set(items)
    })
  }

  /**
   * ストレージからメッセージを削除
   * @param {String} rid ルームID
   * @param {String} mid メッセージID
   */
  public removeMessage (roomId: string, messageId: string) {
    const defaults = {[roomId]: []}

    this.storage.get(defaults, items => {
      let messageList = items[roomId]
      const index = messageList.map(message => message.id).indexOf(messageId)
      messageList.splice(index, 1)

      this.storage.set({[roomId]: messageList})

      if (messageList.length === 0) {
        this.storage.remove(roomId)
      }
    })
  }

  /**
   * 引数で指定したチャットのお気に入りメッセージのリストを返す
   * @param {String} rid ルームID
   * @param {messageListCallback} callback お気に入りされたメッセージのIDの配列を匹スト
   */
  public getFavoriteMessageList (rid: string, callback) {
    const defaults = {[rid]: []}

    const _this = this
    this.storage.get(defaults, function (items) {
      callback(items[rid].map(message => _this.decompress(message.html)))
    })
  }

  /**
   * 引数で指定したチャットのお気に入りメッセージIDのリストを返す
   * @param {String} rid ルームID
   * @param {messageIdListCallback} callback お気に入りされたメッセージのIDの配列を匹スト
   */
  public getMessageIdList (rid: string, callback) {
    this.getFavoriteMessageList(rid, favoriteMessageList => {
      callback(favoriteMessageList.map(message => $(message.html).attr('data-mid')))
    })
  }

  /**
   * お気に入りメッセージを持つルームのIDの配列を返す
   * @param {roomIdListCallback} callback
   */
  public getRoomIdList (callback) {
    Object.keys(this.storage.get(items => callback(Object.keys(items))))
  }

  /**
   * 文字列を圧縮
   * @param text 圧縮したい文字列
   */
  private compress(text: string): string {
    return LZString.compressToEncodedURIComponent(text)
  }

  /**
   * 圧縮された文字列を解凍
   * @param text 圧縮したい文字列
   */
  private decompress(text: string): string {
    return LZString.decompressFromEncodedURIComponent(text)
  }

  /**
   * お気に入りメッセージを持つルームのIDを取得するメソッドに対するコールバック関数
   * @callback roomIdListCallback
   * @param {string[]} お気に入りメッセージを持つルームのIDの配列
   */

  /**
   * お気に入りメッセージを持つルームのIDを取得するメソッドに対するコールバック関数
   * @callback messageListCallback
   * @param {string[]} お気に入りメッセージのIDの配列
   */
}
