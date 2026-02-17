import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getProductLabel } from '../config/embedConfig';

function TreatmentBadge({ treatment }) {
  if (!treatment || treatment === 'None') return null;
  const isH = treatment.startsWith('H');
  return (
    <span className={`tc-ps-badge ${isH ? 'tc-ps-badge--h' : 'tc-ps-badge--natural'}`}>
      {treatment}
    </span>
  );
}

export default function MiniProductSelector({ products, selectedId, onChange, placeholder = 'Select product…' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedProduct = products.find(p => p.id === selectedId);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (product) => {
    onChange(product.id);
    setIsOpen(false);
  };

  return (
    <div className="tc-mps" ref={containerRef}>
      <button
        type="button"
        className={`tc-mps-trigger ${isOpen ? 'tc-mps-trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedProduct ? (
          <>
            {selectedProduct.imageUrl && (
              <img src={selectedProduct.imageUrl} alt="" className="tc-mps-trigger__thumb" />
            )}
            <div className="tc-mps-trigger__dims">{selectedProduct.profile}</div>
            <div className="tc-mps-trigger__info">
              <div className="tc-mps-trigger__name">{getProductLabel(selectedProduct)}</div>
              <div className="tc-mps-trigger__meta">
                <TreatmentBadge treatment={selectedProduct.treatment} />
                {selectedProduct.grade && selectedProduct.grade !== '—' && (
                  <span className="tc-ps-badge tc-ps-badge--grade">{selectedProduct.grade}</span>
                )}
              </div>
            </div>
            {selectedProduct.pricePerMeter > 0 && (
              <span className="tc-mps-trigger__price">${selectedProduct.pricePerMeter.toFixed(2)}/m</span>
            )}
          </>
        ) : (
          <span className="tc-mps-trigger__placeholder">{placeholder}</span>
        )}
        <ChevronDown size={14} className="tc-mps-trigger__chevron" />
      </button>

      {isOpen && (
        <div className="tc-mps-dropdown">
          {products.map(p => {
            const isSel = p.id === selectedId;
            return (
              <button
                type="button"
                key={p.id}
                className={`tc-mps-row ${isSel ? 'tc-mps-row--selected' : ''}`}
                onClick={() => handleSelect(p)}
              >
                {p.imageUrl && (
                  <img src={p.imageUrl} alt="" className="tc-mps-row__thumb" />
                )}
                <div className={`tc-mps-row__dims ${isSel ? 'tc-mps-row__dims--selected' : ''}`}>
                  {p.profile}
                </div>
                <div className="tc-mps-row__info">
                  <div className="tc-mps-row__name">{getProductLabel(p)}</div>
                  <div className="tc-mps-row__meta">
                    <TreatmentBadge treatment={p.treatment} />
                    {p.grade && p.grade !== '—' && (
                      <span className="tc-ps-badge tc-ps-badge--grade">{p.grade}</span>
                    )}
                  </div>
                </div>
                <span className="tc-mps-row__price">
                  {p.pricePerMeter > 0 ? `$${p.pricePerMeter.toFixed(2)}` : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
