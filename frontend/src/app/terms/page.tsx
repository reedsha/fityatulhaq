import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import {
  LegalContents,
  LegalEffectiveDate,
  LegalList,
  LegalSection,
} from "@/components/legal/legalUi";

/**
 * `/terms` — terms of use (PRD §5.5.2).
 *
 * A public static page with no API calls, moved out of the `(auth)` route group
 * in M5: the auth group's layout is the full-bleed brand-blue sign-in canvas,
 * which is the wrong chrome for a document anyone may read without an account.
 * Debt D3 tracked exactly this mislocation.
 *
 * The copy is ours to write, not a PRD quotation. §5.5.2 asks for "กติกาการใช้งาน
 * เว็บไซต์และเว็บบอร์ด" plus the forum posting rules and their penalties, and the
 * posting rules here mirror what the backend actually enforces (the §7.2 report
 * reasons, the §7.3 posting budget, and §7.1 pre-moderation on Youth Care), so
 * the document describes the real system rather than an aspiration.
 */

export const metadata: Metadata = {
  title: "ข้อกำหนดการใช้งาน",
  description: "กติกาการใช้งานเว็บไซต์และเว็บบอร์ดของ FityatulHaq รวมถึงบทลงโทษกรณีละเมิด",
};

const SECTIONS = [
  { id: "acceptance", title: "การยอมรับข้อกำหนด" },
  { id: "access", title: "สิทธิ์การเข้าถึง" },
  { id: "posting", title: "กติกาการโพสต์ในเว็บบอร์ด" },
  { id: "prohibited", title: "เนื้อหาที่ไม่ได้รับอนุญาต" },
  { id: "moderation", title: "การตรวจสอบเนื้อหาและการรายงาน" },
  { id: "penalties", title: "บทลงโทษกรณีละเมิด" },
  { id: "intellectual-property", title: "ทรัพย์สินทางปัญญา" },
  { id: "changes", title: "การเปลี่ยนแปลงข้อกำหนด" },
  { id: "contact", title: "การติดต่อเรา" },
] as const;

const LINK_CLASSES =
  "text-brand-700 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

