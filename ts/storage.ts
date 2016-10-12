declare var LZString: any

class FavoriteMessageStorage {

  private storage: chrome.storage.LocalStorageArea

  constructor () {
    this.storage = chrome.storage.local
    // this.storage.clear()
  }

  /**
   * メッセージをストレージに保存
   * @param {String} rid ルームID
   * @param {String} mid メッセージID
   */
  public saveMessage (rid: string, html: string) {
    const defaults = {[rid]: []}
    const storage = this.storage
    const compressed = this.compress(html)
    console.log(compressed)
    this.storage.get(defaults, function (items) {
      items[rid].push(compressed)
      storage.set(items)
    })
  }

  /**
   * ストレージからメッセージを削除
   * @param {String} rid ルームID
   * @param {String} mid メッセージID
   */
  public removeMessage (rid: string, html: string) {
    const defaults = {[rid]: []}
    const compressed = this.compress(html)

    this.storage.get(defaults, items => {
      let messageList = items[rid]
      const index = messageList.indexOf(html)
      messageList.splice(index, 1)

      this.storage.set({[rid]: messageList})

      if (messageList.length === 0) {
        this.storage.remove(rid)
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
      callback(items[rid].map(html => _this.decompress(html)))
    })
  }

  /**
   * 引数で指定したチャットのお気に入りメッセージのリストを返す
   * @param {String} rid ルームID
   * @param {messageIdListCallback} callback お気に入りされたメッセージのIDの配列を匹スト
   */
  public getMessageIdList (rid: string, callback) {
    this.getFavoriteMessageList(rid, favoriteMessageList => {
      callback(favoriteMessageList.map(message => $(message).attr('data-mid')))
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
