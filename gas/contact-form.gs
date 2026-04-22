/**
 * CREAM OF THE CROP - お問い合わせフォーム受信用 GAS Web App
 *
 * セットアップ手順:
 * 1. Google Apps Script (https://script.google.com) で新規プロジェクト作成
 * 2. このコードを貼り付け
 * 3. 「初期セットアップ」関数を1回実行（スプレッドシート自動作成）
 * 4. デプロイ → ウェブアプリ → 「全員」がアクセス可能に設定
 * 5. デプロイURLを main.js の GAS_ENDPOINT_URL に設定
 */

// 設定
const SHEET_NAME = 'お問い合わせ';
const NOTIFY_EMAIL = 'info@cream-okinawa.com';

// 種別の日本語マッピング
const CATEGORY_MAP = {
  'general': '一般的なお問い合わせ',
  'reservation': '貸切・団体予約',
  'recruit': '求人について',
  'media': '取材・メディア',
  'business': '業務提携・取引',
  'other': 'その他'
};

/**
 * 初期セットアップ: スプレッドシートを自動作成し、IDをスクリプトプロパティに保存
 * ※ デプロイ前に1回だけ手動実行してください
 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SPREADSHEET_ID');

  if (ssId) {
    Logger.log('既にセットアップ済みです。スプレッドシートID: ' + ssId);
    return;
  }

  // スプレッドシート作成
  const ss = SpreadsheetApp.create('CREAM HP お問い合わせ');
  ssId = ss.getId();
  props.setProperty('SPREADSHEET_ID', ssId);

  // ヘッダー設定
  const sheet = ss.getActiveSheet();
  sheet.setName(SHEET_NAME);
  sheet.appendRow(['日時', '名前', 'メール', '電話', '種別', '内容', '対応状況']);
  sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  sheet.setFrozenRows(1);

  // 列幅調整
  sheet.setColumnWidth(1, 160); // 日時
  sheet.setColumnWidth(2, 120); // 名前
  sheet.setColumnWidth(3, 200); // メール
  sheet.setColumnWidth(4, 140); // 電話
  sheet.setColumnWidth(5, 160); // 種別
  sheet.setColumnWidth(6, 400); // 内容
  sheet.setColumnWidth(7, 100); // 対応状況

  Logger.log('セットアップ完了！スプレッドシートID: ' + ssId);
  Logger.log('URL: ' + ss.getUrl());
}

/**
 * POST リクエスト処理
 */
function doPost(e) {
  try {
    const params = e.parameter;
    const name = params.name || '';
    const email = params.email || '';
    const phone = params.phone || '';
    const category = CATEGORY_MAP[params.category] || params.category || '';
    const message = params.message || '';
    const timestamp = new Date();

    // スプレッドシートに記録
    saveToSheet(timestamp, name, email, phone, category, message);

    // メール通知
    sendNotification(timestamp, name, email, phone, category, message);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GETリクエスト（ヘルスチェック用）
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'CREAM Contact Form API' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * スプレッドシートに問い合わせ内容を記録
 */
function saveToSheet(timestamp, name, email, phone, category, message) {
  const ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!ssId) throw new Error('セットアップ未実行: setup() を実行してください');

  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(SHEET_NAME);

  sheet.appendRow([
    Utilities.formatDate(timestamp, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss'),
    name,
    email,
    phone,
    category,
    message,
    '未対応'
  ]);
}

/**
 * 問い合わせ内容をメールで通知
 */
function sendNotification(timestamp, name, email, phone, category, message) {
  const dateStr = Utilities.formatDate(timestamp, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
  const subject = '【CREAM HP】お問い合わせ: ' + category + ' - ' + name + '様';
  const body = [
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '  CREAM OF THE CROP - 新規お問い合わせ',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '受信日時: ' + dateStr,
    'お名前:   ' + name,
    'メール:   ' + email,
    '電話:     ' + (phone || '(未入力)'),
    '種別:     ' + category,
    '',
    '【お問い合わせ内容】',
    message,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '※ このメールはCREAM公式サイトのお問い合わせフォームから自動送信されています。',
  ].join('\n');

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    body: body,
    replyTo: email
  });
}
