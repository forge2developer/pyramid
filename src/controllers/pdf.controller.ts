import PDFDocument from 'pdfkit';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import pool from '../config/database';

// Helper to check if a value is valid text
const safeText = (text: any) => text ? String(text) : '';

export const generateDeliveryChallan = async (req: Request, res: Response) => {
    try {
        const { companyDetails, products, challanType = 'DELIVERY', challanRemark, challanDate, customCompanyName, customAddress } = req.body; // challanType: 'DELIVERY' | 'RETURN'

        // --- DB ENTRY FIRST to get auto-increment ID ---
        let challanId: number;
        if (!companyDetails?.id) {
            return res.status(400).json({ error: 'Company ID is required' });
        }

        try {
            // Insert with placeholder filename to get the auto-increment ID
            const [result] = await pool.execute<any>(
                `INSERT INTO challan_history (company_id, company_name, filename, challan_type, products_data, challan_remarks, custom_company_name, custom_address, challan_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    companyDetails.id,
                    companyDetails.company_name,
                    'temp_placeholder',
                    challanType,
                    JSON.stringify(products),
                    challanRemark || null,
                    customCompanyName || null,
                    customAddress || null,
                    challanDate || new Date()
                ]
            );
            challanId = result.insertId;
            console.log(`Challan ID generated: ${challanId}`);
        } catch (dbErr) {
            console.error("Failed to create challan record in DB", dbErr);
            return res.status(500).json({ error: 'Failed to create challan record' });
        }

        // Create a document
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        // Generate Filename with Challan ID
        // Format: Type_CompanyName_CH{ID}_Date.pdf (Sanitize company name)
        const sanitizedCompanyName = (companyDetails?.company_name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
        const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `${challanType.toLowerCase()}_${sanitizedCompanyName}_CH${challanId}_${dateStr}.pdf`;

        // Ensure storage directory exists
        const uploadDir = path.join(__dirname, '../../uploads/challans');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        const fileStream = fs.createWriteStream(filePath);

        // Pipe to file AND response
        doc.pipe(fileStream);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        doc.pipe(res);

        // --- PDF Layout Constants ---
        const startX = 30;
        const startY = 30;
        const pageWidth = 535; // A4 width (595) - margins roughly
        const pageHeight = 800;

        // Define Column Widths for Main Table
        const colWidths = {
            sl: 30,
            desc: 265, // Wide description
            qty: 50,
            rate: 90,
            remarks: 100
        };
        const colX = {
            sl: startX,
            desc: startX + colWidths.sl,
            qty: startX + colWidths.sl + colWidths.desc,
            rate: startX + colWidths.sl + colWidths.desc + colWidths.qty,
            remarks: startX + colWidths.sl + colWidths.desc + colWidths.qty + colWidths.rate
        };

        let currentY = startY;

        // --- Data Setup ---
        const pyramidDetails = {
            name: 'PYRAMID BUSINESS SYSTEMS',
            address: 'No.7, Vivekanandapuram First Street,\nWest Mambalam, Chennai-600 033.',
            contact: '044-24890295, 42668886',
            gstin: 'GSTIN/UIN: 33BHTPA6153K2Z4',
            email: 'Email : mail@pyramidbs.net'
        };

        // Construct Client Address Lines
        const clientAddressLines = [
            companyDetails?.address,
            companyDetails?.city ? (companyDetails.pinCode ? `${companyDetails.city} - ${companyDetails.pinCode}` : companyDetails.city) : (companyDetails?.pinCode || ''),
            companyDetails?.phone ? `Phone : ${companyDetails.phone}` : '',
            companyDetails?.gstNumber ? `GSTIN: ${companyDetails.gstNumber}` : ''
        ].filter(Boolean);

        const clientDetails = {
            name: (customCompanyName || companyDetails?.company_name || '').toUpperCase(),
            address: clientAddressLines[0] || '', // First line usually
            fullAddressLines: clientAddressLines
        };

        // Determine Sender and Receiver
        let sender: any = {};
        let receiver: any = {};
        let deliveryAt: string = '';
        let title = 'DELIVERY CHALLAN';

        // Normalize type for logic (DELIVERY or RETURN)
        const isReturn = challanType === 'RETURN' || challanType === 'REPLACE_RETURN';
        const isReplace = challanType.startsWith('REPLACE');

        if (isReturn) {
            title = isReplace ? 'REPLACE RETURN CHALLAN' : 'RETURN CHALLAN';
            // Sender is Client
            sender = {
                name: clientDetails.name,
                address: clientDetails.fullAddressLines.join('\n'), // Use full address for sender box
                contact: '', // Included in address lines
                gstin: '',
                email: ''
            };
            // Receiver is Pyramid
            receiver = {
                // label: 'Buyer', // Image shows 'Buyer' label for Pyramid
                name: 'Buyer: ' + pyramidDetails.name,
                addressLines: [pyramidDetails.address, pyramidDetails.contact, pyramidDetails.email],
                gstin: pyramidDetails.gstin // Add GSTIN to receiver if needed
            };
            deliveryAt = ''; // Image shows empty or maybe same address
        } else {
            // DELIVERY (including REPLACE_DELIVERY)
            title = isReplace ? 'REPLACE DELIVERY CHALLAN' : 'DELIVERY CHALLAN';

            // Sender is Pyramid
            sender = {
                name: pyramidDetails.name,
                address: pyramidDetails.address,
                contact: pyramidDetails.contact,
                gstin: pyramidDetails.gstin,
                email: pyramidDetails.email
            };
            // Receiver is Client
            receiver = {
                // label: 'Buyer',
                name: 'Buyer: ' + clientDetails.name,
                // name: clientDetails.name,
                addressLines: clientDetails.fullAddressLines
            };
            deliveryAt = customAddress || companyDetails?.location || '';
        }


        // --- ROW 1: HEADER ---
        doc.rect(startX, currentY, pageWidth, 20).stroke();
        doc.font('Helvetica-Bold').fontSize(12).text(title, startX, currentY + 5, { width: pageWidth, align: 'center' });
        currentY += 20;

        // --- ROW 2: SENDER & CHALLAN INFO ---
        const row2Height = 80;
        const midX = startX + (pageWidth / 2) + 40;

        // Draw Outer Box for Row 2
        doc.rect(startX, currentY, pageWidth, row2Height).stroke();
        // Draw Vertical Divider
        doc.moveTo(midX, currentY).lineTo(midX, currentY + row2Height).stroke();

        // Left Side Content (Sender)
        const leftPad = startX + 5;

        doc.fontSize(10).font('Helvetica-Bold').text(safeText(sender.name), leftPad, currentY + 5, { width: midX - leftPad - 5 });
        doc.fontSize(9).font('Helvetica');

        // Render Sender Address
        let senderY = currentY + 20;
        if (sender.address) {
            doc.text(sender.address, leftPad, senderY, { width: midX - leftPad - 5 });
            senderY += doc.heightOfString(sender.address, { width: midX - leftPad - 5 }) + 2;
        }
        if (sender.contact) {
            doc.text(sender.contact, leftPad, senderY);
            senderY += 12;
        }
        if (sender.gstin) {
            doc.text(sender.gstin, leftPad, senderY);
            senderY += 12;
        }
        if (sender.email) {
            doc.text(sender.email, leftPad, senderY);
        }

        // --- LOGO LOGIC ---
        // Helper to draw logo
        const drawLogo = (x: number, y: number) => {
            // Try to find the logo
            let logoPath = path.join(__dirname, '../assets/PhyramidLogo.png');

            // Adjust for dist structure if needed (assuming assets are in src/assets and not copied to dist)
            if (!fs.existsSync(logoPath)) {
                logoPath = path.join(__dirname, '../../src/assets/PhyramidLogo.png');
            }

            if (fs.existsSync(logoPath)) {
                // Center the image at x (approximate width 80 to match previous triangle)
                const imgWidth = 80;
                doc.image(logoPath, x - (imgWidth / 2), y, { width: imgWidth });
            }
        };

        // Draw Logo in Row 2 if Pyramid is Sender (DELIVERY logic)
        if (!isReturn) {
            drawLogo(midX - 80, currentY + 10);
        }

        // Right Side Content (Challan Info)
        const rightPad = midX + 5;

        // Horizontal lines in right box
        doc.moveTo(midX, currentY + 20).lineTo(startX + pageWidth, currentY + 20).stroke();
        doc.moveTo(midX, currentY + 40).lineTo(startX + pageWidth, currentY + 40).stroke();
        doc.moveTo(midX, currentY + 60).lineTo(startX + pageWidth, currentY + 60).stroke();

        // Row 1: Challan No | Dated
        doc.font('Helvetica-Bold').fontSize(9).text('Challan No.', rightPad, currentY + 5);
        doc.font('Helvetica').text(String(challanId), rightPad + 60, currentY + 5);

        // Vertical divider for Date
        const dateX = rightPad + 120;
        doc.moveTo(dateX, currentY).lineTo(dateX, currentY + 20).stroke();
        doc.font('Helvetica-Bold').text('Dated:', dateX + 5, currentY + 5);
        const dateObj = challanDate ? new Date(challanDate) : new Date();
        const displayDate = dateObj.toLocaleDateString('en-GB');
        doc.font('Helvetica').text(displayDate, dateX + 40, currentY + 5);

        // Row 2: PO No
        doc.font('Helvetica').text('Purchase Order No.:', rightPad, currentY + 25);

        // Row 3: PO Date
        doc.font('Helvetica').text('Purchase Order Date :', rightPad, currentY + 45);

        currentY += row2Height;

        // --- ROW 3: RECEIVER & DELIVERY INFO ---
        const row3Height = 80;

        doc.rect(startX, currentY, pageWidth, row3Height).stroke();
        doc.moveTo(midX, currentY).lineTo(midX, currentY + row3Height).stroke();

        // Left Side: Receiver (Buyer/Pyramid)
        doc.font('Helvetica').text(receiver.label || 'Details', leftPad, currentY + 5);

        // Receiver Name
        doc.font('Helvetica-Bold').text(safeText(receiver.name).toUpperCase(), leftPad, currentY + 20, {
            width: midX - leftPad - 5
        });

        // Start Address
        doc.y += 2;

        // Render Receiver Address Lines
        doc.font('Helvetica').fontSize(9);
        if (receiver.addressLines && receiver.addressLines.length > 0) {
            receiver.addressLines.forEach((line: string) => {
                doc.text(line || '', leftPad, doc.y, {
                    width: midX - leftPad - 5,
                    lineGap: 2
                });
            });
        }

        // Draw Logo in Row 3 if Pyramid is Receiver (RETURN logic)
        if (isReturn) {
            drawLogo(midX - 80, currentY + 10);
        }

        let rightY = currentY + 5;
        doc.text('Delivery at :', rightPad, rightY);
        rightY += 15;

        // Populate Delivery At 
        if (deliveryAt) {
            doc.font('Helvetica').fontSize(9).text(deliveryAt, rightPad, rightY, {
                width: (startX + pageWidth) - rightPad - 5,
                lineGap: 2
            });
        }

        currentY += row3Height;

        // --- ROW 4: LIST OF GOODS HEADER ---
        const headerHeight = 30;

        const drawTableHeader = (y: number) => {
            doc.rect(startX, y, pageWidth, headerHeight).stroke();

            // Vertical lines for columns
            doc.moveTo(colX.desc, y).lineTo(colX.desc, y + headerHeight).stroke();
            doc.moveTo(colX.qty, y).lineTo(colX.qty, y + headerHeight).stroke();
            doc.moveTo(colX.rate, y).lineTo(colX.rate, y + headerHeight).stroke();
            doc.moveTo(colX.remarks, y).lineTo(colX.remarks, y + headerHeight).stroke();

            // Header Text
            const hY = y + 10;
            doc.font('Helvetica-Bold').fontSize(9);
            doc.text('SL', colX.sl + 5, hY - 5);
            doc.text('No', colX.sl + 5, hY + 5);
            doc.text('Description of Goods', colX.desc + 5, hY);
            doc.text('Quantity', colX.qty + 5, hY);
            doc.text('Approx. Value', colX.rate + 5, hY);
            doc.text('Remarks', colX.remarks + 5, hY);
        }

        drawTableHeader(currentY);
        currentY += headerHeight;

        // Keep track of the top of the table on the current page to draw vertical lines later
        let tableTopY = currentY;

        // --- ROW 5: GOODS LIST (Iterative) ---
        // Helper to formatting specs based on item type
        const renderItemSpecs = (item: any, type: string) => {
            const lines: string[] = [];

            if (type === 'laptop') {
                lines.push(`${item.brand || ''} ${item.model || ''} Laptop`.trim());
                // Processor Details
                const procDetails = [
                    item.processor_brand,
                    item.processor_model,
                    item.generation ? `(${item.generation})` : ''
                ].filter(Boolean).join(' ');

                if (procDetails) lines.push(procDetails + ' Processor');
                else if (item.processor) lines.push(`${item.processor} Processor`);

                // Graphics (if available directly on item)
                if (item.graphics) lines.push(item.graphics);
            } else if (type === 'system' || type === 'workstation') {
                lines.push(item.Name || item.model || 'System');
                if (item.processor || item.Processor) lines.push(`${item.processor || item.Processor} Processor`);
                if (item.graphics) lines.push(item.graphics);
            } else if (type === 'mobileworkstation') {
                lines.push(`${item.brand || ''} ${item.model || ''} Mobile Workstation`.trim());
                if (item.processor) lines.push(`${item.processor} Processor`);
                if (item.graphics) lines.push(item.graphics);
            } else if (type === 'monitor') {
                lines.push(`${item.brand || ''} ${item.model || ''} Monitor`.trim());
                if (item.size) lines.push(item.size);
                if (item.display) lines.push(item.display);
            } else {
                lines.push(safeText(item.name || item.brand || item.model || type));
                if (item.size || item.ssdSize) lines.push(item.size || item.ssdSize);
            }
            return lines;
        };

        const getProductLabel = (item: any, type: string) => {
            return item.name || item.brand || item.model || type;
        };

        // Prepare items
        let allItems: any[] = [];
        for (const [type, items] of Object.entries(products)) {
            const productList = items as any[];
            if (!productList || productList.length === 0) continue;

            const grouped: Record<string, any[]> = {};
            productList.forEach(item => {
                let key = '';
                if (type === 'laptop') key = `${item.brand} ${item.model} ${item.processor}`;
                else if (type === 'monitor') key = `${item.brand} ${item.size}`;
                else key = item.Name || item.name || type;

                if (!grouped[key]) grouped[key] = [];
                grouped[key].push({ ...item, _type: type });
            });

            Object.values(grouped).forEach(group => {
                allItems.push(group);
            });
        }

        // Fetch Components Helper
        const fetchComponents = async (type: string, id: any) => {
            if (!id) return { rams: [], ssds: [], nvmes: [], m2s: [], graphics: [] };

            let queryIdColumn = '';
            if (type === 'laptop') queryIdColumn = 'laptopID';
            else if (type === 'system') queryIdColumn = 'DesktopID';
            else if (type === 'workstation') queryIdColumn = 'WorkstationID';
            else if (type === 'mobileworkstation') queryIdColumn = 'MobileWorkstationID';
            else return { rams: [], ssds: [], nvmes: [], m2s: [], graphics: [] };

            const [rams] = await pool.execute<any[]>(`SELECT * FROM ram WHERE ${queryIdColumn} = ?`, [id]);
            const [ssds] = await pool.execute<any[]>(`SELECT * FROM ssd WHERE ${queryIdColumn} = ?`, [id]);
            const [nvmes] = await pool.execute<any[]>(`SELECT * FROM nvme WHERE ${queryIdColumn} = ?`, [id]);
            const [m2s] = await pool.execute<any[]>(`SELECT * FROM m_2 WHERE ${queryIdColumn} = ?`, [id]);

            // Try fetching graphics card if table exists and has linkage
            let graphics: any[] = [];
            try {
                const [gCards] = await pool.execute<any[]>(`SELECT * FROM graphicscard WHERE ${queryIdColumn} = ?`, [id]);
                graphics = gCards;
            } catch (e) {
                // Ignore if table/column doesn't exist
            }

            return { rams, ssds, nvmes, m2s, graphics };
        };

        let slNo = 1;
        const bottomLimit = 730;

        doc.font('Helvetica').fontSize(9);

        for (const group of allItems) {
            const first = group[0];
            const type = first._type;

            // Base Specs
            const specs = renderItemSpecs(first, type);

            // Fetch and Attach Components for Group
            // We'll fetch for the first item to represent the "Config" of the group
            // Assuming homogeneous group. If heterogeneous, we might need a note.
            // For rigorous accuracy, we could check if all items have same components.
            // For now, we take the components of the first item as representative 
            // OR list components per Serial Number if they differ (too complex for limited space).
            // Let's list components of the first item as the "Standard Configuration" for this line item.

            if (['laptop', 'system', 'workstation', 'mobileworkstation'].includes(type.toLowerCase())) {
                try {
                    const components = await fetchComponents(type.toLowerCase(), first.id || first.ID);

                    if (components.rams.length > 0) {
                        const ramText = components.rams.map((r: any) => `${r.size} ${r.type} Ram`).join(', ');
                        specs.push(ramText);
                    }
                    if (components.ssds.length > 0) {
                        const ssdText = components.ssds.map((s: any) => `${s.ssdSize || s.size} SSD`).join(', ');
                        specs.push(ssdText);
                    }
                    if (components.nvmes.length > 0) {
                        const nvmeText = components.nvmes.map((n: any) => `${n.Size || n.size} NVMe`).join(', ');
                        specs.push(nvmeText);
                    }
                    if (components.m2s.length > 0) {
                        const m2Text = components.m2s.map((m: any) => `${m.size} M.2`).join(', ');
                        specs.push(m2Text);
                    }
                    if (components.graphics && components.graphics.length > 0) {
                        const gText = components.graphics.map((g: any) => `${g.size || ''} ${g.brand || ''} ${g.model || ''} Graphic Card`.trim()).join(', ');
                        specs.push(gText);
                    }
                } catch (err) {
                    console.error("Error fetching components for PDF", err);
                }
            }

            const tags = group.map((i: any) => i.service_id || i.serviceTag || i.serialNumber || i.serial_no || i.SerialNumber).filter(Boolean);

            if (group.some((i: any) => i.pyramid_id || i.inventoryID || i.phyramidID)) {
                // Handle different casing for pyramid_id
                const pids = group.map((i: any) => i.pyramid_id || i.inventoryID || i.phyramidID).filter(Boolean);
                if (pids.length > 0) specs.push(`(${pids.join(',')})`);
            }

            if (tags.length > 0) {
                specs.push(`Service Tag: (${tags.join(',')})`);
            }

            const lineHeight = 12;
            const rowHeight = (specs.length * lineHeight) + 20;

            // CHECK PAGE BREAK
            if (currentY + rowHeight > bottomLimit) {
                // 1. Close off previous page table
                doc.rect(startX, tableTopY, pageWidth, currentY - tableTopY).stroke();

                doc.moveTo(colX.desc, tableTopY).lineTo(colX.desc, currentY).stroke();
                doc.moveTo(colX.qty, tableTopY).lineTo(colX.qty, currentY).stroke();
                doc.moveTo(colX.rate, tableTopY).lineTo(colX.rate, currentY).stroke();
                doc.moveTo(colX.remarks, tableTopY).lineTo(colX.remarks, currentY).stroke();

                // 2. Add Page
                doc.addPage();
                currentY = startY + 20; // Top margin

                // 3. Redraw Header
                drawTableHeader(currentY);
                currentY += headerHeight;
                tableTopY = currentY; // Reset top Y

                doc.font('Helvetica').fontSize(9);
            }

            // Draw SL
            doc.text(String(slNo), colX.sl + 5, currentY + 5);
            doc.font('Helvetica-Bold').text(specs[0], colX.desc + 5, currentY + 5);

            doc.font('Helvetica');
            specs.slice(1).forEach((line, idx) => {
                doc.text(line, colX.desc + 5, currentY + 5 + ((idx + 1) * lineHeight), { width: colWidths.desc - 10 });
            });

            doc.text(String(group.length), colX.qty + 5, currentY + 5, { align: 'center', width: colWidths.qty - 10 });

            // Remarls
            let remarkText = challanRemark || (isReturn ? 'Return' : 'For Rent');
            // If manual remark passed, use it (future proof)
            if (first.remarks) remarkText = first.remarks;

            doc.text(remarkText, colX.remarks + 5, currentY + 5);

            doc.moveTo(startX, currentY + rowHeight).lineTo(startX + pageWidth, currentY + rowHeight).stroke();

            currentY += rowHeight;
            slNo++;
        }

        // Fill empty space logic
        const tableBottomY = 730;
        if (currentY < tableBottomY) {
            currentY = tableBottomY;
        }

        // Draw outer borders for the list block (from tableTopY to currentY)
        doc.rect(startX, tableTopY, pageWidth, currentY - tableTopY).stroke();

        // Redraw vertical lines to the bottom of the table
        doc.moveTo(colX.desc, tableTopY).lineTo(colX.desc, currentY).stroke();
        doc.moveTo(colX.qty, tableTopY).lineTo(colX.qty, currentY).stroke();
        doc.moveTo(colX.rate, tableTopY).lineTo(colX.rate, currentY).stroke();
        doc.moveTo(colX.remarks, tableTopY).lineTo(colX.remarks, currentY).stroke();


        // --- FOOTER ---
        // Ensure footer fits on current page, or add new page
        const footerHeight = 60;
        if (currentY + footerHeight > pageHeight) {
            doc.addPage();
            currentY = startY;
        }

        const footerY = currentY;
        doc.rect(startX, footerY, pageWidth, footerHeight).stroke();

        // Split footer left/right
        doc.moveTo(midX, footerY).lineTo(midX, footerY + footerHeight).stroke();

        // Footer Content
        const footerRightTerm = isReturn ? `For ${safeText(clientDetails.name)}` : 'For Pyramid Business Systems';
        const footerRightSig = 'Authorised Signatory';

        // Left Footer
        doc.font('Helvetica');
        let leftFooterY = footerY + 5;
        doc.text('Received the above goods in good condition', leftPad, leftFooterY);
        if (isReturn) {
            leftFooterY += 15;
            doc.font('Helvetica-Bold').text('For Pyramid Business Systems', leftPad, leftFooterY);
        }
        doc.font('Helvetica').text("Receiver's Signature", leftPad, footerY + 45);

        // Right Footer
        doc.font('Helvetica-Bold').text(footerRightTerm, rightPad, footerY + 5);
        doc.font('Helvetica').text(footerRightSig, rightPad, footerY + 45);

        doc.end();

        // Update the challan record with the actual filename
        try {
            await pool.execute(
                `UPDATE challan_history SET filename = ? WHERE id = ?`,
                [filename, challanId]
            );
            console.log(`Updated challan ${challanId} with filename: ${filename}`);
        } catch (updateErr) {
            console.error("Failed to update challan filename in DB", updateErr);
            // Don't fail the request since PDF was already generated
        }

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).send('Error generating PDF');
    }
};

// Helper to list all challans with filtering from DB
export const getChallans = async (req: Request, res: Response) => {
    try {
        const { company, date, type, challanNumber } = req.query;

        let query = `
            SELECT ch.*, c.company_name 
            FROM challan_history ch
            LEFT JOIN company c ON ch.company_id = c.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (company) {

            query += ` AND c.company_name = ?`;
            params.push(company);
        }

        if (date) {
            query += ` AND DATE(ch.created_at) = ?`;
            params.push(date);
        }

        if (type) {
            query += ` AND ch.challan_type = ?`;
            params.push(type);
        }

        if (challanNumber) {
            query += ` AND ch.id = ?`;
            params.push(challanNumber);
        }

        query += ` ORDER BY ch.created_at DESC`;

        const [rows] = await pool.execute(query, params);

        // Map to expected format
        const formatted = (rows as any[]).map(row => ({
            challanNumber: row.id,
            filename: row.filename,
            type: row.challan_type,
            company: row.company_name || 'N/A',
            date: new Date(row.created_at).toISOString().split('T')[0],
            createdAt: row.created_at,
            path: `/uploads/challans/${row.filename}`,
            companyId: row.company_id,
            productsData: row.products_data ? (typeof row.products_data === 'string' ? JSON.parse(row.products_data) : row.products_data) : null,
            challanRemarks: row.challan_remarks || '',
            customCompanyName: row.custom_company_name || '',
            customAddress: row.custom_address || '',
            challanDate: row.challan_date ? new Date(row.challan_date).toISOString().split('T')[0] : ''
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching challans:', error);
        res.status(500).json({ error: 'Failed to fetch challans' });
    }
};

// Helper to download a specific challan
export const downloadChallan = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        if (!filename) {
            return res.status(400).send("Filename is required");
        }

        const filePath = path.join(__dirname, '../../uploads/challans', filename);

        // Security check: prevent directory traversal
        if (!filePath.startsWith(path.join(__dirname, '../../uploads/challans'))) {
            return res.status(403).send("Access denied");
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).send("File not found");
        }

        res.download(filePath, filename);
    } catch (error) {
        console.error('Error downloading challan:', error);
        res.status(500).send("Error downloading file");
    }
};

// Update existing challan and regenerate PDF
export const updateChallan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            company_id,
            challan_type,
            products,
            challan_remarks,
            custom_company_name,
            custom_address,
            challan_date
        } = req.body;

        if (!company_id || !challan_type) {
            return res.status(400).json({ error: 'Missing required fields: company_id, challan_type' });
        }

        // Get company details
        const [companyRows] = await pool.execute<any>(
            'SELECT * FROM company WHERE id = ?',
            [company_id]
        );

        if (!companyRows || companyRows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const companyDetails = companyRows[0];

        // Generate new filename
        const sanitizedCompanyName = companyDetails.company_name.replace(/[^a-zA-Z0-9]/g, '_');
        const dateStr = new Date().toISOString().split('T')[0];
        const newFilename = `${challan_type.toLowerCase()}_${sanitizedCompanyName}_CH${id}_${dateStr}.pdf`;

        const uploadDir = path.join(__dirname, '../../uploads/challans');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, newFilename);
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const fileStream = fs.createWriteStream(filePath);
        doc.pipe(fileStream);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${newFilename}`);
        doc.pipe(res);

        // --- PDF Layout ---
        const startX = 30;
        const pageWidth = 535;
        let currentY = 30;
        const midX = startX + (pageWidth / 2) + 40;
        const leftPad = startX + 5;
        const rightPad = midX + 5;

        const pyramidDetails = {
            name: 'PYRAMID BUSINESS SYSTEMS',
            address: 'No.7, Vivekanandapuram First Street,\nWest Mambalam, Chennai-600 033.',
            contact: '044-24890295, 42668886',
            gstin: 'GSTIN/UIN: 33BHTPA6153K2Z4',
            email: 'Email : mail@pyramidbs.net'
        };

        // Construct Client Address Lines (matching generateDeliveryChallan)
        const clientAddressLines = [
            companyDetails?.address,
            companyDetails?.city ? (companyDetails.pinCode ? `${companyDetails.city} - ${companyDetails.pinCode}` : companyDetails.city) : (companyDetails?.pinCode || ''),
            companyDetails?.phone ? `Phone : ${companyDetails.phone}` : '',
            companyDetails?.gstNumber ? `GSTIN: ${companyDetails.gstNumber}` : ''
        ].filter(Boolean);

        const clientDetails = {
            name: (custom_company_name || companyDetails?.company_name || '').toUpperCase(),
            address: clientAddressLines[0] || '',
            fullAddressLines: clientAddressLines
        };

        const isReturn = challan_type === 'RETURN' || challan_type === 'REPLACE_RETURN';
        const isReplace = challan_type.startsWith('REPLACE');
        let title = 'DELIVERY CHALLAN';

        let sender: any = {};
        let receiver: any = {};
        let deliveryAt: string = '';

        if (isReturn) {
            title = isReplace ? 'REPLACE RETURN CHALLAN' : 'RETURN CHALLAN';
            sender = {
                name: clientDetails.name,
                address: clientDetails.fullAddressLines.join('\n'),
                contact: '', gstin: '', email: ''
            };
            receiver = {
                name: 'Buyer: ' + pyramidDetails.name,
                addressLines: [pyramidDetails.address, pyramidDetails.contact, pyramidDetails.email],
                gstin: pyramidDetails.gstin
            };
            deliveryAt = '';
        } else {
            title = isReplace ? 'REPLACE DELIVERY CHALLAN' : 'DELIVERY CHALLAN';
            sender = {
                name: pyramidDetails.name,
                address: pyramidDetails.address,
                contact: pyramidDetails.contact,
                gstin: pyramidDetails.gstin,
                email: pyramidDetails.email
            };
            receiver = {
                name: 'Buyer: ' + clientDetails.name,
                addressLines: clientDetails.fullAddressLines
            };
            deliveryAt = custom_address || companyDetails?.location || '';
        }

        // --- ROW 1: HEADER ---
        doc.rect(startX, currentY, pageWidth, 20).stroke();
        doc.font('Helvetica-Bold').fontSize(12).text(title, startX, currentY + 5, { width: pageWidth, align: 'center' });
        currentY += 20;

        // --- ROW 2: SENDER & CHALLAN INFO ---
        const row2Height = 80;
        doc.rect(startX, currentY, pageWidth, row2Height).stroke();
        doc.moveTo(midX, currentY).lineTo(midX, currentY + row2Height).stroke();

        // Left Side (Sender)
        doc.fontSize(10).font('Helvetica-Bold').text(safeText(sender.name), leftPad, currentY + 5, { width: midX - leftPad - 5 });
        doc.fontSize(9).font('Helvetica');
        let senderY = currentY + 20;
        if (sender.address) {
            doc.text(sender.address, leftPad, senderY, { width: midX - leftPad - 5 });
            senderY += doc.heightOfString(sender.address, { width: midX - leftPad - 5 }) + 2;
        }
        if (sender.contact) { doc.text(sender.contact, leftPad, senderY); senderY += 12; }
        if (sender.gstin) { doc.text(sender.gstin, leftPad, senderY); senderY += 12; }
        if (sender.email) { doc.text(sender.email, leftPad, senderY); }

        // Logo
        const drawLogo = (x: number, y: number) => {
            let logoPath = path.join(__dirname, '../assets/PhyramidLogo.png');
            if (!fs.existsSync(logoPath)) {
                logoPath = path.join(__dirname, '../../src/assets/PhyramidLogo.png');
            }
            if (fs.existsSync(logoPath)) {
                const imgWidth = 80;
                doc.image(logoPath, x - (imgWidth / 2), y, { width: imgWidth });
            }
        };
        if (!isReturn) {
            drawLogo(midX - 80, currentY + 10);
        }

        // Right Side (Challan Info)
        doc.moveTo(midX, currentY + 20).lineTo(startX + pageWidth, currentY + 20).stroke();
        doc.moveTo(midX, currentY + 40).lineTo(startX + pageWidth, currentY + 40).stroke();
        doc.moveTo(midX, currentY + 60).lineTo(startX + pageWidth, currentY + 60).stroke();

        doc.font('Helvetica-Bold').fontSize(9).text('Challan No.', rightPad, currentY + 5);
        doc.font('Helvetica').text(String(id), rightPad + 60, currentY + 5);

        const dateX = rightPad + 120;
        doc.moveTo(dateX, currentY).lineTo(dateX, currentY + 20).stroke();
        doc.font('Helvetica-Bold').text('Dated:', dateX + 5, currentY + 5);
        const challanDateObj = challan_date ? new Date(challan_date) : new Date();
        doc.font('Helvetica').text(challanDateObj.toLocaleDateString('en-GB'), dateX + 40, currentY + 5);

        doc.font('Helvetica').text('Purchase Order No.:', rightPad, currentY + 25);
        doc.font('Helvetica').text('Purchase Order Date :', rightPad, currentY + 45);

        currentY += row2Height;

        // --- ROW 3: RECEIVER & DELIVERY INFO ---
        const row3Height = 80;
        doc.rect(startX, currentY, pageWidth, row3Height).stroke();
        doc.moveTo(midX, currentY).lineTo(midX, currentY + row3Height).stroke();

        // Left Side: Receiver
        doc.font('Helvetica').text(receiver.label || 'Details', leftPad, currentY + 5);
        doc.font('Helvetica-Bold').text(safeText(receiver.name).toUpperCase(), leftPad, currentY + 20, {
            width: midX - leftPad - 5
        });

        doc.y += 2;
        doc.font('Helvetica').fontSize(9);
        if (receiver.addressLines && receiver.addressLines.length > 0) {
            receiver.addressLines.forEach((line: string) => {
                doc.text(line || '', leftPad, doc.y, {
                    width: midX - leftPad - 5,
                    lineGap: 2
                });
            });
        }

        // Logo for RETURN
        if (isReturn) {
            drawLogo(midX - 80, currentY + 10);
        }

        // Right Side: Delivery At
        let rightY = currentY + 5;
        doc.text('Delivery at :', rightPad, rightY);
        rightY += 15;
        if (deliveryAt) {
            doc.font('Helvetica').fontSize(9).text(deliveryAt, rightPad, rightY, {
                width: (startX + pageWidth) - rightPad - 5,
                lineGap: 2
            });
        }

        currentY += row3Height;

        // --- ROW 4: TABLE HEADER ---
        const headerHeight = 30;
        const colWidths = { sl: 30, desc: 265, qty: 50, rate: 90, remarks: 100 };
        const colX = {
            sl: startX, desc: startX + colWidths.sl,
            qty: startX + colWidths.sl + colWidths.desc,
            rate: startX + colWidths.sl + colWidths.desc + colWidths.qty,
            remarks: startX + colWidths.sl + colWidths.desc + colWidths.qty + colWidths.rate
        };

        const drawTableHeader = (y: number) => {
            doc.rect(startX, y, pageWidth, headerHeight).stroke();
            doc.moveTo(colX.desc, y).lineTo(colX.desc, y + headerHeight).stroke();
            doc.moveTo(colX.qty, y).lineTo(colX.qty, y + headerHeight).stroke();
            doc.moveTo(colX.rate, y).lineTo(colX.rate, y + headerHeight).stroke();
            doc.moveTo(colX.remarks, y).lineTo(colX.remarks, y + headerHeight).stroke();
            const hY = y + 10;
            doc.font('Helvetica-Bold').fontSize(9);
            doc.text('SL', colX.sl + 5, hY - 5);
            doc.text('No', colX.sl + 5, hY + 5);
            doc.text('Description of Goods', colX.desc + 5, hY);
            doc.text('Quantity', colX.qty + 5, hY);
            doc.text('Approx. Value', colX.rate + 5, hY);
            doc.text('Remarks', colX.remarks + 5, hY);
        };

        drawTableHeader(currentY);
        currentY += headerHeight;


        // PRODUCT ROWS — full rendering matching generateDeliveryChallan
        const renderItemSpecs = (item: any, type: string) => {
            const lines: string[] = [];
            if (type === 'laptop') {
                lines.push(`${item.brand || ''} ${item.model || ''} Laptop`.trim());
                const procDetails = [item.processor_brand, item.processor_model, item.generation ? `(${item.generation})` : ''].filter(Boolean).join(' ');
                if (procDetails) lines.push(procDetails + ' Processor');
                else if (item.processor) lines.push(`${item.processor} Processor`);
                if (item.graphics) lines.push(item.graphics);
            } else if (type === 'system' || type === 'workstation') {
                lines.push(item.Name || item.model || 'System');
                if (item.processor || item.Processor) lines.push(`${item.processor || item.Processor} Processor`);
                if (item.graphics) lines.push(item.graphics);
            } else if (type === 'mobileworkstation') {
                lines.push(`${item.brand || ''} ${item.model || ''} Mobile Workstation`.trim());
                if (item.processor) lines.push(`${item.processor} Processor`);
                if (item.graphics) lines.push(item.graphics);
            } else if (type === 'monitor') {
                lines.push(`${item.brand || ''} ${item.model || ''} Monitor`.trim());
                if (item.size) lines.push(item.size);
                if (item.display) lines.push(item.display);
            } else {
                lines.push(safeText(item.name || item.brand || item.model || type));
                if (item.size || item.ssdSize) lines.push(item.size || item.ssdSize);
            }
            return lines;
        };

        const fetchComponents = async (type: string, itemId: any) => {
            if (!itemId) return { rams: [], ssds: [], nvmes: [], m2s: [], graphics: [] };
            let queryIdColumn = '';
            if (type === 'laptop') queryIdColumn = 'laptopID';
            else if (type === 'system') queryIdColumn = 'DesktopID';
            else if (type === 'workstation') queryIdColumn = 'WorkstationID';
            else if (type === 'mobileworkstation') queryIdColumn = 'MobileWorkstationID';
            else return { rams: [], ssds: [], nvmes: [], m2s: [], graphics: [] };

            const [rams] = await pool.execute<any[]>(`SELECT * FROM ram WHERE ${queryIdColumn} = ?`, [itemId]);
            const [ssds] = await pool.execute<any[]>(`SELECT * FROM ssd WHERE ${queryIdColumn} = ?`, [itemId]);
            const [nvmes] = await pool.execute<any[]>(`SELECT * FROM nvme WHERE ${queryIdColumn} = ?`, [itemId]);
            const [m2s] = await pool.execute<any[]>(`SELECT * FROM m_2 WHERE ${queryIdColumn} = ?`, [itemId]);
            let graphics: any[] = [];
            try {
                const [gCards] = await pool.execute<any[]>(`SELECT * FROM graphicscard WHERE ${queryIdColumn} = ?`, [itemId]);
                graphics = gCards;
            } catch (e) { /* ignore */ }
            return { rams, ssds, nvmes, m2s, graphics };
        };

        // Prepare grouped items
        let allItems: any[] = [];
        if (products && typeof products === 'object') {
            for (const [type, items] of Object.entries(products as Record<string, any[]>)) {
                const productList = items as any[];
                if (!productList || productList.length === 0) continue;

                const grouped: Record<string, any[]> = {};
                productList.forEach(item => {
                    let key = '';
                    if (type === 'laptop') key = `${item.brand} ${item.model} ${item.processor}`;
                    else if (type === 'monitor') key = `${item.brand} ${item.size}`;
                    else key = item.Name || item.name || type;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push({ ...item, _type: type });
                });

                Object.values(grouped).forEach(group => {
                    allItems.push(group);
                });
            }
        }

        let slNo = 1;
        const bottomLimit = 730;
        let tableTopY = currentY;
        doc.font('Helvetica').fontSize(9);

        for (const group of allItems) {
            const first = group[0];
            const type = first._type;

            const specs = renderItemSpecs(first, type);

            // Fetch components from DB
            if (['laptop', 'system', 'workstation', 'mobileworkstation'].includes(type.toLowerCase())) {
                try {
                    const components = await fetchComponents(type.toLowerCase(), first.id || first.ID);
                    if (components.rams.length > 0) {
                        specs.push(components.rams.map((r: any) => `${r.size} ${r.type} Ram`).join(', '));
                    }
                    if (components.ssds.length > 0) {
                        specs.push(components.ssds.map((s: any) => `${s.ssdSize || s.size} SSD`).join(', '));
                    }
                    if (components.nvmes.length > 0) {
                        specs.push(components.nvmes.map((n: any) => `${n.Size || n.size} NVMe`).join(', '));
                    }
                    if (components.m2s.length > 0) {
                        specs.push(components.m2s.map((m: any) => `${m.size} M.2`).join(', '));
                    }
                    if (components.graphics && components.graphics.length > 0) {
                        specs.push(components.graphics.map((g: any) => `${g.size || ''} ${g.brand || ''} ${g.model || ''} Graphic Card`.trim()).join(', '));
                    }
                } catch (err) {
                    console.error("Error fetching components for PDF", err);
                }
            }

            // Pyramid IDs
            if (group.some((i: any) => i.pyramid_id || i.inventoryID || i.phyramidID)) {
                const pids = group.map((i: any) => i.pyramid_id || i.inventoryID || i.phyramidID).filter(Boolean);
                if (pids.length > 0) specs.push(`(${pids.join(',')})`);
            }

            // Service tags
            const tags = group.map((i: any) => i.service_id || i.serviceTag || i.serialNumber || i.serial_no || i.SerialNumber).filter(Boolean);
            if (tags.length > 0) specs.push(`Service Tag: (${tags.join(',')})`);

            const lineHeight = 12;
            const rowHeight = (specs.length * lineHeight) + 20;

            // Page break check
            if (currentY + rowHeight > bottomLimit) {
                doc.rect(startX, tableTopY, pageWidth, currentY - tableTopY).stroke();
                doc.moveTo(colX.desc, tableTopY).lineTo(colX.desc, currentY).stroke();
                doc.moveTo(colX.qty, tableTopY).lineTo(colX.qty, currentY).stroke();
                doc.moveTo(colX.rate, tableTopY).lineTo(colX.rate, currentY).stroke();
                doc.moveTo(colX.remarks, tableTopY).lineTo(colX.remarks, currentY).stroke();

                doc.addPage();
                currentY = 50;

                drawTableHeader(currentY);
                currentY += headerHeight;
                tableTopY = currentY;

                doc.font('Helvetica').fontSize(9);
            }

            // Draw row content
            doc.text(String(slNo), colX.sl + 5, currentY + 5);
            doc.font('Helvetica-Bold').text(specs[0], colX.desc + 5, currentY + 5);
            doc.font('Helvetica');
            specs.slice(1).forEach((line, idx) => {
                doc.text(line, colX.desc + 5, currentY + 5 + ((idx + 1) * lineHeight), { width: colWidths.desc - 10 });
            });

            doc.text(String(group.length), colX.qty + 5, currentY + 5, { align: 'center', width: colWidths.qty - 10 });

            // Remarks per row
            let remarkText = challan_remarks || (isReturn ? 'Return' : 'For Rent');
            if (first.remarks) remarkText = first.remarks;
            doc.text(remarkText, colX.remarks + 5, currentY + 5);

            doc.moveTo(startX, currentY + rowHeight).lineTo(startX + pageWidth, currentY + rowHeight).stroke();

            currentY += rowHeight;
            slNo++;
        }

        // Fill empty space to bottom
        const tableBottomY = 730;
        if (currentY < tableBottomY) {
            currentY = tableBottomY;
        }

        // Draw outer borders and vertical lines
        doc.rect(startX, tableTopY, pageWidth, currentY - tableTopY).stroke();
        doc.moveTo(colX.desc, tableTopY).lineTo(colX.desc, currentY).stroke();
        doc.moveTo(colX.qty, tableTopY).lineTo(colX.qty, currentY).stroke();
        doc.moveTo(colX.rate, tableTopY).lineTo(colX.rate, currentY).stroke();
        doc.moveTo(colX.remarks, tableTopY).lineTo(colX.remarks, currentY).stroke();


        // REMARKS
        if (challan_remarks) {
            const remarkHeight = 30;
            doc.rect(startX, currentY, pageWidth, remarkHeight).stroke();
            doc.font('Helvetica-Bold').fontSize(9).text('Remarks:', leftPad, currentY + 5);
            doc.font('Helvetica').text(challan_remarks, leftPad + 55, currentY + 5, { width: pageWidth - 65 });
            currentY += remarkHeight;
        }

        // FOOTER
        const footerHeight = 60;
        doc.rect(startX, currentY, pageWidth, footerHeight).stroke();
        doc.moveTo(midX, currentY).lineTo(midX, currentY + footerHeight).stroke();
        const footerRightTerm = isReturn ? `For ${clientDetails.name}` : 'For Pyramid Business Systems';
        doc.font('Helvetica').fontSize(9);
        doc.text('Received the above goods in good condition', leftPad, currentY + 5);
        if (isReturn) doc.font('Helvetica-Bold').text('For Pyramid Business Systems', leftPad, currentY + 20);
        doc.font('Helvetica').text("Receiver's Signature", leftPad, currentY + 45);
        doc.font('Helvetica-Bold').text(footerRightTerm, rightPad, currentY + 5);
        doc.font('Helvetica').text('Authorised Signatory', rightPad, currentY + 45);

        doc.end();

        // Update database
        await pool.execute(
            `UPDATE challan_history 
             SET company_id = ?, company_name = ?, challan_type = ?,
                 products_data = ?, challan_remarks = ?,
                 custom_company_name = ?, custom_address = ?,
                 challan_date = ?, filename = ?
             WHERE id = ?`,
            [company_id, companyDetails.company_name, challan_type,
                JSON.stringify(products), challan_remarks || null,
                custom_company_name || null, custom_address || null,
                challan_date || new Date(), newFilename, id]
        );

        console.log(`Challan ${id} updated with filename: ${newFilename}`);

    } catch (error) {
        console.error('Error updating challan:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to update challan' });
        }
    }
};
