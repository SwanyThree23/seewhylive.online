// frontend/src/components/nav/MoreMenuSheet.jsx
const BG = '#0C0806';
const CREAM = '#F5F5DC';
const GOLD = '#D4AF37';

export default function MoreMenuSheet({ items, onSelect, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: BG,
          borderTop: `1px solid ${GOLD}55`,
          borderRadius: '16px 16px 0 0',
          padding: '20px 16px 32px',
        }}
      >
        <div style={{ width: 40, height: 4, background: '#444', borderRadius: 2, margin: '0 auto 16px' }} />
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.route)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'transparent',
              border: 'none',
              padding: '14px 8px',
              color: CREAM,
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 18,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
