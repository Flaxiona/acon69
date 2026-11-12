// สร้างโปรเจกต์ Apps Script ใหม่ อย่านำไปทับโปรเจกต์เดิม
// Script properties: SPREADSHEET_ID, SHEET_NAME (optional), API_TOKEN
function doGet() { return json_({status:'success', message:'Registration API ready'}); }
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const props = PropertiesService.getScriptProperties();
    const token = props.getProperty('API_TOKEN');
    if (!token || request.token !== token) throw new Error('ไม่มีสิทธิ์เข้าถึง API');
    if (request.action === 'list') return json_({status:'success', data:list_()});
    if (request.action === 'register') return json_(register_(request.ids, request.period));
    throw new Error('คำสั่งไม่ถูกต้อง');
  } catch (error) { return json_({status:'error', message:error.message}); }
}
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function sheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('ยังไม่ได้ตั้งค่า SPREADSHEET_ID');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(props.getProperty('SHEET_NAME') || 'ชีต1');
  if (!sheet) throw new Error('ไม่พบแท็บชีต กรุณาตรวจ SHEET_NAME');
  return sheet;
}
const REQUIRED_HEADERS_ = ['รหัสอ้างอิง (Unique ID)', 'ชื่อ-นามสกุล', 'ประเภทการแข่งขัน', 'ห้องแข่งขันภาคเช้า', 'สถานะลงทะเบียนภาคเช้า', 'หมายเลขที่นั่งภาคบ่าย', 'สถานะลงทะเบียนภาคบ่าย'];
function data_(sheet) {
  const data = sheet.getDataRange().getDisplayValues();
  const headers = data[0].map(h => h.trim());
  REQUIRED_HEADERS_.forEach(h => { if (!headers.includes(h)) throw new Error('ไม่พบหัวคอลัมน์: ' + h); });
  // These column positions match the original supplied Code.gs.
  const expected = {0:'รหัสอ้างอิง (Unique ID)', 2:'ชื่อ-นามสกุล', 5:'ห้องแข่งขันภาคเช้า', 6:'สถานะลงทะเบียนภาคเช้า', 8:'หมายเลขที่นั่งภาคบ่าย', 9:'สถานะลงทะเบียนภาคบ่าย'};
  Object.keys(expected).forEach(i => { if (headers[i] !== expected[i]) throw new Error('ตำแหน่งคอลัมน์ไม่ตรงโค้ดเดิม: ' + expected[i]); });
  return {headers:headers, rows:data.slice(1)};
}
function list_() {
  const data = data_(sheet_());
  return data.rows.filter(row => row[0]).map(row => {
    const item = {};
    // Return only fields consumed by the original UI.
    REQUIRED_HEADERS_.forEach(h => item[h] = row[data.headers.indexOf(h)]);
    return item;
  });
}
function register_(ids, period) {
  if (!['morning','afternoon'].includes(period) || !Array.isArray(ids) || !ids.length || ids.length > 200 || ids.some(id => typeof id !== 'string' || !id.trim() || id.length > 200)) throw new Error('รายชื่อหรือรอบไม่ถูกต้อง');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = sheet_();
    const data = data_(sheet);
    const uniqueIds = [...new Set(ids)];
    const morning = period === 'morning';
    const statusIndex = morning ? 6 : 9;
    // Validate the whole selection before writing any rows.
    const selected = uniqueIds.map(id => {
      const matches = data.rows.map((row,index) => ({row:row,index:index})).filter(x => x.row[0] === id);
      if (matches.length !== 1) throw new Error('ไม่พบรหัส หรือรหัสซ้ำในชีต: ' + id);
      const item = matches[0];
      if (!item.row[morning ? 5 : 8]) throw new Error('รายชื่อไม่มีข้อมูลในรอบที่เลือก: ' + item.row[2]);
      return item;
    });
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss');
    const results = selected.map(item => {
      // Retry-safe: do not overwrite an existing registration timestamp.
      if (!item.row[statusIndex]) sheet.getRange(item.index + 2, statusIndex + 1, 1, 2).setValues([['มาแล้ว', timestamp]]);
      return {name:item.row[2], sequence:item.row[1], room:item.row[5], seat:item.row[8]};
    });
    SpreadsheetApp.flush();
    return {status:'success', message:'ลงทะเบียนสำเร็จ', registered_data:results};
  } finally { lock.releaseLock(); }
}
