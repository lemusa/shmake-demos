import { jsPDF } from 'jspdf';

/**
 * Load an image from URL and convert to base64 for jsPDF
 */
async function loadImageFromUrl(url) {
  if (!url) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve({
          dataUrl,
          width: img.width,
          height: img.height
        });
      } catch (err) {
        console.warn('Failed to convert image to base64:', err);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.warn('Failed to load image from URL:', url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Generate a PDF cutting plan (supports single or multi-plan)
 *
 * @param {Object} options
 * @param {Object} options.jobDetails - Job info (jobNumber, productName, customer)
 * @param {Array}  [options.plans] - Array of plan sections (multi-product mode)
 * @param {Object} [options.result] - Legacy: single calculation result
 * @param {Array}  [options.groupedPlan] - Legacy: single grouped patterns
 * @param {string} options.unit - Display unit (mm, m, inch, foot)
 * @param {Object} options.settings - Optimizer settings
 * @param {Object} options.companyData - Company information
 * @param {Object} options.brandingData - Branding with letterhead, pdfColors
 * @param {string} options.disclaimer - Disclaimer text to display on PDF
 * @param {Function} options.formatLength - Length formatting function
 * @param {string} [options.gstLabel] - GST label to show in footer
 * @param {Object} [options.wallSpec] - Wall specification (walls mode)
 */
export async function generateCuttingPlanPDF({
  jobDetails,
  plans,
  result,
  groupedPlan,
  unit,
  settings,
  companyData,
  brandingData,
  disclaimer,
  formatLength,
  gstLabel,
  fenceSpec,
  wallSpec,
  quantityItems,
  combinedSummary,
  previewImages,
}) {
  // Normalise to plans array for unified handling
  const allPlans = plans || [{
    label: jobDetails?.productName || 'Cutting Plan',
    result,
    groupedPlan,
    settings,
    unit,
  }];

  const isMulti = allPlans.length > 1;

  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Colors - matching the tool UI
  const primaryColor = hexToRgb(brandingData?.pdfColors?.primary || '#333333');
  const textDark = [30, 30, 30];
  const textMuted = [100, 100, 100];
  const headerBg = [51, 51, 51];
  const altRowBg = [250, 250, 250];

  // Bar colors - matching tool CSS variables
  const colorCut = [34, 197, 94];      // --color-success-500 (green)
  const colorKerf = [38, 38, 38];      // --color-neutral-800 (dark)
  const colorUsable = [245, 158, 11];  // --color-warning-500 (amber)
  const colorScrap = [239, 68, 68];    // --color-error-500 (red)
  const colorQty = [22, 163, 74];      // --color-success-600 (green for qty text)
  const colorMitre = [42, 90, 143];    // --tc-primary-light (blue mitre indicator)

  // Source colors — varied greens/teals for distinguishing section/wall origin
  const sourceColors = [
    [34, 197, 94],   // S1/W1 — green (same as default cut)
    [16, 185, 129],  // S2/W2 — emerald
    [20, 184, 166],  // S3/W3 — teal
    [59, 130, 246],  // S4/W4 — blue
    [168, 85, 247],  // S5/W5 — purple
  ];

  const colWidths = { check: 10, qty: 12, stock: 20, cuts: 63, bar: 50, offcut: 18, eff: 13 };
  const rowHeight = 7;

  let currentY = 0;

  // Pre-load logo image if available
  let logoImage = null;
  if (companyData?.logo) {
    logoImage = await loadImageFromUrl(companyData.logo);
  }

  // ============================================
  // HEADER: Logo + Company Name + Contact Details
  // ============================================

  {
    const headerHeight = 22;
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    let leftX = margin;

    // Logo — constrain to header height with padding
    if (logoImage) {
      const logoMaxH = headerHeight - 6;
      const logoAspect = logoImage.width / logoImage.height;
      const logoH = logoMaxH;
      const logoW = logoH * logoAspect;
      doc.addImage(logoImage.dataUrl, 'PNG', leftX, 3, logoW, logoH);
      leftX += logoW + 6;
    }

    // Company name
    const companyName = companyData?.tradingAs || companyData?.name;
    if (companyName) {
      doc.setFontSize(logoImage ? 11 : 14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(companyName, leftX, headerHeight / 2 + 2);
    }

    // Contact details on right side
    const contactParts = [];
    if (companyData?.phone) contactParts.push(companyData.phone);
    if (companyData?.email) contactParts.push(companyData.email);
    if (companyData?.website) contactParts.push(companyData.website.replace(/^https?:\/\//, ''));

    if (contactParts.length > 0) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      const contactText = contactParts.join('  |  ');
      doc.text(contactText, pageWidth - margin, headerHeight / 2 + 2, { align: 'right' });
    }

    // "CUTTING PLAN" subtitle below company name if logo present
    if (!companyName && !logoImage) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('CUTTING PLAN', margin, headerHeight / 2 + 2);
    }

    currentY = headerHeight + 4;
  }

  // ============================================
  // DATE ROW + DIVIDER
  // ============================================

  const today = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(today, pageWidth - margin, currentY, { align: 'right' });

  currentY += 4;

  // Divider
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 6;

  // ============================================
  // JOB INFO ROW
  // ============================================

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);

  let infoX = margin;
  if (jobDetails?.jobNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text('Job:', infoX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(jobDetails.jobNumber, infoX + 10, currentY);
    infoX += 10 + doc.getTextWidth(jobDetails.jobNumber) + 8;
  }
  if (!isMulti && jobDetails?.productName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Product:', infoX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(jobDetails.productName, infoX + 16, currentY);
    infoX += 16 + doc.getTextWidth(jobDetails.productName) + 8;
  }
  if (jobDetails?.customer) {
    doc.setFont('helvetica', 'bold');
    doc.text('Customer:', infoX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(jobDetails.customer, infoX + 18, currentY);
  }

  // Combined summary on right (for multi-plan, aggregate; for single, use plan's result)
  if (isMulti) {
    const totals = aggregateSummaries(allPlans);
    doc.setTextColor(...textMuted);
    const summaryText = `${totals.totalCuts} pcs | ${totals.totalPieces} stock | ${allPlans.length} products | ${totals.efficiency}% eff.`;
    doc.text(summaryText, pageWidth - margin, currentY, { align: 'right' });
  } else {
    const singleResult = allPlans[0].result;
    if (singleResult?.summary) {
      doc.setTextColor(...textMuted);
      const summaryText = `${singleResult.summary.totalCutsMade} pcs | ${singleResult.summary.totalPieces} stock | ${singleResult.summary.overallEfficiency}% eff.`;
      doc.text(summaryText, pageWidth - margin, currentY, { align: 'right' });
    }
  }

  currentY += 8;

  // ============================================
  // FENCE SUMMARY & SPECIFICATION (optional)
  // ============================================

  if (combinedSummary && fenceSpec) {
    // Fence summary stats row — matching the UI stat cards
    const stats = [];
    stats.push(`${combinedSummary.totalLengthM?.toFixed(1) || '0'}m Fence`);
    if (combinedSummary.totalPosts) stats.push(`${combinedSummary.totalPosts} Posts`);
    if (combinedSummary.totalRailCuts) stats.push(`${combinedSummary.totalRailCuts} Rails`);
    if (combinedSummary.totalPalings) stats.push(`${combinedSummary.totalPalings} Palings`);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(stats.join('  |  '), margin, currentY);

    if (gstLabel && combinedSummary.totalCost > 0) {
      doc.setTextColor(...primaryColor);
      doc.text(`$${combinedSummary.totalCost.toFixed(2)}  ${gstLabel}`, pageWidth - margin, currentY, { align: 'right' });
    }

    currentY += 5;
  }

  if (fenceSpec) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);

    const sectionDescs = (fenceSpec.sections || [])
      .filter(s => parseFloat(s.length) > 0)
      .map(s => `${s.label || 'Section'}: ${s.length}m \u00D7 ${s.height}mm`);

    if (sectionDescs.length > 0) {
      doc.text(sectionDescs.join('   |   '), margin, currentY);
      currentY += 5;
    }

    currentY += 3;
  }

  // ============================================
  // WALL SUMMARY & SPECIFICATION (optional)
  // ============================================

  if (wallSpec && combinedSummary) {
    const walls = wallSpec.walls || [];

    // Header line: wall count + total openings + total members
    const wallStats = [];
    wallStats.push(`${walls.length} Wall Panel${walls.length !== 1 ? 's' : ''}`);
    if (combinedSummary.openingCount > 0) {
      wallStats.push(`${combinedSummary.openingCount} Opening${combinedSummary.openingCount > 1 ? 's' : ''}`);
    }
    if (combinedSummary.totalMembers) wallStats.push(`${combinedSummary.totalMembers} Members`);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(wallStats.join('  |  '), margin, currentY);

    if (gstLabel && combinedSummary.totalCost > 0) {
      doc.setTextColor(...primaryColor);
      doc.text(`$${combinedSummary.totalCost.toFixed(2)}  ${gstLabel}`, pageWidth - margin, currentY, { align: 'right' });
    }

    currentY += 5;

    // Per-wall dimensions
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    const wallDescs = walls.map((w, i) => {
      const label = w.label || `Wall ${i + 1}`;
      const dims = `${formatLength(w.length, unit)} \u00D7 ${formatLength(w.height, unit)}`;
      const openings = w.openings?.length ? `, ${w.openings.length} opening${w.openings.length > 1 ? 's' : ''}` : '';
      return `${label}: ${dims}${openings}`;
    });
    doc.text(wallDescs.join('   |   '), margin, currentY);
    currentY += 5;

    // Detail line with member breakdown
    const details = [];
    if (combinedSummary.fullStuds) details.push(`${combinedSummary.fullStuds} Studs`);
    if (combinedSummary.topPlates) details.push(`${combinedSummary.topPlates + (combinedSummary.bottomPlates || 0)} Plates`);
    if (combinedSummary.trimmerStuds) details.push(`${combinedSummary.trimmerStuds} Trimmers`);
    if (combinedSummary.jackStuds) details.push(`${combinedSummary.jackStuds} Jacks`);
    if (combinedSummary.lintels) details.push(`${combinedSummary.lintels} Lintels`);
    if (combinedSummary.dwangs) details.push(`${combinedSummary.dwangs} Dwangs`);
    if (combinedSummary.crippleStudsAbove || combinedSummary.crippleStudsBelow) {
      details.push(`${(combinedSummary.crippleStudsAbove || 0) + (combinedSummary.crippleStudsBelow || 0)} Cripples`);
    }
    if (combinedSummary.sillTrimmers) details.push(`${combinedSummary.sillTrimmers} Sills`);

    if (details.length > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textMuted);
      doc.text(details.join('   |   '), margin, currentY);
      currentY += 5;
    }

    // Opening descriptions (all walls combined)
    const allOpenings = walls.flatMap(w => w.openings || []);
    if (allOpenings.length > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textMuted);

      const openingDescs = allOpenings.map(o => {
        const typeLabel = o.type === 'door' ? 'Door' : 'Window';
        return `${typeLabel}: ${formatLength(o.width, unit)} \u00D7 ${formatLength(o.height, unit)}`;
      });
      doc.text(openingDescs.join('   |   '), margin, currentY);
      currentY += 5;
    }

    currentY += 3;
  }

  // ============================================
  // RENDER PLAN SECTIONS
  // ============================================

  for (let planIdx = 0; planIdx < allPlans.length; planIdx++) {
    const plan = allPlans[planIdx];
    const planResult = plan.result;
    const planGrouped = plan.groupedPlan;
    const planSettings = plan.settings || settings;
    const planUnit = plan.unit || unit;

    // Section header for multi-plan mode
    if (isMulti) {
      // Check page space for section header + at least a few rows
      if (currentY + 25 > pageHeight - 20) {
        doc.addPage();
        currentY = 10;
      }

      // Accent bar + section title
      doc.setFillColor(...primaryColor);
      doc.rect(margin, currentY, 3, 8, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      const labelText = plan.label || `Plan ${planIdx + 1}`;
      doc.text(labelText, margin + 6, currentY + 6);

      // Mitre badge
      if (plan.mitreEnabled) {
        const labelWidth = doc.getTextWidth(labelText);
        const badgeX = margin + 6 + labelWidth + 3;
        doc.setFillColor(...colorMitre);
        doc.roundedRect(badgeX, currentY + 1.5, 10, 5, 1, 1, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('45\u00B0', badgeX + 2.2, currentY + 5);
      }

      // Mini summary on right
      if (planResult?.summary) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textMuted);
        let miniSummary = `${planResult.summary.totalCutsMade} pcs | ${planResult.summary.totalPieces} stock | ${planResult.summary.overallEfficiency}% eff.`;
        if (gstLabel && planResult.summary.totalStockCost > 0) {
          miniSummary += ` | $${planResult.summary.totalStockCost.toFixed(2)}`;
        }
        doc.text(miniSummary, pageWidth - margin, currentY + 6, { align: 'right' });
      }

      currentY += 12;
    }

    // Stock required
    if (planResult?.summary?.stockUsed) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('Stock:', margin, currentY);

      doc.setFont('helvetica', 'normal');
      let stockX = margin + 14;
      Object.entries(planResult.summary.stockUsed).forEach(([length, qty]) => {
        const stockText = `${qty}\u00D7 ${formatLength(Number(length), planUnit)}`;

        // Draw pill background
        const textWidth = doc.getTextWidth(stockText);
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(stockX - 1, currentY - 3.5, textWidth + 4, 5, 1, 1, 'F');

        doc.setTextColor(...textDark);
        doc.text(stockText, stockX + 1, currentY);
        stockX += textWidth + 8;
      });

      currentY += 8;
    }

    // ============================================
    // CUTTING PLAN TABLE
    // ============================================

    currentY = drawTableHeader(doc, currentY, margin, contentWidth, colWidths, headerBg);

    // Table rows
    doc.setFontSize(8);

    const validPlan = (planGrouped || []).filter(p => p && p.qty > 0 && p.cuts && p.cuts.length > 0);

    validPlan.forEach((piece, idx) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      // Pre-compute cuts text and wrapped lines to determine row height
      const hasSources = piece.cuts.some(c => c.source);
      const cutsText = piece.cuts.map(c => {
        const len = formatLength(c.actual, planUnit);
        return hasSources && c.source ? `${len}[${c.source}]` : len;
      }).join(' + ');
      const cutsLines = doc.splitTextToSize(cutsText, colWidths.cuts - 2);
      const lineHeight = 3.2;
      const cutsTextHeight = cutsLines.length * lineHeight;
      const dynamicRowHeight = Math.max(rowHeight, cutsTextHeight + 3);

      // Check for page break
      if (currentY + dynamicRowHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 10;
        currentY = drawTableHeaderCompact(doc, currentY, margin, contentWidth, colWidths, headerBg);
        doc.setFontSize(8);
      }

      // Alternating row background
      if (idx % 2 === 0) {
        doc.setFillColor(...altRowBg);
        doc.rect(margin, currentY - 1, contentWidth, dynamicRowHeight, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textDark);

      // Vertical center offset for single-height elements
      const vcenter = currentY + dynamicRowHeight / 2 + 1.5;

      let colX = margin + 2;

      // Checkbox
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      const boxSize = 2.5;
      doc.rect(colX + 3, vcenter - boxSize / 2 - 1, boxSize, boxSize, 'S');
      colX += colWidths.check;

      // Qty
      doc.setTextColor(...colorQty);
      doc.setFont('helvetica', 'bold');
      doc.text(`${piece.qty}\u00D7`, colX, vcenter);
      colX += colWidths.qty;

      // Stock
      doc.setTextColor(...textDark);
      doc.setFont('helvetica', 'normal');
      doc.text(formatLength(piece.rawStockLength, planUnit), colX, vcenter);
      colX += colWidths.stock;

      // Cuts — render wrapped lines
      doc.setTextColor(...textDark);
      doc.setFont('helvetica', 'normal');
      const cutsStartY = currentY + 4;
      cutsLines.forEach((line, lineIdx) => {
        doc.text(line, colX, cutsStartY + lineIdx * lineHeight);
      });
      colX += colWidths.cuts;

      // Visual bar — vertically centered
      const barWidth = colWidths.bar - 4;
      const barHeight = 3.5;
      const barY = vcenter - barHeight / 2 - 1;

      doc.setFillColor(238, 238, 238);
      doc.rect(colX, barY, barWidth, barHeight, 'F');

      let barX = colX;
      const kerfVal = planSettings?.kerf ?? settings?.kerf ?? 3;
      const cutPositions = []; // track cut positions for mitre indicators
      piece.cuts.forEach((cut, cutIdx) => {
        const cutWidth = (cut.actual / piece.stockLength) * barWidth;
        // Use source-based color if available
        if (hasSources && cut.source) {
          const srcIdx = parseInt(cut.source.replace(/\D/g, '')) - 1;
          doc.setFillColor(...(sourceColors[srcIdx % sourceColors.length] || colorCut));
        } else {
          doc.setFillColor(...colorCut);
        }
        doc.rect(barX, barY, cutWidth, barHeight, 'F');
        cutPositions.push({ x: barX, w: cutWidth });
        barX += cutWidth;

        if (cutIdx < piece.cuts.length - 1 && piece.kerfLoss > 0) {
          const kerfWidth = Math.max((kerfVal / piece.stockLength) * barWidth, 0.3);
          if (plan.mitreEnabled) {
            // Mitre kerf: blue diagonal line
            doc.setFillColor(...colorMitre);
            doc.rect(barX, barY, kerfWidth, barHeight, 'F');
            doc.setDrawColor(...colorMitre);
            doc.setLineWidth(0.3);
            doc.line(barX, barY + barHeight, barX + kerfWidth, barY);
          } else {
            doc.setFillColor(...colorKerf);
            doc.rect(barX, barY, kerfWidth, barHeight, 'F');
          }
          barX += kerfWidth;
        }
      });

      // Mitre indicators on cut edges (diagonal lines at each end)
      if (plan.mitreEnabled && cutPositions.length > 0) {
        doc.setDrawColor(...colorMitre);
        doc.setLineWidth(0.4);
        cutPositions.forEach(cp => {
          // Left edge diagonal
          doc.line(cp.x, barY + barHeight, cp.x + 1.2, barY);
          // Right edge diagonal
          const rx = cp.x + cp.w;
          doc.line(rx - 1.2, barY + barHeight, rx, barY);
        });
      }

      if (piece.offcut > 0) {
        const offcutWidth = (piece.offcut / piece.stockLength) * barWidth;
        if (piece.isUsableOffcut) {
          doc.setFillColor(...colorUsable);
        } else {
          doc.setFillColor(...colorScrap);
        }
        doc.rect(barX, barY, offcutWidth, barHeight, 'F');
      }

      colX += colWidths.bar;

      // Offcut value
      if (piece.offcut > 0) {
        if (piece.isUsableOffcut) {
          doc.setTextColor(217, 119, 6);
        } else {
          doc.setTextColor(150, 150, 150);
        }
        doc.text(formatLength(piece.offcut, planUnit), colX, vcenter);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('\u2014', colX, vcenter);
      }
      colX += colWidths.offcut;

      // Efficiency
      doc.setTextColor(...textDark);
      doc.text(`${piece.efficiency}%`, colX, vcenter);

      currentY += dynamicRowHeight;
    });

    // Spacing between plan sections
    if (isMulti && planIdx < allPlans.length - 1) {
      currentY += 6;
    }
  }

  // ============================================
  // QUANTITY-ONLY ITEMS (fencing mode)
  // ============================================

  if (quantityItems && quantityItems.length > 0) {
    if (currentY + 15 > pageHeight - 20) {
      doc.addPage();
      currentY = 10;
    }

    currentY += 4;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text('Quantity Items (Purchase at Length)', margin, currentY);
    currentY += 6;

    quantityItems.forEach(item => {
      if (currentY + 10 > pageHeight - 20) {
        doc.addPage();
        currentY = 10;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorQty);
      doc.text(`${item.qty}\u00D7`, margin + 2, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textDark);
      doc.text(item.label, margin + 14, currentY);

      if (item.totalCost > 0) {
        doc.setTextColor(...textMuted);
        doc.text(`$${item.totalCost.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
      }

      currentY += 4;
      doc.setFontSize(7);
      doc.setTextColor(...textMuted);
      doc.text(item.note || '', margin + 14, currentY);
      currentY += 6;
    });
  }

  // ============================================
  // SHOPPING LIST (fencing / walls mode)
  // ============================================

  if (combinedSummary && allPlans.length > 1) {
    const shoppingList = [];

    allPlans.forEach(plan => {
      if (!plan.result?.summary?.stockUsed) return;
      const label = plan.label?.replace(/^(Posts|Rails|Cladding|Capping|Plates|Framing|Lintels)\s*—\s*/, '') || '';
      Object.entries(plan.result.summary.stockUsed).forEach(([length, qty]) => {
        shoppingList.push({ label, length: Number(length), qty });
      });
    });

    if (quantityItems) {
      quantityItems.forEach(item => {
        shoppingList.push({ label: item.label, length: item.cutLength, qty: item.qty, note: item.note });
      });
    }

    if (shoppingList.length > 0) {
      if (currentY + 15 > pageHeight - 20) {
        doc.addPage();
        currentY = 10;
      }

      currentY += 4;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('Shopping List', margin, currentY);
      currentY += 6;

      shoppingList.forEach(item => {
        if (currentY + 6 > pageHeight - 20) {
          doc.addPage();
          currentY = 10;
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorQty);
        doc.text(`${item.qty}\u00D7`, margin + 2, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textDark);
        const desc = item.length
          ? `${item.label} @ ${formatLength(item.length, unit)}`
          : item.label;
        doc.text(desc, margin + 14, currentY);

        if (item.note) {
          doc.setFontSize(7);
          doc.setTextColor(...textMuted);
          doc.text(item.note, margin + 14 + doc.getTextWidth(desc) + 4, currentY);
        }

        currentY += 5;
      });

      currentY += 2;
    }
  }

  // ============================================
  // DISCLAIMER
  // ============================================

  const disclaimerText = disclaimer || 'This cutting plan provides estimates only. Always verify quantities with a qualified builder or supplier before purchasing. Actual requirements may vary based on site conditions, waste, and cutting accuracy. This tool does not assess structural adequacy or building code compliance.';

  if (currentY + 20 > pageHeight - 18) {
    doc.addPage();
    currentY = 10;
  }

  currentY += 4;

  const disclaimerBoxHeight = 14;
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 230, 138);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, disclaimerBoxHeight, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('\u26A0', margin + 3, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(146, 64, 14);
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth - 12);
  doc.text(splitDisclaimer, margin + 8, currentY + 4.5);

  currentY += disclaimerBoxHeight + 2;

  // ============================================
  // FOOTER
  // ============================================

  currentY = Math.min(currentY + 4, pageHeight - 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);

  // Use first plan's settings for the footer line (or the passed-in settings)
  const footerSettings = allPlans[0]?.settings || settings || {};
  const footerUnit = allPlans[0]?.unit || unit;
  let settingsText = `Kerf: ${formatLength(footerSettings.kerf || 3, footerUnit)} | Min offcut: ${formatLength(footerSettings.minOffcut || 200, footerUnit)} | End trim: ${formatLength(footerSettings.endTrim || 0, footerUnit)}/end`;
  if (gstLabel) {
    settingsText += ` | ${gstLabel}`;
  }
  doc.text(settingsText, margin, currentY);

  // Legend on right
  const legendY = currentY;
  let legendX = pageWidth - margin;
  const squareSize = 2.5;
  const squareY = legendY - 2.5;

  doc.setFontSize(8);

  doc.setFillColor(...colorScrap);
  doc.rect(legendX - 15, squareY, squareSize, squareSize, 'F');
  doc.setTextColor(...textMuted);
  doc.text('Scrap', legendX - 11.5, legendY);
  legendX -= 22;

  doc.setFillColor(...colorUsable);
  doc.rect(legendX - 17, squareY, squareSize, squareSize, 'F');
  doc.text('Usable', legendX - 13.5, legendY);
  legendX -= 24;

  doc.setFillColor(...colorKerf);
  doc.rect(legendX - 12, squareY, squareSize, squareSize, 'F');
  doc.text('Kerf', legendX - 8.5, legendY);
  legendX -= 19;

  doc.setFillColor(...colorCut);
  doc.rect(legendX - 10, squareY, squareSize, squareSize, 'F');
  doc.text('Cut', legendX - 6.5, legendY);

  // Mitre legend entry if any plan uses mitres
  if (allPlans.some(p => p.mitreEnabled)) {
    legendX -= 20;
    doc.setFillColor(...colorMitre);
    doc.rect(legendX - 14, squareY, squareSize, squareSize, 'F');
    doc.setDrawColor(...colorMitre);
    doc.setLineWidth(0.3);
    doc.line(legendX - 14, squareY + squareSize, legendX - 14 + squareSize, squareY);
    doc.text('Mitre', legendX - 10.5, legendY);
  }

  // Source legend — show section/wall color key when cuts have source tags
  const allSources = new Set();
  allPlans.forEach(p => {
    (p.groupedPlan || []).forEach(piece => {
      piece.cuts?.forEach(c => { if (c.source) allSources.add(c.source); });
    });
  });

  if (allSources.size > 1) {
    currentY = Math.min(currentY + 5, pageHeight - 6);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text('Sources:', margin, currentY);

    let srcX = margin + 16;
    const sortedSources = [...allSources].sort();
    sortedSources.forEach(src => {
      const srcIdx = parseInt(src.replace(/\D/g, '')) - 1;
      const srcColor = sourceColors[srcIdx % sourceColors.length] || colorCut;
      doc.setFillColor(...srcColor);
      doc.rect(srcX, currentY - 2.5, squareSize, squareSize, 'F');
      doc.setTextColor(...textDark);

      // Show full section/wall label from spec if available
      let srcLabel = src;
      if (fenceSpec?.sections) {
        const idx = srcIdx;
        const sec = (fenceSpec.sections.filter(s => parseFloat(s.length) > 0))[idx];
        if (sec?.label) srcLabel = `${src} ${sec.label}`;
      } else if (wallSpec?.walls) {
        const w = wallSpec.walls[srcIdx];
        if (w?.label) srcLabel = `${src} ${w.label}`;
      }

      doc.text(srcLabel, srcX + 4, currentY);
      srcX += 4 + doc.getTextWidth(srcLabel) + 6;
    });
  }

  // ============================================
  // PREVIEW IMAGE PAGES
  // ============================================

  if (previewImages && previewImages.length > 0) {
    previewImages.forEach(img => {
      // Landscape orientation — plans are inherently wider than tall
      doc.addPage('a4', 'landscape');
      const lPageWidth = doc.internal.pageSize.getWidth();
      const lPageHeight = doc.internal.pageSize.getHeight();
      const lContentWidth = lPageWidth - margin * 2;
      let imgY = 12;

      // Page title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text(img.label || 'Preview', margin, imgY);
      imgY += 8;

      // Thin divider
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.3);
      doc.line(margin, imgY, lPageWidth - margin, imgY);
      imgY += 6;

      // Fit image to page width, respecting aspect ratio
      const aspectRatio = img.width / img.height;
      const maxImgWidth = lContentWidth;
      const maxImgHeight = lPageHeight - imgY - 15;
      let imgWidth = maxImgWidth;
      let imgHeight = imgWidth / aspectRatio;

      // If too tall, constrain by height instead
      if (imgHeight > maxImgHeight) {
        imgHeight = maxImgHeight;
        imgWidth = imgHeight * aspectRatio;
      }

      // Center horizontally if narrower than content width
      const imgX = margin + (lContentWidth - imgWidth) / 2;

      doc.addImage(img.dataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight);
    });
  }

  // ============================================
  // SAVE
  // ============================================

  const jobNum = jobDetails?.jobNumber?.replace(/[^a-zA-Z0-9]/g, '_') || 'CuttingPlan';
  const filename = `CuttingPlan_${jobNum}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);

  return filename;
}

// ============================================
// TABLE HEADER HELPERS
// ============================================

function drawTableHeader(doc, y, margin, contentWidth, colWidths, headerBg) {
  doc.setFillColor(...headerBg);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  let colX = margin + 2;

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.rect(colX + 3, y + 2, 3, 3, 'S');
  colX += colWidths.check;
  doc.text('Qty', colX, y + 5);
  colX += colWidths.qty;
  doc.text('Stock', colX, y + 5);
  colX += colWidths.stock;
  doc.text('Cuts', colX, y + 5);
  colX += colWidths.cuts;
  doc.text('Pattern', colX, y + 5);
  colX += colWidths.bar;
  doc.text('Offcut', colX, y + 5);
  colX += colWidths.offcut;
  doc.text('Eff', colX, y + 5);

  return y + 9;
}

function drawTableHeaderCompact(doc, y, margin, contentWidth, colWidths, headerBg) {
  doc.setFillColor(...headerBg);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  let colX = margin + 2;
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.rect(colX + 3, y + 1.5, 2.5, 2.5, 'S');
  colX += colWidths.check;
  doc.text('Qty', colX, y + 4);
  colX += colWidths.qty;
  doc.text('Stock', colX, y + 4);
  colX += colWidths.stock;
  doc.text('Cuts', colX, y + 4);
  colX += colWidths.cuts;
  doc.text('Pattern', colX, y + 4);
  colX += colWidths.bar;
  doc.text('Offcut', colX, y + 4);
  colX += colWidths.offcut;
  doc.text('Eff', colX, y + 4);

  return y + 7;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function aggregateSummaries(plans) {
  let totalCuts = 0;
  let totalPieces = 0;
  let totalCutLength = 0;
  let totalStockLength = 0;

  for (const plan of plans) {
    const s = plan.result?.summary;
    if (!s) continue;
    totalCuts += s.totalCutsMade || 0;
    totalPieces += s.totalPieces || 0;
    totalCutLength += s.totalCutLength || 0;
    totalStockLength += s.totalStockLength || 0;
  }

  const efficiency = totalStockLength > 0
    ? ((totalCutLength / totalStockLength) * 100).toFixed(1)
    : '0.0';

  return { totalCuts, totalPieces, efficiency };
}

function hexToRgb(hex) {
  if (!hex) return [51, 51, 51];
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  return [r, g, b];
}

function truncateText(text, maxWidth, doc) {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidth) return text;

  let truncated = text;
  while (doc.getTextWidth(truncated + '\u2026') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '\u2026';
}
