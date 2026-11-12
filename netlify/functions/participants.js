const headers = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'};
const reply = (statusCode, value) => ({statusCode, headers, body: JSON.stringify(value)});
exports.handler = async event => {
  if (event.httpMethod !== 'POST') return reply(405, {status:'error', message:'Method not allowed'});
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, {status:'error', message:'ข้อมูลไม่ถูกต้อง'}); }
  if (!body || !['list','register'].includes(body.action)) return reply(400, {status:'error', message:'คำสั่งไม่ถูกต้อง'});
  if (body.action === 'register' && (!['morning','afternoon'].includes(body.period) || !Array.isArray(body.ids) || !body.ids.length || body.ids.length > 200 || body.ids.some(id => typeof id !== 'string' || !id.trim() || id.length > 200))) {
    return reply(400, {status:'error', message:'กรุณาตรวจสอบรายชื่อและรอบ'});
  }
  const url = process.env.APPS_SCRIPT_URL;
  const token = process.env.API_TOKEN;
  if (!url || !token || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) return reply(503, {status:'error', message:'กรุณาตั้งค่า APPS_SCRIPT_URL และ API_TOKEN ใน Netlify แล้ว Deploy ใหม่'});
  try {
    const response = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:body.action, ids:body.ids, period:body.period, token}),
      redirect:'follow', signal:AbortSignal.timeout(25000)
    });
    if (!response.ok) throw new Error('upstream');
    const result = await response.json();
    if (!result || !['success','error'].includes(result.status)) throw new Error('format');
    return reply(result.status === 'success' ? 200 : 400, result);
  } catch {
    return reply(502, {status:'error', message:'ยังยืนยันผลจาก Google Sheets ไม่ได้ กรุณาโหลดข้อมูลใหม่เพื่อตรวจสอบก่อนลงทะเบียนซ้ำ หากยังเชื่อมต่อไม่ได้ ให้ตรวจ Deployment และสิทธิ์ Apps Script'});
  }
};
