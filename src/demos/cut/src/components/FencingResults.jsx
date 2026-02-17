import { ShoppingCart, AlertTriangle } from 'lucide-react';
import { formatLength } from '../lib/cuttingAlgorithm';
import { getProductLabel } from '../config/embedConfig';

export default function FencingResults({
  fencingResults,
  renderStockBar,
  unit,
  showCosting,
  showGstInclusive,
  configSettings,
  formatCurrency,
}) {
  if (!fencingResults) return null;

  const { componentPlans, quantityItems, combinedSummary } = fencingResults;

  // Build combined shopping list
  const shoppingList = [];

  componentPlans.forEach(plan => {
    if (!plan.result?.summary?.stockUsed) return;
    Object.entries(plan.result.summary.stockUsed).forEach(([length, qty]) => {
      shoppingList.push({
        label: getProductLabel(plan.product),
        length: Number(length),
        qty,
        type: 'stock',
      });
    });
  });

  quantityItems.forEach(item => {
    shoppingList.push({
      label: getProductLabel(item.product),
      length: item.cutLength,
      qty: item.qty,
      type: 'quantity',
      note: item.note,
    });
  });

  return (
    <>
      {/* Fence Summary Stats */}
      <div className="tc-summary tc-summary--fence">
        <div className="tc-stat">
          <div className="tc-stat__value">{combinedSummary.totalLengthM.toFixed(1)}m</div>
          <div className="tc-stat__label">Fence</div>
        </div>
        <div className="tc-stat">
          <div className="tc-stat__value">{combinedSummary.totalPosts}</div>
          <div className="tc-stat__label">Posts</div>
        </div>
        <div className="tc-stat">
          <div className="tc-stat__value">{combinedSummary.totalRailCuts}</div>
          <div className="tc-stat__label">Rails</div>
        </div>
        {combinedSummary.totalPalings > 0 && (
          <div className="tc-stat">
            <div className="tc-stat__value">{combinedSummary.totalPalings}</div>
            <div className="tc-stat__label">Palings</div>
          </div>
        )}
        {showCosting && combinedSummary.totalCost > 0 && (
          <div className="tc-stat tc-stat--accent">
            <div className="tc-stat__value">{formatCurrency(combinedSummary.totalCost)}</div>
            <div className="tc-stat__label">Total {showGstInclusive ? 'incl' : 'excl'} GST</div>
          </div>
        )}
      </div>

      {/* Per-component cutting plans */}
      {componentPlans.map((plan, idx) => (
        <div key={idx} className="tc-fencing-component-plan">
          <div className="tc-fencing-component-header">
            <span className="tc-fencing-component-header__title">
              {plan.label}
              {plan.mitreEnabled && <span className="tc-mitre-badge">45°</span>}
            </span>
            {plan.result?.summary && (
              <span className="tc-fencing-component-header__stats">
                {plan.result.summary.totalCutsMade} pcs &middot; {plan.result.summary.overallEfficiency}% eff
                {showCosting && plan.result.summary.totalStockCost > 0 &&
                  ` · ${formatCurrency(plan.result.summary.totalStockCost)}`}
              </span>
            )}
          </div>

          {/* Stock required pills */}
          {plan.result?.summary?.stockUsed && (
            <div className="tc-stock-used tc-stock-used--compact">
              <div className="tc-stock-used__list">
                {Object.entries(plan.result.summary.stockUsed).map(([l, q]) => (
                  <div key={l} className="tc-stock-used__item">
                    <span className="tc-stock-used__qty">{q}&times;</span>
                    <span className="tc-stock-used__length">{formatLength(Number(l), unit)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cutting plan rows */}
          <div className="tc-plan">
            <div className="tc-plan-header">
              <div className="tc-col-plan-qty">Qty</div>
              <div className="tc-col-plan-stock">Stock</div>
              <div className="tc-col-plan-bar">Cuts</div>
              <div className="tc-col-plan-eff">Eff.</div>
            </div>
            <div className="tc-plan-body">
              {plan.groupedPlan.map((piece, pIdx) => (
                <div key={pIdx} className="tc-plan-row">
                  <div className="tc-col-plan-qty">{piece.qty}&times;</div>
                  <div className="tc-col-plan-stock">{formatLength(piece.rawStockLength, unit)}</div>
                  <div className="tc-col-plan-bar">
                    <div className={`tc-bar ${plan.mitreEnabled ? 'tc-bar--mitre' : ''}`}>
                      {renderStockBar(piece)}
                    </div>
                  </div>
                  <div className="tc-col-plan-eff">{piece.efficiency}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Quantity-only items */}
      {quantityItems.length > 0 && quantityItems.map((item, idx) => (
        <div key={idx} className="tc-fencing-quantity-item">
          <div className="tc-fencing-quantity-item__top">
            <span className="tc-fencing-quantity-item__qty">{item.qty} &times;</span>
            <span className="tc-fencing-quantity-item__label">{item.label}</span>
          </div>
          <div className="tc-fencing-quantity-item__bottom">
            <span className="tc-fencing-quantity-item__note">{item.note}</span>
            {showCosting && item.totalCost > 0 && (
              <span className="tc-fencing-quantity-item__cost">{formatCurrency(item.totalCost)}</span>
            )}
          </div>
        </div>
      ))}

      {/* Combined Shopping List */}
      {shoppingList.length > 0 && (
        <div className="tc-fencing-shopping-list">
          <div className="tc-fencing-shopping-list__title">
            <ShoppingCart size={14} />
            <span>Shopping List</span>
          </div>
          <div className="tc-fencing-shopping-list__items">
            {shoppingList.map((item, idx) => (
              <div key={idx} className="tc-fencing-shopping-item">
                <span className="tc-fencing-shopping-item__qty">{item.qty}&times;</span>
                <span className="tc-fencing-shopping-item__desc">
                  {item.label} @ {formatLength(item.length, unit)}
                </span>
                {item.note && <span className="tc-fencing-shopping-item__note">{item.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {configSettings?.disclaimer && (
        <div className="tc-disclaimer">
          <AlertTriangle size={14} />
          <p>{configSettings.disclaimer}</p>
        </div>
      )}
    </>
  );
}
