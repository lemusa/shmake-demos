const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageBreak, PageNumber, ExternalHyperlink,
  LevelFormat, TabStopType, TabStopPosition,
} = require('docx');

// ============================================
// BRANDING
// ============================================
const BRAND = {
  primary: '1E3A5F',
  primaryLight: '2A5A8F',
  accent: 'D97706',
  dark: '111827',
  muted: '6B7280',
  light: 'F3F4F6',
  white: 'FFFFFF',
};

const border = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
};
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

// A4 dimensions
const PAGE_WIDTH = 11906;
const MARGIN = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ============================================
// HELPER FUNCTIONS
// ============================================

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    ...opts,
    children: [new TextRun({ size: 22, color: BRAND.dark, font: 'Arial', ...opts.run, text })],
  });
}

function bodyRuns(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    ...opts,
    children: runs.map(r => new TextRun({ size: 22, color: BRAND.dark, font: 'Arial', ...r })),
  });
}

function spacer(pts = 120) {
  return new Paragraph({ spacing: { after: pts }, children: [] });
}

function featureRow(title, desc) {
  return new TableRow({
    children: [
      new TableCell({
        borders, cellMargins,
        width: { size: 2800, type: WidthType.DXA },
        shading: { fill: BRAND.light, type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 22, font: 'Arial', color: BRAND.dark })] })],
      }),
      new TableCell({
        borders, cellMargins,
        width: { size: CONTENT_WIDTH - 2800, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: desc, size: 22, font: 'Arial', color: BRAND.dark })] })],
      }),
    ],
  });
}

// ============================================
// BUILD DOCUMENT
// ============================================

