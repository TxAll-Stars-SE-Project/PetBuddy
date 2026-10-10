import SitterBookingList from '../../components/sitter/SitterBookingList';

export default function SitterBookingsPage() {
  return (
    <main className="home-main">
      <section className="home-card">
        <h1>รายการคำขอการจอง (Sitter Bookings)</h1>
        <SitterBookingList />
      </section>
    </main>
  );
}
