// server/pdf-from-docx.ts
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Docxtemplater from "docxtemplater";
// import angularParser from "docxtemplater-angular-parser";
import PizZip from "pizzip";
// Remove this line:
// import angularParser from "docxtemplater-angular-parser";
// Dot notation is supported by default in docxtemplater >=3.29.0.
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// --- Utils ESM pour __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Résout un chemin depuis le dossier du fichier courant (pas le cwd)
function resolveFromHere(...p: string[]) {
    return path.resolve(__dirname, ...p);
}

// Trouver le binaire soffice de façon robuste
async function resolveSofficeBinary(): Promise<string> {
    const envPath = process.env.SOFFICE_PATH?.trim();
    if (envPath) {
        try {
            await fs.access(envPath);
            return envPath;
        } catch {
            throw new Error(
                `SOFFICE_PATH défini mais introuvable: ${envPath}`
            );
        }
    }

    // Tentatives par défaut (Windows / Linux)
    const candidates = [
        "soffice", // si dans le PATH
        "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
        "/usr/bin/soffice",
        "/usr/local/bin/soffice",
    ];

    for (const c of candidates) {
        try {
            await fs.access(c);
            return c;
        } catch {
            /* continue */
        }
    }

    throw new Error(
        [
            "LibreOffice (soffice) introuvable.",
            "Définis la variable d'environnement SOFFICE_PATH, ex. :",
            'Windows : C:\\Program Files\\LibreOffice\\program\\soffice.exe',
            "Linux   : /usr/bin/soffice",
        ].join("\n")
    );
}

async function docxToPdf(docxPath: string, outDir: string) {
    const soffice = await resolveSofficeBinary();

    // Important: LibreOffice crée le PDF dans outDir avec le même nom
    const expectedPdf = path.join(
        outDir,
        path.basename(docxPath, ".docx") + ".pdf"
    );

    // Nettoyage préalable si un ancien PDF traine
    try {
        await fs.unlink(expectedPdf);
    } catch {/* ignore */ }

    const args = ["--headless", "--convert-to", "pdf", "--outdir", outDir, docxPath];
    try {
        const { stdout, stderr } = await execFileAsync(soffice, args, {
            windowsHide: true,
            timeout: 60_000,
            maxBuffer: 10 * 1024 * 1024,
        });
        if (stdout?.trim()) console.log("[soffice stdout]\n" + stdout);
        if (stderr?.trim()) console.warn("[soffice stderr]\n" + stderr);
    } catch (err: any) {
        console.error("Erreur execFile soffice:", err);
        throw new Error(
            "Échec de la conversion PDF via LibreOffice. Vérifie SOFFICE_PATH / permissions."
        );
    }

    // Vérifier la création effective du PDF
    try {
        await fs.access(expectedPdf);
        return expectedPdf;
    } catch {
        throw new Error(
            `La conversion s'est terminée sans créer le PDF attendu: ${expectedPdf}`
        );
    }
}

function formatAriary(n: number) {
    return n.toLocaleString("fr-FR") + " AR";
}

function monthLongFR(d: Date) {
    return d.toLocaleString("fr-FR", { month: "long" });
}


export async function generateInvoicePdfFromDocx(invoice: any, client: any, plan?: any): Promise<Buffer> {
    const templatePath = resolveFromHere("templates", "invoice-template.docx");

    console.log("[PDF] templatePath:", templatePath);
    try {
        await fs.access(templatePath);
    } catch {
        throw new Error(
            `Template DOCX introuvable à ${templatePath}\n` +
            `Assure-toi que le fichier existe et que le serveur a les droits de lecture.`
        );
    }

    let content: Buffer;
    try {
        content = await fs.readFile(templatePath);
    } catch (e) {
        console.error("Lecture template échouée:", e);
        throw new Error("Impossible de lire le template DOCX.");
    }

    const zip = new PizZip(content);

    // Set custom delimiters and use angularParser for dot notation
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
            start: '[[',
            end: ']]'
        }
    });
    // Prepare data (same as before)
    const issue = new Date(invoice.issueDate || Date.now());
    const periodStart = new Date(invoice.billingPeriodStart || Date.now());
    const periodEnd = new Date(invoice.billingPeriodEnd || Date.now());

    const amount = Number(invoice.amount ?? 0);
    const total = Number(invoice.totalAmount ?? amount);

    const fullName = client.fullName || "";
    const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    const planName = plan?.name || "Pack Familiale";
    const unit = Number(String(plan?.pricePerMonth ?? amount).replace(/[^\d.-]/g, "")) || amount;

    // Data object aplati
    const data = {
    invoiceNumber: invoice.invoiceNumber || `INV-${invoice.id ?? Date.now()}`,
    issueDate: issue.toLocaleDateString("fr-FR"),

    // 👇 Champs client directement exposés
    firstName: firstName || fullName,
    lastName: lastName || "",
    fullName: fullName || "Client Inconnu",
    address: client.address || client.addressDetails || "—",
    phone: client.phone || "—",

    periodStart: periodStart.toLocaleDateString("fr-FR"),
    periodEnd: periodEnd.toLocaleDateString("fr-FR"),
    periodMonth: monthLongFR(periodStart),

    plan: { name: planName },
    designation: `Abonnement ${planName} (Mois de ${monthLongFR(periodStart)})`,
    quantity: "1",
    unitPrice: formatAriary(unit),
    lineTotal: formatAriary(total),
    grandTotal: total.toLocaleString("fr-FR"),
    currency: invoice.currency || "AR",
    };


    try {
        console.log("[DEBUG] Data before render:", JSON.stringify(data, null, 2));
        doc.render(data);
        console.log("[PDF] Document rendered successfully with data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Docxtemplater render error:", e);
        throw new Error(
            "Erreur lors du rendu du modèle DOCX. " +
            "Vérifie que tous les [[placeholders]] du docx existent et correspondent aux clés de 'data'. "
        );
    }

    const tdir = path.join(tmpdir(), "invoices");
    await fs.mkdir(tdir, { recursive: true });

    const base = `invoice-${randomUUID()}`;
    const docxPath = path.join(tdir, `${base}.docx`);
    const pdfPathExpected = path.join(tdir, `${base}.pdf`);

    const buf = doc.getZip().generate({ type: "nodebuffer" });
    await fs.writeFile(docxPath, buf);

    console.log("[PDF] DOCX écrit:", docxPath);
    const pdfPath = await docxToPdf(docxPath, tdir);
    console.log("[PDF] PDF généré:", pdfPath);

    if (pdfPath !== pdfPathExpected) {
        try {
            await fs.rename(pdfPath, pdfPathExpected);
        } catch {
            // pas grave si on n'y arrive pas
        }
    }

    const finalPdf = (await fs.access(pdfPathExpected).then(() => pdfPathExpected).catch(() => pdfPath));
    const pdfBuffer = await fs.readFile(finalPdf);
    return pdfBuffer;
}
