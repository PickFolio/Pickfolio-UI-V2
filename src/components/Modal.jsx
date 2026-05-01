import { useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './ui/Button';

function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <Motion.div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, zIndex: 1 }}
          />
          <Motion.div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="modal-header">
              <h2 id="modal-title" className="section-title" style={{ margin: 0 }}>{title}</h2>
              <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close dialog">
                <X size={18} />
              </Button>
            </div>
            <div className="modal-body">{children}</div>
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default Modal;
