import Logo from "../components/ui/Logo.jsx";
import heroPets from "../assets/hero-pets.png";
import sitterFah from "../assets/sitter-fah.png";
import sitterNew from "../assets/sitter-new.png";
import sitterPoom from "../assets/sitter-poom.png";
import "../styles/landing.css";


/* 6 ขั้นตอนทำการ — ดึงจาก Business Flow ในรายงาน Database */
const HOW_STEPS = [
  { icon: "🔍", title: "Search & Match",         desc: "ค้นหาพี่เลี้ยงโดยกรองตามพื้นที่ ประเภทสัตว์ ช่วงราคา และคะแนนประเมิน" },
  { icon: "📅", title: "Booking Request",        desc: "ส่งคำขอจองโดยระบุวัน เวลา และสัตว์เลี้ยงที่ต้องการฝากดูแล" },
  { icon: "✅", title: "Confirmation",           desc: "พี่เลี้ยงตรวจสอบรายละเอียดแล้วตอบรับหรือปฏิเสธงานได้ด้วยตัวเอง" },
  { icon: "💳", title: "Payment",                desc: "ชำระมัดจำ 30% หรือเต็มจำนวน พร้อมแนบหลักฐานการโอนเงินในระบบ" },
  { icon: "🐾", title: "Service & Update",       desc: "พี่เลี้ยงดูแลสัตว์เลี้ยงพร้อมอัปเดตสถานะ เช่น เริ่มงาน กำลังดูแล ส่งมอบคืน" },
  { icon: "⭐", title: "Final Payment & Review", desc: "ชำระส่วนที่เหลือเมื่อจบบริการ และรีวิวเพื่อช่วยผู้ใช้งานคนอื่น" },
];

