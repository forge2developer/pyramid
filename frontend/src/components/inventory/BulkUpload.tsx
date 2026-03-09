import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, AlertCircle, CheckCircle2, Upload } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export type ProductCategory = 'laptop' | 'desktop' | 'ram' | 'ssd' | 'nvme' | 'hdd' | 'monitor' | 'graphicscard' | 'workstation' | 'mobile_workstation' | 'm_2';

interface BulkUploadProps {
    category: ProductCategory;
    onDataParsed: (data: any[]) => void;
}

const TEMPLATES: Record<ProductCategory, string[]> = {
    laptop: [
        "brand", "model", "processor_brand", "processor_model", "generation",
        "service_id", "date_of_purchase", "adapter", "phyramidID"
    ],
    desktop: [
        "Brand", "Processor", "Generation", "serviceID", "pyramidsID",
        "warrantyEndDate", "dateOfPurchase",
    ],
    ram: [
        "brand", "size", "type", "form_factor", "service_id", "pyramid_id", "date_of_purchase"
    ],
    ssd: [
        "brand", "ssdSize", "speed", "SerialNumber", "serviceTag", "phyramidID",
        "warrantyEndDate", "dateOfPurchase"
    ],
    nvme: [
        "brand", "Size", "speed", "serialNumber", "serviceTag", "phyramidID",
        "warrantyEndDate", "dateOfPurchase"
    ],
    hdd: [
        "brand", "size", "speed", "serialNumber", "serviceTag", "phyramidID",
        "warrantyEndDate", "dateOfPurchase"
    ],
    monitor: [
        "name", "size", "display", "service_tag", "pyramid_id",
        "date_of_purchase", "warranty_date"
    ],
    graphicscard: [
        "brand", "model", "size", "generation", "serviceNumber",
        "serviceTag", "phyramidID", "warrantyEndDate", "dateOfPurchase"
    ],
    workstation: [
        "Name", "Processor", "generation", "serviceID",
        "pyramidsID", "dateOfPurchase"
    ],
    mobile_workstation: [
        "brand", "model", "processor_brand", "processor_model", "generation",
        "service_id", "date_of_purchase", "adapter", "phyramidID"
    ],
    m_2: [
        "brand", "size", "type", "form_factor", "serviceTag", "date_of_purchase", "phyramidID"
    ]
};

const DUMMY_DATA: Record<ProductCategory, string[]> = {
    laptop: [
        "Dell", "XPS 15", "Intel", "i7-12700H", "12th Gen", "SVC-12345",
        "2024-01-01", "65W", "PID-001"
    ],
    desktop: ["Dell OptiPlex", "Intel i5", "12th Gen", "SVC-54321", "PID-002", "2027-01-01", "2024-01-01"],
    ram: ["Samsung", "16", "DDR4", "Laptop", "SVC-RAM-01", "PID-RAM-01", "2024-02-01"],
    ssd: ["Samsung", "1TB", "550MB/s", "SN-SSD-01", "ST-SSD-01", "PID-SSD-01", "2027-02-01", "2024-02-01"],
    nvme: ["WD", "1TB", "3500MB/s", "SN-NVME-01", "ST-NVME-01", "PID-NVME-01", "2027-03-01", "2024-03-01"],
    hdd: ["Seagate", "2TB", "7200RPM", "SN-HDD-01", "ST-HDD-01", "PID-HDD-01", "2026-04-01", "2024-04-01"],
    monitor: ["Dell P2419H", "24", "IPS", "ST-MON-01", "PID-MON-01", "2024-05-01", "2027-05-01"],
    graphicscard: ["NVIDIA", "RTX 3060", "12GB", "30 Series", "SN-GPU-01", "ST-GPU-01", "PID-GPU-01", "2027-06-01", "2024-06-01"],
    workstation: ["Precision 3000", "i9", "12th Gen", "SVC-WS-01", "PID-WS-01", "2024-01-01"],
    mobile_workstation: ["Dell", "Precision 5570", "Intel", "i7-12800H", "12th Gen", "SVC-MWS-01", "2024-01-01", "130W", "PID-MWS-01"],
    m_2: ["Samsung", "1TB", "Gen4", "Laptop", "1001", "2024-03-01", "PID-M2-01"]
};

