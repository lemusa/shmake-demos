import { ShoppingCart, AlertTriangle } from 'lucide-react';
import { formatLength, toDisplayValue } from '../lib/cuttingAlgorithm';
import { getProductLabel } from '../config/embedConfig';
import { COMPONENT_COLORS } from './WallPreview';

function WallStockBar({ piece, unit }) {
  const toDisplay = (mm) => toDisplayValue(mm, unit);
  const segments = [];

  piece.cuts.forEach((cut, idx) => {
    const widthPercent = (cut.actual / piece.stockLength) * 100;
    const bg = cut.component ? COMPONENT_COLORS[cut.component] : undefined;
    segments.push(
      <div key={`cut-${idx}`} className="tc-bar__cut"
        style={{ width: `${widthPercent}%`, ...(bg ? { background: bg } : {}) }}>
        {toDisplay(cut.actual)}
      </div>
    );
    if (idx < piece.cuts.length - 1 && piece.kerfLoss > 0) {
      const kerfPercent = ((piece.kerfLoss / (piece.cuts.length - 1)) / piece.stockLength) * 100;
      segments.push(
        <div key={`kerf-${idx}`} className="tc-bar__kerf" style={{ width: `${kerfPercent}%` }} />
      );
    }
  });

  if (piece.offcut > 0) {
    const offcutPercent = (piece.offcut / piece.stockLength) * 100;
    segments.push(
      <div key="offcut"
        className={`tc-bar__offcut ${piece.isUsableOffcut ? 'tc-bar__offcut--usable' : 'tc-bar__offcut--scrap'}`}
        style={{ width: `${offcutPercent}%` }}>
        {toDisplay(piece.offcut)}
      </div>
    );
  }

  return segments;
}

export default function WallResults({
  wallResults,
  unit,
  showCosting,
  showGstInclusive,
  configSettings,
  formatCurrency,
}) {
  if (!wallResults) return null;

  const { componentPlans, combinedSummary } = wallResults;

  // Build combined shopping list
  const shoppingList = [];

  componentPlans.forEach(plan => {
    if (!plan.result?.summary?.stockUsed) return;
    Object.entries(plan.result.summary.stockUsed).forEach(([length, qty]) => {
      shoppingList.push({
        label: getProductLabel(plan.product),
        length: Number(length),
        qty,
      });
    });
  });

  return (
    <div className="tc-wall-results">
      {/* Wall Summary Stats */}
      <div className="tc-summary tc-summary--fence">
        <div className="tc-stat">
          <div className="tc-stat__value">{combinedSummary.wallCount || 1}</div>
          <div className="tc-stat__label">Wall{(combinedSummary.wallCount || 1) !== 1 ? 's' : ''}</div>
        </div>
        <div className="tc-stat">
          <div className="tc-stat__value">{combinedSummary.fullStuds + combinedSummary.trimmerStuds}</div>
          <div className="tc-stat__label">Studs</div>
        </div>
        <div className="tc-stat">
          <div className="tc-stat__value">{combinedSummary.bottomPlates + combinedSummary.topPlates}</div>
          <div className="tc-stat__label">Plates</div>
        </div>
        {combinedSummary.lintels > 0 && (
          <div className="tc-stat">
            <div className="tc-stat__value">{combinedSummary.lintels}</div>
            <div className="tc-stat__label">Lintels</div>
          </div>
        )}
        <div className="tc-stat">
          <div className="tc-stat__value">{combinedSummary.totalMembers}</div>
          <div className="tc-stat__label">Total pcs</div>
        </div>
        {showCosting && combinedSummary.totalCost > 0 && (
          <div className="tc-stat tc-stat--accent">
            <div className="tc-stat__value">{formatCurrency(combinedSummary.totalCost)}</div>
            <div className="tc-stat__label">Total {showGstInclusive ? 'incl' : 'excl'} GST</div>
          </div>
        )}
      </div>

      {/* Per-component cutting plans */}
      {componentPlans.map((plan, idx) => (
        <div key={idx} className="tc-fencing-component-plan"
          style={{ '--tc-wall-cut-color': COMPONENT_COLORS[plan.component] || undefined }}>
          <div className="tc-fencing-component-header">
            <span className="tc-fencing-component-header__title">
              {plan.label}
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
                    <div className="tc-bar">
                      <WallStockBar piece={piece} unit={unit} />
                    </div>
                  </div>
                  <div className="tc-col-plan-eff">{piece.efficiency}%</div>
                </div>
              ))}
            </div>
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
    </div>
  );
}