/* พี่เลี้ยงเด่น (mock) — การ์ดที่ 3 "ล็อก" เพื่อสื่อ limited access ของ guest */
const TOP_SITTERS = [
  { img: sitterFah,  name: "พี่ฟ้า",  area: "Bangkok",   price: "฿450/วัน", tags: ["พาเดินเล่น", "รับฝากเลี้ยง"], locked: false },
  { img: sitterNew,  name: "พี่นิว",  area: "Chiang Mai", price: "฿350/วัน", tags: ["พาเดินเล่น", "เยี่ยมบ้าน"],   locked: false },
  { img: sitterPoom, name: "พี่ภูมิ", area: "Bangkok",   price: "฿500/วัน", tags: [],                            locked: true  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ===== Navbar guest ===== */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Logo />
          <nav className="landing-nav-actions">
            <a className="btn btn--ghost btn--small" href="#/login">เข้าสู่ระบบ</a>
            <a className="btn btn--small" href="#/register">สมัครสมาชิก</a>
          </nav>
        </div>
      </header>

      {/* ===== Hero: ข้อความซ้าย + ภาพขวา (ตามดราฟ) ===== */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-badge">🐾 แพลตฟอร์มพี่เลี้ยงสัตว์เลี้ยงที่ไว้ใจได้</span>
            <h1>
              ฝากสัตว์เลี้ยงไว้กับ
              <br />
              <span className="hero-highlight">พี่เลี้ยงที่ไว้ใจได้</span>
            </h1>
            <p className="hero-sub">
              PetBuddy จับคู่เจ้าของสัตว์เลี้ยงกับพี่เลี้ยงใกล้บ้านที่ผ่านการตรวจสอบ
              ค้นหา จอง ชำระเงิน และติดตามการดูแล ครบจบในที่เดียว
            </p>
            <div className="hero-ctas">
              <a className="btn" href="#/register">สมัครสมาชิกฟรี</a>
              <a className="btn btn--ghost" href="#/login">เข้าสู่ระบบ</a>
            </div>
            <div className="hero-stats">
              <div><strong>🐾 120+</strong><span>พี่เลี้ยงที่ผ่านการตรวจสอบ</span></div>
              <div><strong>🐾 4.8/5</strong><span>คะแนนรีวิวเฉลี่ย</span></div>
              <div><strong>🐾 1,200+</strong><span>การจองที่สำเร็จ</span></div>
            </div>
            <p className="hero-note">* ข้อมูลตัวอย่างสำหรับการเดโม</p>
          </div>
          <img className="hero-img" src={heroPets} alt="น้องหมาและน้องแมวบนเบาะนุ่ม" />
        </div>
      </section>

      {/* ===== Meet our top sitters (preview + limited access) ===== */}
      <section className="sitters">
        <h2>พบกับพี่เลี้ยงเด่นของเรา</h2>
        <p className="section-sub">ดูตัวอย่างได้ฟรี — ล็อกอินเพื่อเปิดโปรไฟล์และค้นหาพี่เลี้ยงทั้งหมด</p>
        <div className="sitter-grid">
          {TOP_SITTERS.map((s) => (
            <div className="sitter-card" key={s.name}>
              <img className="sitter-avatar" src={s.img} alt={`รูปโปรไฟล์ของ${s.name}`} />
              <h3>{s.name}</h3>
              <p className="sitter-area">{s.area}</p>
              <div className="stars" aria-label="คะแนน 5 ดาว">★★★★★</div>
              <div className="sitter-price">{s.price}</div>
              {s.locked ? (
                <a className="lock-row" href="#/login">🔒 ล็อกอินเพื่อดูโปรไฟล์เต็ม</a>
              ) : (
                <div className="tags">
                  {s.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
        <a className="sitters-more" href="#/login">เข้าสู่ระบบเพื่อดูพี่เลี้ยงทั้งหมด →</a>
      </section>

      {/* ===== How it works ===== */}
      <section className="how">
        <h2>ใช้งานยังไง?</h2>
        <p className="section-sub">6 ขั้นตอนง่าย ๆ ตั้งแต่ค้นหาจนถึงรีวิว</p>
        <div className="how-grid">
          {HOW_STEPS.map((s, i) => (
            <div className="how-card" key={s.title}>
              <div className="how-top">
                <span className="how-icon">{s.icon}</span>
                <span className="how-step">ขั้นตอนที่ {i + 1}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== สำหรับใครบ้าง ===== */}
      <section className="audience">
        <div className="audience-card">
          <h3>🐶 สำหรับเจ้าของสัตว์เลี้ยง</h3>
          <ul>
            <li>ค้นหาและกรองพี่เลี้ยงตามพื้นที่ ราคา และคะแนน</li>
            <li>จองบริการและแนบหลักฐานการโอนเงินในระบบ</li>
            <li>ติดตามสถานะการดูแลสัตว์เลี้ยงได้ตลอด</li>
            <li>รีวิวหลังจบบริการเพื่อช่วยชุมชนคนรักสัตว์</li>
          </ul>
        </div>
        <div className="audience-card">
          <h3>🧡 สำหรับพี่เลี้ยงสัตว์</h3>
          <ul>
            <li>สร้างบริการและกำหนดอัตราค่าบริการได้ด้วยตัวเอง</li>
            <li>จัดการตารางเวลา "ว่าง / ไม่ว่าง" ตามวันและเวลา</li>
            <li>ตอบรับหรือปฏิเสธงานได้อย่างอิสระ</li>
            <li>ส่งอัปเดตสถานะให้เจ้าของระหว่างดูแล</li>
          </ul>
        </div>
      </section>

      {/* ===== CTA banner ===== */}
      <section className="cta-banner">
        <h2>พร้อมเข้าร่วมครอบครัว PetBuddy หรือยัง?</h2>
        <p>สมัครฟรีได้ทั้งเจ้าของสัตว์เลี้ยงและพี่เลี้ยงสัตว์</p>
        <a className="btn btn--inverse" href="#/register">เริ่มเลย →</a>
      </section>

      {/* ===== Footer ===== */}
      <footer className="landing-footer">
        <Logo />
        <p>© 2026 PetBuddy — โครงการรายวิชา Software Engineering</p>
      </footer>
    </div>
  );
}