export default function TermsPage(): ReactElement {
  return (
    <AuthAwareShell contained={false}>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-heading-1 text-ink-900">ข้อกำหนดการใช้งาน</h1>
          <p className="mt-2 text-body text-ink-600">
            ข้อกำหนดที่ใช้บังคับเมื่อคุณใช้งานเว็บไซต์และเว็บบอร์ดของ FityatulHaq
          </p>
        </header>

        <LegalEffectiveDate>ปรับปรุงล่าสุด: กันยายน 2569</LegalEffectiveDate>

        <div className="mt-8">
          <LegalContents entries={SECTIONS} />
        </div>

        <div className="mt-10 space-y-10">
          <LegalSection id="acceptance" title="การยอมรับข้อกำหนด">
            <p>
              การเข้าชมหรือใช้งานเว็บไซต์ FityatulHaq ไม่ว่าด้วยวิธีใด ถือว่าคุณยอมรับข้อกำหนด
              ฉบับนี้แล้ว หากคุณไม่ยอมรับ กรุณาหยุดใช้งานเว็บไซต์
            </p>
            <p>
              การสมัครสมาชิกกำหนดให้คุณยอมรับข้อกำหนดฉบับนี้และนโยบายความเป็นส่วนตัวก่อนจึงจะ
              ดำเนินการต่อได้ เมื่อคุณสร้างบัญชี คุณยืนยันว่าข้อมูลที่ให้ไว้เป็นความจริง
              และคุณมีอายุตามที่กฎหมายกำหนดให้ให้ความยินยอมได้ด้วยตนเอง
            </p>
          </LegalSection>

          <LegalSection id="access" title="สิทธิ์การเข้าถึง">
            <p>
              เนื้อหาสาธารณะของเว็บไซต์เปิดให้ทุกคนอ่านได้โดยไม่ต้องเข้าสู่ระบบ ส่วนการมีส่วนร่วม
              ต้องเป็นสมาชิกที่เข้าสู่ระบบแล้ว ได้แก่
            </p>
            <LegalList
              items={[
                "การตั้งกระทู้ใหม่ การแสดงความคิดเห็น และการกดถูกใจ",
                "การตั้งคำถามในกระดานปรึกษา Youth Care",
                "การดาวน์โหลดไฟล์เฉพาะสมาชิก และการบันทึกเนื้อหาโปรด",
                "การจัดการโปรไฟล์และการได้รับการแจ้งเตือน",
              ]}
            />
            <p className="text-body-sm text-ink-600">
              ท่านสามารถอ่านนโยบายความเป็นส่วนตัวได้ที่{" "}
              <Link href="/privacy-policy" className={LINK_CLASSES}>
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </LegalSection>

          <LegalSection id="posting" title="กติกาการโพสต์ในเว็บบอร์ด">
            <p>เมื่อคุณโพสต์กระทู้หรือความคิดเห็น คุณตกลงที่จะ</p>
            <LegalList
              items={[
                "แสดงความคิดเห็นด้วยความสุภาพ ให้เกียรติผู้ร่วมสนทนาและทีมงาน",
                "เขียนเนื้อหาให้ตรงกับหัวข้อของกระดาน เพื่อให้ผู้อื่นค้นหาและติดตามได้ง่าย",
                "หลีกเลี่ยงการเปิดเผยข้อมูลส่วนตัวของผู้อื่น ทั้งชื่อ ที่อยู่ เบอร์โทรศัพท์ หรือภาพ",
                "งดโฆษณา สินค้า บริการ หรือชักชวนทางการเงินที่ไม่ได้รับอนุญาตจากองค์กร",
                "งดส่งข้อความซ้ำ ๆ หรือเนื้อหาที่ไม่เกี่ยวกับการสนทนา",
              ]}
            />
            <p>
              กระดานปรึกษา Youth Care เป็นพื้นที่สำหรับปัญหาส่วนตัวและปัญหาของเยาวชน ระบบจะไม่
              แสดงชื่อผู้ใช้หรือข้อมูลระบุตัวตนของผู้ถามต่อสาธารณะ ไม่ว่าผู้ถามจะเลือกโหมดนิรนาม
              หรือไม่ก็ตาม ทั้งนี้ ระบบยังคงบันทึกผู้ส่งจริงไว้ในฐานข้อมูลเพื่อความปลอดภัย
              และเพื่อป้องกันการใช้งานในทางที่ผิด
            </p>
          </LegalSection>

          <LegalSection id="prohibited" title="เนื้อหาที่ไม่ได้รับอนุญาต">
            <p>ห้ามโพสต์เนื้อหาดังต่อไปนี้ในทุกส่วนของเว็บไซต์</p>
            <LegalList
              items={[
                "ถ้อยคำหยาบคาย ดูหมิ่น หรือคุกคามบุคคลหรือกลุ่มบุคคลใด",
                "การเปิดเผยข้อมูลส่วนบุคคลของผู้อื่นโดยไม่ได้รับความยินยอม",
                "การโฆษณา สแปม หรือเนื้อหาหลอกลวง",
                "เนื้อหาที่ผิดกฎหมาย ละเมิดลิขสิทธิ์ หรือขัดต่อความสงบเรียบร้อย",
                "เนื้อหาอื่นใดที่ทีมงานเห็นว่าไม่เหมาะสมต่อพื้นที่ของเยาวชน",
              ]}
            />
          </LegalSection>

          <LegalSection id="moderation" title="การตรวจสอบเนื้อหาและการรายงาน">
            <p>
              กระทู้และความคิดเห็นในกระดานปรึกษา Youth Care จะเข้าสู่สถานะรอตรวจสอบก่อนเผยแพร่
              โดยทีมงานต้องอ่านและอนุมัติก่อนที่ผู้อื่นจะเห็น ส่วนกระดานพูดคุยทั่วไปเผยแพร่ทันที
              และตรวจสอบภายหลัง
            </p>
            <p>
              หากพบเนื้อหาที่ไม่เหมาะสม คุณสามารถกดปุ่มรายงานเนื้อหาไม่เหมาะสมที่กระทู้หรือ
              ความคิดเห็นนั้น โดยเลือกเหตุผลได้ว่าเป็นถ้อยคำหยาบคาย การโฆษณา การเปิดเผยข้อมูล
              ส่วนตัว สแปม หรือเหตุผลอื่น พร้อมระบุรายละเอียดเพิ่มเติมได้ ทีมงานจะตรวจสอบ
              รายงานและดำเนินการตามความเหมาะสม
            </p>
          </LegalSection>

          <LegalSection id="penalties" title="บทลงโทษกรณีละเมิด">
            <p>
              ทีมงานอาจดำเนินการเป็นขั้นบันไดตามความรุนแรงและความถี่ของการละเมิด โดยอาจเลือก
              ใช้มาตรการใดมาตรการหนึ่งหรือหลายอย่างร่วมกัน ได้แก่
            </p>
            <LegalList
              items={[
                "ปฏิเสธการเผยแพร่ หรือซ่อนเนื้อหาที่ละเมิด พร้อมแจ้งเหตุผลให้ผู้โพสต์ทราบ",
                "จำกัดการโพสต์ชั่วคราวเมื่อมีรายงานที่ได้รับการยืนยันว่าละเมิดหลายครั้งในระยะเวลาหนึ่ง",
                "ระงับหรือยกเลิกบัญชีสมาชิกในกรณีที่ละเมิดร้ายแรงหรือกระทำซ้ำ",
                "ดำเนินการตามกฎหมาย หากการกระทำนั้นเข้าข่ายความผิดตามกฎหมายที่เกี่ยวข้อง",
              ]}
            />
          </LegalSection>

          <LegalSection id="intellectual-property" title="ทรัพย์สินทางปัญญา">
            <p>
              ข้อความ เครื่องหมาย ภาพ และสื่อการเรียนรู้บนเว็บไซต์นี้เป็นขององค์กรหรือได้รับ
              อนุญาตให้เผยแพร่แล้ว คุณสามารถใช้เพื่อการเรียนรู้ส่วนบุคคลได้ แต่ห้ามนำไปใช้
              ในเชิงพาณิชย์หรือดัดแปลงโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
            </p>
            <p>
              เนื้อหาที่คุณโพสต์ยังคงเป็นของคุณ แต่คุณให้สิทธิ์แก่องค์กรในการจัดเก็บ เผยแพร่
              และแสดงเนื้อหานั้นภายในเว็บไซต์ เพื่อให้บริการตามวัตถุประสงค์ของพื้นที่นี้
            </p>
          </LegalSection>

          <LegalSection id="changes" title="การเปลี่ยนแปลงข้อกำหนด">
            <p>
              องค์กรอาจปรับปรุงข้อกำหนดฉบับนี้เป็นครั้งคราว เมื่อมีการเปลี่ยนแปลงที่มีนัยสำคัญ
              เราจะแจ้งให้สมาชิกทราบผ่านประกาศบนเว็บไซต์ การใช้งานเว็บไซต์ต่อไปหลังการ
              เปลี่ยนแปลงถือว่าคุณยอมรับข้อกำหนดฉบับที่ปรับปรุงแล้ว
            </p>
          </LegalSection>

          <LegalSection id="contact" title="การติดต่อเรา">
            <p>
              หากมีข้อสงสัยเกี่ยวกับข้อกำหนดฉบับนี้ กรุณาติดต่อเราผ่านหน้า{" "}
              <Link href="/contact" className={LINK_CLASSES}>
                ติดต่อเรา
              </Link>
            </p>
          </LegalSection>
        </div>
      </div>
    </AuthAwareShell>
  );
}
