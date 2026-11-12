# ลงทะเบียนงานรังสิตวิชาการ — Netlify

ชุดนี้แปลงจาก Index และ Code.gs ที่ส่งมา คงหน้าตาและลำดับการลงทะเบียนเดิม
ยังไม่ได้เชื่อมต่อหรือเผยแพร่จริง ต้องตั้งค่าตามขั้นตอนด้านล่างก่อน

## 1. สร้าง API แยก ไม่แก้เว็บเดิม

1. แนะนำให้ทำสำเนา Google Sheets สำหรับทดสอบก่อน
2. เปิด https://script.google.com แล้วสร้าง New project (ไม่แก้โปรเจกต์เดิม)
3. คัดลอก apps-script/Code.gs ไปใส่ในไฟล์ Code.gs ของโปรเจกต์ใหม่ ไม่ต้องสร้าง Index
4. เปิด Project Settings > Script properties แล้วเพิ่ม:
   - SPREADSHEET_ID: ส่วนระหว่าง /d/ และ /edit ใน URL Google Sheets ของสำเนาทดสอบ
   - SHEET_NAME: ชีต1 (หรือตั้งตามชื่อแท็บจริง)
   - API_TOKEN: ตั้งค่าสุ่มยาวอย่างน้อย 32 ตัวอักษร เก็บเป็นความลับ และใช้ค่าเดียวกันใน Netlify
5. Deploy > New deployment > Web app
   - Execute as: Me (บัญชีที่เข้าถึง Sheet ได้)
   - Who has access: Anyone
   - อนุญาตสิทธิ์ แล้วคัดลอก Web app URL ที่ลงท้าย /exec
   - หากบัญชีองค์กรไม่มี Anyone ให้ตรวจนโยบายกับผู้ดูแล ไม่ใช่เปลี่ยนเป็นลิงก์ /dev
6. หากแก้ Code.gs ภายหลัง ให้ Manage deployments > Edit > New version > Deploy

## 2. นำเว็บขึ้น Netlify

วิธีที่แนะนำ: นำไฟล์ในโฟลเดอร์นี้ขึ้น Git repository แล้วเชื่อม Netlify ด้วย Import from Git
ไม่ต้องนำโฟลเดอร์ Rangsit_Netlify ซ้อนอีกชั้น หากซ้อนให้ตั้ง Base directory ให้ตรง
- Publish directory: public
- Functions directory: netlify/functions
- ไม่ต้องตั้ง Build command
- netlify.toml เตรียมค่าไว้แล้ว

หรือใช้ Netlify CLI จากโฟลเดอร์ที่มี netlify.toml:

```sh
npx netlify-cli login
npx netlify-cli init
npx netlify-cli deploy --build --prod
```

ต้อง Deploy Functions ด้วย การลากเฉพาะ public/index.html ไปวางจะไม่ครบระบบ

## 3. ตั้ง Environment variables บน Netlify

ใน Project configuration > Environment variables เพิ่มค่าที่ใช้ใน Functions:
- APPS_SCRIPT_URL: Web app URL /exec ของโปรเจกต์ใหม่
- API_TOKEN: ค่าเดียวกับ Script properties
ตั้งให้ใช้กับ Production และ Deploy Previews ที่ต้องทดสอบ แล้ว Deploy ใหม่
ห้ามใส่ API_TOKEN ลง public/api.js หรือ index.html

## 4. หัวคอลัมน์ที่คงตามโค้ดเดิม

| คอลัมน์ | ใช้สำหรับ |
|---|---|
| A | รหัสอ้างอิง (Unique ID) — ห้ามซ้ำ ควรเก็บเป็นข้อความหากมีเลขศูนย์นำหน้า |
| B | ลำดับนำเสนอ (ใช้ตำแหน่งเดิม ไม่บังคับชื่อหัวคอลัมน์) |
| C | ชื่อ-นามสกุล |
| F | ห้องแข่งขันภาคเช้า |
| G | สถานะลงทะเบียนภาคเช้า |
| H | เวลาลงทะเบียนภาคเช้า (ใช้ตำแหน่งเดิม) |
| I | หมายเลขที่นั่งภาคบ่าย |
| J | สถานะลงทะเบียนภาคบ่าย |
| K | เวลาลงทะเบียนภาคบ่าย (ใช้ตำแหน่งเดิม) |

ต้องมีหัวคอลัมน์ ประเภทการแข่งขัน ด้วย (ตำแหน่งใดก็ได้ที่ไม่ทับช่องข้างต้น)
แถว 1 เป็นหัวคอลัมน์ ข้อมูลเริ่มแถว 2 ถ้าตำแหน่งไม่ตรง API จะหยุดเพื่อป้องกันบันทึกผิดช่อง
สถานะที่ไม่ว่างถือว่าลงทะเบียนแล้ว เช่นเดียวกับเว็บเดิม

## 5. ตรวจสอบก่อนใช้จริง

- ทดสอบเลือกเช้า > ประเภท > หลายรายชื่อ > ลงทะเบียน ตรวจเฉพาะ G/H ถูกเปลี่ยน
- ทดสอบบ่าย แล้วตรวจเฉพาะ J/K ถูกเปลี่ยน
- กลับหน้าหลัก ตรวจชื่อเดิมถูกปิดไม่ให้เลือก และเวลาของคนเดิมไม่ถูกเขียนทับเมื่อส่งซ้ำ
- ตรวจประเภทว่าง รายชื่อว่าง ค้นหา และทดสอบบนมือถือ
- เปิดเว็บเดิม ตรวจว่ายังใช้งานได้ตามปกติ
- เมื่อต้องการใช้ข้อมูลจริง เปลี่ยน SPREADSHEET_ID ของ API ใหม่เป็นไฟล์จริง

## ผลต่อระบบเดิมและข้อจำกัด

ไม่ได้แก้ไฟล์ต้นฉบับหรือ Deployment เดิม หากใช้ Sheet จริงร่วมกัน ข้อมูลที่บันทึกจากทั้งสองเว็บจะเห็นร่วมกัน
Lock ช่วยลดการลงทะเบียนชนกันภายในโปรเจกต์ API ใหม่นี้ แต่ไม่ได้ล็อกการเขียนจากโปรเจกต์เก่าหรือการแก้ Sheet ด้วยมือ
การลงทะเบียนหลายคนไม่ใช่ธุรกรรมแบบ atomic หากขัดข้องกลางทาง อาจบันทึกสำเร็จบางคน ให้โหลดรายชื่อใหม่ตรวจสถานะก่อนส่งซ้ำ
ชุดนี้คงรูปแบบเว็บเดิมที่ไม่มีระบบล็อกอิน ผู้ที่เข้า URL ได้สามารถดูรายชื่อที่หน้าเว็บใช้และลงทะเบียนได้
API_TOKEN ป้องกันเรียก Apps Script โดยตรง ไม่ใช่ระบบยืนยันตัวตนผู้ใช้งานหน้า Netlify
เวลาประมวลผลและโควตา Apps Script ยังมีผล หน้าเว็บบน Netlify ไม่ได้ยกเลิกข้อจำกัดเหล่านั้น
โลโก้ยังใช้ URL Google Drive เดิม ถ้าไม่แสดง ให้ใช้ไฟล์โลโก้ใน public แล้วแก้ src เป็นชื่อไฟล์

เอกสารอ้างอิง:
- https://developers.google.com/apps-script/guides/html/communication
- https://developers.google.com/apps-script/guides/content
- https://docs.netlify.com/build/functions/get-started/
- https://docs.netlify.com/build/functions/environment-variables/
