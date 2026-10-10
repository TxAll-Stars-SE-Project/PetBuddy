import SitterBookingList from './SitterBookingList';
import './SitterBookingsModal.css';

interface SitterBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SitterBookingsModal({
  isOpen,
  onClose,
}: SitterBookingsModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="sitter-bookings-modal__overlay"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="sitter-bookings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sitter-bookings-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sitter-bookings-modal__header">
          <h1 id="sitter-bookings-modal-title">รายการคำขอการจอง (Sitter Bookings)</h1>
          <button
            className="sitter-bookings-modal__close"
            type="button"
            onClick={onClose}
            aria-label="ปิด"
          >
            ×
          </button>
        </header>

        <SitterBookingList />
      </section>
    </div>
  );
}