async function build() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22, color: BRAND.dark } },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 36, bold: true, font: 'Arial', color: BRAND.primary },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, font: 'Arial', color: BRAND.primary },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, font: 'Arial', color: BRAND.dark },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: 'numbers',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: 'numbers2',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [
      // ============================================
      // COVER PAGE
      // ============================================
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: 16838 },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children: [
          spacer(2400),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 80 },
            children: [new TextRun({ text: 'SHMAKECUT', size: 20, bold: true, font: 'Arial', color: BRAND.muted, characterSpacing: 200 })],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND.primary, space: 8 } },
            children: [new TextRun({ text: 'Wholesaler Integration Guide', size: 56, bold: true, font: 'Arial', color: BRAND.primary })],
          }),
          spacer(200),
          body('White-label cutting calculator for your website', { run: { size: 28, color: BRAND.muted, italics: true } }),
          spacer(400),
          bodyRuns([
            { text: 'Version 1.0', size: 22, color: BRAND.muted },
          ]),
          bodyRuns([
            { text: 'February 2026', size: 22, color: BRAND.muted },
          ]),
          bodyRuns([
            { text: 'Confidential', size: 22, color: BRAND.accent, bold: true },
          ]),
        ],
      },

      // ============================================
      // MAIN CONTENT
      // ============================================
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: 16838 },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB', space: 4 } },
              children: [
                new TextRun({ text: 'shmakeCut', size: 18, bold: true, font: 'Arial', color: BRAND.primary }),
                new TextRun({ text: '\tWholesaler Integration Guide', size: 18, font: 'Arial', color: BRAND.muted }),
              ],
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB', space: 4 } },
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: 'Page ', size: 18, color: BRAND.muted, font: 'Arial' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: BRAND.muted, font: 'Arial' }),
              ],
            })],
          }),
        },
        children: [
          // --- WHAT IS SHMAKECUT ---
          heading('What is shmakeCut?'),
          body('shmakeCut is an embeddable cutting calculator that helps your customers work out exactly how much timber they need before they buy. It runs directly on your website, branded in your colours, with your product catalogue built in.'),
          body('Your customers enter their required cut lengths, the calculator optimises the cuts across your available stock lengths, and outputs a clear cutting plan with a shopping list of products they need to purchase.'),
          body('The result: customers stay on your site longer, spend less time calling your team for help with quantities, and arrive at the counter with a clear list of what they need. For you, that means higher conversion, larger basket sizes, and fewer returns from over- or under-ordering.'),

          spacer(200),
          heading('Key Features'),
          new Table({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            columnWidths: [2800, CONTENT_WIDTH - 2800],
            rows: [
              featureRow('Product Catalogue', 'Your timber species, treatment levels, profiles, and stock lengths. Customers select a product and the available lengths auto-populate.'),
              featureRow('Cut Optimisation', 'Algorithm minimises waste by finding the most efficient combination of cuts across stock lengths. Handles kerf width, end trim, and minimum offcut thresholds.'),
              featureRow('Visual Cutting Plan', 'Colour-coded bar chart showing each stock piece with cuts, kerf, usable offcuts, and scrap clearly visualised.'),
              featureRow('Costing', 'Optional cost calculation based on your price-per-metre rates. Customers see estimated material cost before purchasing.'),
              featureRow('PDF Export', 'Downloadable cutting plan with your branding. Includes disclaimer, visual bars, and a summary for the customer to bring to the counter.'),
              featureRow('CSV Import', 'Customers can paste or upload a cut list from their plans, speeding up data entry for larger projects.'),
              featureRow('Mobile Responsive', 'Works on desktop, tablet, and mobile. Your customers can plan their project from the building site.'),
              featureRow('White-Label', 'Your logo, your colours, your fonts. Customers see your brand, not ours. A subtle "Powered by shmakeCut" link is the only indication.'),
            ],
          }),

          // --- HOW IT WORKS ---
          new Paragraph({ children: [new PageBreak()] }),
          heading('How It Works'),

          heading('For Your Customers', HeadingLevel.HEADING_2),
          new Paragraph({
            numbering: { reference: 'numbers', level: 0 },
            spacing: { after: 100 },
            children: [new TextRun({ text: 'Select a product category (Framing, Decking, Fencing, etc.)', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers', level: 0 },
            spacing: { after: 100 },
            children: [new TextRun({ text: 'Choose the specific timber product (species, treatment, profile)', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers', level: 0 },
            spacing: { after: 100 },
            children: [new TextRun({ text: 'Enter the lengths and quantities they need to cut', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers', level: 0 },
            spacing: { after: 100 },
            children: [new TextRun({ text: 'Click Calculate to generate an optimised cutting plan', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers', level: 0 },
            spacing: { after: 160 },
            children: [new TextRun({ text: 'Review the shopping list and optionally export a PDF', size: 22, font: 'Arial' })],
          }),

          body('The shopping list shows exactly which stock lengths to buy and how many of each, making it easy to add to their order.'),

          heading('For Your Team', HeadingLevel.HEADING_2),
          body('You manage your product catalogue, pricing, and branding through a simple admin panel. Changes take effect immediately on the live embed. You can add or remove products, adjust stock lengths as availability changes, and update pricing at any time.'),

          // --- INTEGRATION ---
          heading('Integration'),
          body('Adding shmakeCut to your website takes a single line of code:'),

          new Paragraph({
            spacing: { before: 100, after: 100 },
            children: [new TextRun({
              text: '<div id="shmakecut"></div>',
              font: 'Courier New', size: 20, color: BRAND.dark,
            })],
            shading: { fill: BRAND.light, type: ShadingType.CLEAR },
            indent: { left: 360 },
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [new TextRun({
              text: '<script src="https://app.shmakecut.co.nz/embed/shmakecut.iife.js" data-key="YOUR_KEY"></script>',
              font: 'Courier New', size: 20, color: BRAND.dark,
            })],
            shading: { fill: BRAND.light, type: ShadingType.CLEAR },
            indent: { left: 360 },
          }),

          body('The script loads asynchronously, fetches your brand configuration, and renders the calculator into the target element. It does not interfere with your existing page styles or scripts.'),
          body('For platforms like Shopify, Squarespace, or WordPress, the embed code can be placed in a Custom HTML block or page template. We provide platform-specific instructions on request.'),

          // --- BRANDING ---
          heading('Branding & Theming'),
          body('Every visual element of the calculator is controlled by your theme configuration. Through the admin panel, you can customise:'),
          new Paragraph({
            numbering: { reference: 'bullets', level: 0 },
            spacing: { after: 80 },
            children: [new TextRun({ text: 'Primary and accent colours (buttons, highlights, links)', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'bullets', level: 0 },
            spacing: { after: 80 },
            children: [new TextRun({ text: 'Background, surface, and border colours', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'bullets', level: 0 },
            spacing: { after: 80 },
            children: [new TextRun({ text: 'Font family (to match your website typography)', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'bullets', level: 0 },
            spacing: { after: 80 },
            children: [new TextRun({ text: 'Border radius (sharp corners, rounded, or pill-shaped)', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'bullets', level: 0 },
            spacing: { after: 80 },
            children: [new TextRun({ text: 'Company logo displayed in the calculator header', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'bullets', level: 0 },
            spacing: { after: 160 },
            children: [new TextRun({ text: 'PDF export branding (letterhead, colours)', size: 22, font: 'Arial' })],
          }),
          body('The live theme editor in the admin panel shows a real-time preview of how the cutting plan bars and buttons will look with your chosen colours.'),

          // --- DISCLAIMER ---
          new Paragraph({ children: [new PageBreak()] }),
          heading('Disclaimers & Liability'),
          body('shmakeCut includes a configurable disclaimer displayed beneath the cutting plan results. The default text reads:'),
          new Paragraph({
            spacing: { before: 100, after: 100 },
            indent: { left: 480 },
            border: { left: { style: BorderStyle.SINGLE, size: 6, color: BRAND.accent, space: 8 } },
            children: [new TextRun({
              text: 'This calculator provides estimates only. Always verify quantities with a qualified builder or supplier before purchasing. Actual requirements may vary based on site conditions, waste, and cutting accuracy.',
              size: 22, font: 'Arial', color: BRAND.muted, italics: true,
            })],
          }),
          body('This disclaimer also appears on PDF exports. You may customise the wording through the admin panel, though we recommend retaining language that makes clear the tool provides estimates, not guarantees.'),
          body('shmakeCut is provided as a calculation aid. We do not accept liability for material shortages, over-ordering, structural adequacy, or compliance with building codes. The tool does not replace professional advice from a qualified builder, architect, or engineer.'),

          heading('Data & Privacy', HeadingLevel.HEADING_2),
          body('shmakeCut does not collect personal information from your customers. No accounts, no email capture, no cookies for tracking. Usage analytics (page views, calculation counts, efficiency metrics) are collected in aggregate per tenant for your reporting. No individual calculation data is stored or transmitted.'),

          // --- PRICING ---
          heading('Pricing'),
          body('shmakeCut is offered on a monthly subscription basis. Pricing is structured to be accessible for independent merchants while scaling for national chains.'),
          new Table({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            columnWidths: [2200, 2200, CONTENT_WIDTH - 4400],
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders, cellMargins,
                    width: { size: 2200, type: WidthType.DXA },
                    shading: { fill: BRAND.primary, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Plan', bold: true, size: 22, font: 'Arial', color: BRAND.white })] })],
                  }),
                  new TableCell({
                    borders, cellMargins,
                    width: { size: 2200, type: WidthType.DXA },
                    shading: { fill: BRAND.primary, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Price', bold: true, size: 22, font: 'Arial', color: BRAND.white })] })],
                  }),
                  new TableCell({
                    borders, cellMargins,
                    width: { size: CONTENT_WIDTH - 4400, type: WidthType.DXA },
                    shading: { fill: BRAND.primary, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Includes', bold: true, size: 22, font: 'Arial', color: BRAND.white })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders, cellMargins, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Basic', bold: true, size: 22, font: 'Arial' })] })] }),
                  new TableCell({ borders, cellMargins, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '$99/month', size: 22, font: 'Arial' })] })] }),
                  new TableCell({ borders, cellMargins, width: { size: CONTENT_WIDTH - 4400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Cutting calculator, up to 20 products, your branding, PDF export', size: 22, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders, cellMargins, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Pro', bold: true, size: 22, font: 'Arial' })] })] }),
                  new TableCell({ borders, cellMargins, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: '$199/month', size: 22, font: 'Arial' })] })] }),
                  new TableCell({ borders, cellMargins, width: { size: CONTENT_WIDTH - 4400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Unlimited products, usage analytics dashboard, priority support', size: 22, font: 'Arial' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders, cellMargins, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Enterprise', bold: true, size: 22, font: 'Arial' })] })] }),
                  new TableCell({ borders, cellMargins, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Custom', size: 22, font: 'Arial' })] })] }),
                  new TableCell({ borders, cellMargins, width: { size: CONTENT_WIDTH - 4400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Multi-site, API integration, e-commerce cart linking, dedicated support', size: 22, font: 'Arial' })] })] }),
                ],
              }),
            ],
          }),
          spacer(120),
          body('All plans include a 30-day free trial with full functionality. No credit card required to start.'),

          // --- GETTING STARTED ---
          heading('Getting Started'),
          new Paragraph({
            numbering: { reference: 'numbers2', level: 0 },
            spacing: { after: 100 },
            children: [new TextRun({ text: 'We set up your tenant account and send you admin credentials', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers2', level: 0 },
            spacing: { after: 100 },
            children: [new TextRun({ text: 'You add your product catalogue (species, profiles, lengths, pricing)', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers2', level: 0 },
            spacing: { after: 100 },
            children: [new TextRun({ text: 'You configure your brand colours and upload your logo', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers2', level: 0 },
            spacing: { after: 100 },
            children: [new TextRun({ text: 'We provide the embed code for your web team', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers2', level: 0 },
            spacing: { after: 160 },
            children: [new TextRun({ text: 'Go live. Typical setup time: under one hour', size: 22, font: 'Arial' })],
          }),

          // --- CONTACT ---
          spacer(200),
          heading('Contact'),
          body('For enquiries, demonstrations, or to start your free trial:'),
          spacer(40),
          bodyRuns([
            { text: 'Email: ', bold: true, size: 22, font: 'Arial' },
            { text: 'hello@shmakecut.co.nz', size: 22, font: 'Arial', color: BRAND.primaryLight },
          ]),
          bodyRuns([
            { text: 'Web: ', bold: true, size: 22, font: 'Arial' },
            { text: 'shmakecut.co.nz', size: 22, font: 'Arial', color: BRAND.primaryLight },
          ]),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('/home/claude/timber-calc/docs/shmakeCut_Wholesaler_Guide.docx', buffer);
  console.log('Wholesaler guide generated');
}

build().catch(console.error);