export function BulkUpload({ category, onDataParsed }: BulkUploadProps) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);

    const handleSampleDownload = () => {
        const columns = TEMPLATES[category];
        const dummyRow = DUMMY_DATA[category];

        if (!columns || !dummyRow) {
            toast.error("Template/Data not defined for this category");
            return;
        }

        // Create Excel workbook with headers and sample row
        const ws = XLSX.utils.aoa_to_sheet([columns, dummyRow]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");

        // Set column widths for better readability
        const colWidths = columns.map(() => ({ wch: 15 }));
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `${category}_sample_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Sample Excel template downloaded");
    };

    const validateHeaders = (headers: string[], expected: string[]) => {
        const lowerHeaders = headers.map(h => h.toLowerCase().trim());
        const lowerExpected = expected.map(h => h.toLowerCase().trim());

        let matchCount = 0;
        lowerExpected.forEach(exp => {
            // Check for exact match or partial match (in case PDF splits column names)
            const found = lowerHeaders.some(h => h.includes(exp) || exp.includes(h));
            if (found) matchCount++;
        });

        console.log(`Header validation: ${matchCount}/${lowerExpected.length} matched`, { headers, expected });

        // Require at least 50% match or 3 columns minimum
        const threshold = Math.max(3, Math.ceil(lowerExpected.length * 0.5));
        return matchCount >= threshold;
    };

    // Initialize PDF worker
    const parsePdf = async (file: File) => {
        try {
            const pdfjsLib = await import('pdfjs-dist');
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                    'pdfjs-dist/build/pdf.worker.min.mjs',
                    import.meta.url
                ).toString();
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let allRows: string[][] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                const items: any[] = textContent.items.filter((item: any) => item.str.trim() !== "");
                const rows: Record<number, { x: number, text: string }[]> = {};

                items.forEach(item => {
                    const y = Math.round(item.transform[5]);
                    if (!rows[y]) rows[y] = [];
                    rows[y].push({ x: item.transform[4], text: item.str });
                });

                const sortedY = Object.keys(rows).map(Number).sort((a, b) => b - a);

                sortedY.forEach(y => {
                    const rowItems = rows[y].sort((a, b) => a.x - b.x);
                    allRows.push(rowItems.map(item => item.text));
                });
            }

            const expectedHeaders = TEMPLATES[category];
            // Find row that best matches expected headers
            const headerIndex = allRows.findIndex(row => validateHeaders(row, expectedHeaders));

            if (headerIndex === -1) {
                throw new Error(`Could not find a matching header row for ${category}. Ensure you uploaded the correct file.`);
            }

            const parsed = [];
            for (let i = headerIndex + 1; i < allRows.length; i++) {
                const currentRow = allRows[i];
                if (currentRow.length < 2) continue;

                const rowData: any = {};
                expectedHeaders.forEach((key, index) => {
                    if (index < currentRow.length) {
                        rowData[key] = currentRow[index];
                    }
                });
                parsed.push(rowData);
            }

            if (parsed.length === 0) {
                throw new Error("No data rows found after header.");
            }

            setParsedData(parsed);
            toast.success(`Successfully parsed ${parsed.length} records from PDF.`);

        } catch (err: any) {
            console.error("PDF Parse Error", err);
            setError("Failed to parse PDF. " + (err.message || "Unknown error"));
            setParsedData([]);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setParsedData([]);

        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            parsePdf(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, {
                    defval: "",
                    raw: false,
                    dateNF: 'yyyy-mm-dd'
                });

                if (data.length === 0) {
                    setError("File is empty or could not be parsed.");
                    return;
                }

                // Validate Headers from first row
                const uploadedHeaders = Object.keys(data[0] as object);
                const expectedHeaders = TEMPLATES[category];

                if (!validateHeaders(uploadedHeaders, expectedHeaders)) {
                    setError(`Invalid file format for ${category}. Please use the sample template.`);
                    setParsedData([]);
                    return;
                }

                setParsedData(data);
                toast.success(`Successfully parsed ${data.length} records.`);
            } catch (err) {
                console.error(err);
                setError("Failed to parse file. Ensure it is a valid Excel file.");
                setParsedData([]);
            }
        };
        reader.readAsBinaryString(file);
    };

    const confirmUpload = () => {
        if (parsedData.length > 0) {
            onDataParsed(parsedData);
            setOpen(false);
            setParsedData([]);
        }
    };

    return (
        <div className="flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="default" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Import Products
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Bulk Import {category.charAt(0).toUpperCase() + category.slice(1)}s</DialogTitle>
                        <DialogDescription>
                            Upload an Excel/CSV or PDF file to import multiple products at once.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4 overflow-hidden">
                        {/* Actions Row */}
                        <div className="flex items-center justify-between gap-4 p-4 border border-dashed rounded-lg bg-slate-50/50">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="file-upload" className="font-semibold">Upload File</Label>
                                <span className="text-xs text-muted-foreground">Supported: .xlsx, .csv, .pdf</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Input
                                    id="file-upload"
                                    type="file"
                                    accept=".xlsx, .xls, .csv, .pdf"
                                    onChange={handleFileUpload}
                                    className="w-full max-w-xs bg-white"
                                />
                                <Button variant="outline" size="sm" onClick={handleSampleDownload}>
                                    <Download className="mr-2 h-4 w-4" /> Sample
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive shrink-0">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-semibold">Error:</span> {error}
                            </div>
                        )}

                        {/* Preview Table */}
                        {parsedData.length > 0 && (
                            <div className="flex-1 overflow-auto border rounded-md min-h-[200px]">
                                <Table>
                                    <TableHeader className="bg-slate-50 sticky top-0">
                                        <TableRow>
                                            {Object.keys(parsedData[0] || {}).map((header) => (
                                                <TableHead key={header} className="whitespace-nowrap">
                                                    {header}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((row, i) => (
                                            <TableRow key={i}>
                                                {Object.values(row).map((val: any, j) => (
                                                    <TableCell key={j} className="whitespace-nowrap">
                                                        {String(val)}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {parsedData.length > 0 && !error && (
                            <div className="flex items-center gap-2 rounded-md bg-green-50 p-2 text-sm text-green-700 border border-green-200 shrink-0">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Ready to import <strong>{parsedData.length}</strong> records.</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={confirmUpload} disabled={parsedData.length === 0}>
                            Submit Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
