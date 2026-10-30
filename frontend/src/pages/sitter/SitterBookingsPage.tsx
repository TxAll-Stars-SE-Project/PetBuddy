import Navbar from '../../components/Navbar';
import SitterBookingList from '../../components/sitter/SitterBookingList';
import { useAuth } from '../../context/AuthContext';

export default function SitterBookingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <Navbar />
      <main className="home-main">
        <section className="home-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <h1 style={{ fontSize: '24px', color: 'var(--text, #1f2937)', margin: 0 }}>
              รายการคำขอการจอง (Sitter Bookings)
            </h1>
            {user?.username && (
              <span
                style={{
                  fontSize: '13.5px',
                  color: '#4b5563',
                  backgroundColor: '#fff7ef',
                  border: '1px solid #ffedd5',
                  padding: '6px 14px',
                  borderRadius: '20px',
                }}
              >
                พี่เลี้ยง: <strong style={{ color: '#ea580c' }}>{user.username}</strong>
              </span>
            )}
          </div>
          <SitterBookingList />
        </section>
      </main>
    </div>
  );
}
