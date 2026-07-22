import { FC } from "react";
import { EmployeeDetailResponse } from "@/models/employee/employee";
import image from '../../asset/images/image.png';

type Props = {
  open: boolean;
  employeeDetail?: EmployeeDetailResponse;
  onClose: () => void;
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE:      { label: "Active",      color: "#16a34a", bg: "#dcfce7" },
    PENDING:    { label: "Pending",    color: "#dc2626", bg: "#fee2e2" },
    ONLEAVE:    { label: "On Leave",    color: "#d97706", bg: "#fef3c7" },
  };

const EmployeeDetailModal: FC<Props> = ({ open, employeeDetail, onClose }) => {
  if (!open || !employeeDetail) return null;

  const {
    name,
    email,
    phone,
    gender,
    birthday,
    hireDate,
    status,
    position,
    department,
    avatar,
    address,
  } = employeeDetail;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE:      { label: "Active",      color: "#16a34a", bg: "#dcfce7" },
    PENDING:    { label: "Pending",    color: "#dc2626", bg: "#fee2e2" },
    ONLEAVE:    { label: "On Leave",    color: "#d97706", bg: "#fef3c7" },
  };

  const s = status ? statusConfig[status] ?? statusConfig["INACTIVE"] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');

        .edm-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          background: rgba(10, 10, 20, 0.6);
          backdrop-filter: blur(6px);
          animation: edm-fade-in 0.2s ease;
        }

        @keyframes edm-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes edm-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .edm-card {
          font-family: 'DM Sans', sans-serif;
          background: #ffffff;
          width: 100%; max-width: 460px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.06),
            0 24px 48px rgba(0,0,0,0.12),
            0 8px 16px rgba(0,0,0,0.06);
          animation: edm-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        /* ── Header band ── */
        .edm-header {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
          padding: 28px 24px 24px;
          position: relative;
          overflow: hidden;
        }
        .edm-header::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.18) 0%, transparent 60%);
          pointer-events: none;
        }
        .edm-header-dots {
          position: absolute; top: 12px; right: 12px;
          display: flex; gap: 5px;
        }
        .edm-header-dots span {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.12);
        }

        .edm-close {
          position: absolute; top: 16px; right: 16px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.7);
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 14px; line-height: 1;
          transition: background 0.15s, color 0.15s;
          z-index: 2;
        }
        .edm-close:hover {
          background: rgba(255,255,255,0.2);
          color: #fff;
        }

        .edm-avatar-row {
          display: flex; align-items: flex-end; gap: 16px;
          position: relative; z-index: 1;
        }
        .edm-avatar-wrap {
          position: relative; flex-shrink: 0;
        }
        .edm-avatar {
          width: 72px; height: 72px; border-radius: 16px;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.2);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .edm-avatar-ring {
          position: absolute; inset: -3px;
          border-radius: 19px;
          border: 1.5px solid rgba(99,102,241,0.5);
          pointer-events: none;
        }
        .edm-name {
          font-family: 'DM Serif Display', serif;
          font-size: 22px; font-weight: 400;
          color: #f8fafc; letter-spacing: -0.3px;
          margin: 0 0 4px;
        }
        .edm-position {
          font-size: 13px; color: rgba(255,255,255,0.5);
          font-weight: 300; letter-spacing: 0.4px;
          margin: 0;
        }
        .edm-status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.3px; margin-top: 8px;
        }
        .edm-status-dot {
          width: 5px; height: 5px; border-radius: 50%;
        }

        /* ── Body ── */
        .edm-body {
          padding: 24px;
        }

        .edm-section-label {
          font-size: 10px; font-weight: 600; letter-spacing: 1.2px;
          text-transform: uppercase; color: #94a3b8;
          margin-bottom: 14px;
        }

        .edm-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 16px 20px;
          margin-bottom: 20px;
        }

        .edm-info-item {}
        .edm-info-label {
          font-size: 10px; font-weight: 500; letter-spacing: 0.8px;
          text-transform: uppercase; color: #94a3b8;
          margin-bottom: 3px;
        }
        .edm-info-value {
          font-size: 13.5px; color: #1e293b; font-weight: 500;
          line-height: 1.4;
        }

        .edm-divider {
          height: 1px; background: #f1f5f9;
          margin: 0 0 20px;
        }

        /* Address card */
        .edm-address-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex; gap: 12px; align-items: flex-start;
        }
        .edm-address-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: #0f172a; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }
        .edm-address-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.8px;
          text-transform: uppercase; color: #94a3b8; margin-bottom: 3px;
        }
        .edm-address-text {
          font-size: 13px; color: #374151; line-height: 1.5;
          font-weight: 400;
        }
      `}</style>

      <div className="edm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="edm-card" role="dialog" aria-modal="true" aria-label="Employee Details">

          {/* ── Header ── */}
          <div className="edm-header">
            <div className="edm-header-dots">
              <span /><span /><span />
            </div>
            <button className="edm-close" onClick={onClose} aria-label="Close">✕</button>

            <div className="edm-avatar-row">
              <div className="edm-avatar-wrap">
                <img
                  src={avatar?.url || image.src}
                  alt={name}
                  className="edm-avatar"
                />
                <div className="edm-avatar-ring" />
              </div>
              <div>
                <h2 className="edm-name">{name}</h2>
                <p className="edm-position">{position?.name || "—"}</p>
                {s && (
                  <div className="edm-status-badge" style={{ background: s.bg, color: s.color }}>
                    <span className="edm-status-dot" style={{ background: s.color }} />
                    {s.label}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="edm-body">
            <p className="edm-section-label">Contact & Info</p>
            <div className="edm-grid">
              <InfoItem label="Email"      value={email} />
              <InfoItem label="Phone"      value={phone} />
              <InfoItem label="Gender"     value={gender} />
              <InfoItem label="Birthday"   value={birthday} />
              <InfoItem label="Hire Date"  value={hireDate} />
              <InfoItem label="Department" value={department?.name} />
              <InfoItem label="Branch"     value={department?.branchName} />
            </div>

            {address && (
              <>
                <div className="edm-divider" />
                <div className="edm-address-card">
                  <div className="edm-address-icon">📍</div>
                  <div>
                    <p className="edm-address-label">Address</p>
                    <p className="edm-address-text">
                      {[
                        address.specificAddress,
                        address.districtName,
                        address.provinceName,
                        address.countryName,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const InfoItem = ({ label, value }: { label: string; value?: string | number }) => (
  <div className="edm-info-item">
    <p className="edm-info-label">{label}</p>
    <p className="edm-info-value">{value || "—"}</p>
  </div>
);

export default EmployeeDetailModal;