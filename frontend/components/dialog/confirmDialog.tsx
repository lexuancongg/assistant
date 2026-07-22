import Modal from 'react-bootstrap/Modal';
import { ReactNode } from 'react';

type DialogProps = {
  isShow: boolean;
  title?: string;
  children: ReactNode;
  okText?: string;
  cancelText?: string;
  loading?: boolean;
  ok: () => void;
  cancel: () => void;
};

export default function ConfirmationDialog({
  isShow,
  title,
  children,
  okText,
  cancelText,
  loading,
  ok,
  cancel,
}: DialogProps) {
  return (
    <Modal
      show={isShow}
      onHide={!loading ? cancel : undefined}
      // centered
      contentClassName="rounded-2xl border-0 shadow-2xl"
      backdropClassName="backdrop-blur-sm bg-black/40"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="text-[15px] font-semibold text-gray-900">
          {title}
        </h2>

        <button
          onClick={cancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 text-sm text-gray-600">
        {children}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
        <button
          onClick={cancel}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
        >
          {cancelText || 'Cancel'}
        </button>

        <button
          onClick={ok}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : okText || 'OK'}
        </button>
      </div>
    </Modal>
  );
}