// server/pdf-contract.ts
import puppeteer from "puppeteer";
import { format, addMonths, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import fs from "fs";

/**
 * Génère un PDF de contrat au format A4
 * @param client - Informations du client
 * @param subscription - Abonnement (optionnel)
 * @param plan - Plan d'abonnement (optionnel)
 * @param customContent - Contenu HTML personnalisé (optionnel)
 * @returns Buffer du PDF généré
 */
export async function generateContractPdf(
  client: any,
  subscription: any,
  plan: any,
  customContent?: string
): Promise<Buffer> {
  let html: string;

  if (customContent) {
    html = customContent;
  } else {
    // Dates du contrat
    const currentDate = format(new Date(), "dd MMMM yyyy", {
      locale: fr,
    });

    const startDate = subscription?.startDate
      ? format(new Date(subscription.startDate), "dd MMMM yyyy", {
          locale: fr,
        })
      : format(new Date(), "dd MMMM yyyy", {
          locale: fr,
        });

    // Date de première facturation
    let firstBillingDate = addDays(new Date(), 15);

    if (subscription?.startDate) {
      const start = new Date(subscription.startDate);

      if (!isNaN(start.getTime())) {
        firstBillingDate = new Date(
          start.getFullYear(),
          start.getMonth(),
          15
        );

        if (firstBillingDate < start) {
          firstBillingDate = addMonths(firstBillingDate, 1);
        }
      }
    }

    const firstBillingDateStr = format(
      firstBillingDate,
      "dd MMMM yyyy",
      {
        locale: fr,
      }
    );

    // Date de renouvellement automatique
    const renewalDate = addMonths(new Date(), 1);

    const renewalDateStr = format(
      renewalDate,
      "dd MMMM yyyy",
      {
        locale: fr,
      }
    );

    html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
Contrat d'abonnement - ${client?.fullName || "Client"}
</title>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  min-height: 100%;
}

body {
  font-family: "Times New Roman", Times, serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #1a1a1a;
  background: white;
  padding: 40px;
  margin: 0;
}

.container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

/* En-tête */

.header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #0B676E;
  padding-bottom: 20px;
}

.logo {
  font-size: 28px;
  font-weight: bold;
  color: #0B676E;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin: 15px 0 5px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 12px;
  color: #555;
}

.contract-number {
  font-size: 10px;
  color: #666;
  margin-top: 10px;
  font-style: italic;
}

/* Contenu */

.content {
  margin: 25px 0;
}

.clause {
  margin-bottom: 20px;
  page-break-inside: avoid;
}

.clause-title {
  font-weight: bold;
  font-size: 13pt;
  margin-bottom: 8px;
  color: #0B676E;
  border-left: 3px solid #0B676E;
  padding-left: 10px;
}

.clause-content {
  margin-top: 8px;
  text-align: justify;
}

/* Encadrés */

.highlight-box {
  background: #e8f5e9;
  border-left: 4px solid #0B676E;
  padding: 12px 15px;
  margin: 15px 0;
  border-radius: 0 8px 8px 0;
  page-break-inside: avoid;
}

.warning-box {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 12px 15px;
  margin: 15px 0;
  border-radius: 0 8px 8px 0;
  page-break-inside: avoid;
}

.info-box {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 12px 15px;
  margin: 15px 0;
  border-radius: 0 8px 8px 0;
  page-break-inside: avoid;
}

/* Tableaux */

.info-table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  background: #f9f9f9;
}

.info-table td,
.info-table th {
  border: 1px solid #ddd;
  padding: 10px;
  vertical-align: top;
}

.info-table td:first-child {
  width: 30%;
  font-weight: bold;
  background: #f0f0f0;
}

.pricing-table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

.pricing-table th {
  background: #0B676E;
  color: white;
  padding: 10px;
  text-align: left;
  font-weight: bold;
}

.pricing-table td {
  border: 1px solid #ddd;
  padding: 10px;
}

.pricing-table tr:nth-child(even) {
  background: #f9f9f9;
}

.total-row {
  background: #e8f5e9 !important;
  font-weight: bold;
}

/* Signatures */

.signatures {
  margin-top: 40px;
  display: flex;
  justify-content: space-between;
  gap: 40px;
  page-break-inside: avoid;
}

.signature-box {
  flex: 1;
  text-align: center;
}

.signature-line {
  border-top: 1px solid #333;
  margin-top: 50px;
  padding-top: 10px;
  width: 100%;
}

.signature-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 11pt;
}

.signature-date {
  font-size: 10pt;
  color: #555;
  margin-top: 10px;
}

/* Pied de page */

.footer {
  margin-top: 40px;
  font-size: 9pt;
  text-align: center;
  color: #666;
  border-top: 1px solid #ccc;
  padding-top: 15px;
}

/* Listes */

ul,
ol {
  margin: 8px 0;
  padding-left: 25px;
}

li {
  margin: 4px 0;
}

p {
  margin: 8px 0;
}

/* Badges */

.badge-success {
  display: inline-block;
  background: #4caf50;
  color: white;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10pt;
  font-weight: bold;
}

.badge-warning {
  display: inline-block;
  background: #ff9800;
  color: white;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10pt;
  font-weight: bold;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.text-bold {
  font-weight: bold;
}

.mt-3 {
  margin-top: 15px;
}

.mb-3 {
  margin-bottom: 15px;
}

hr {
  margin: 15px 0;
  border: none;
  border-top: 1px dashed #ccc;
}

.icon {
  font-family: "Segoe UI", "Times New Roman", serif;
  font-weight: normal;
}

/* Impression */

@media print {

  body {
    padding: 20px;
  }

  .signature-line {
    margin-top: 40px;
  }

  .highlight-box,
  .warning-box,
  .info-box {
    break-inside: avoid;
  }

}

</style>
</head>

<body>

<div class="container">

<!-- En-tête -->

<div class="header">

<div class="logo">
SV PRESSING MADAGASCAR
</div>

<div class="title">
CONTRAT D'ABONNEMENT MENSUEL
</div>

<div class="subtitle">
Sans engagement - Renouvellement automatique
</div>

<div class="contract-number">
N° Contrat:
${
  subscription?.id
    ? `SUB-${subscription.id}`
    : `CT-${Date.now()}`
}
</div>

</div>

<div class="content">

<!-- Mention SANS ENGAGEMENT -->

<div class="highlight-box text-center">

<span class="badge-success">
✓ CONTRAT SANS ENGAGEMENT
</span>

<p
style="margin-top: 10px; font-weight: bold; font-size: 12pt;"
>
Résiliable à tout moment avec un préavis de 2 semaines
</p>

</div>

<!-- Préambule -->

<div class="clause">

<div class="clause-title">
Préambule
</div>

<div class="clause-content">

<p>
Le présent contrat définit les conditions d'abonnement mensuel au service de pressing proposé par SV Pressing Madagascar.
Ce contrat est
<strong class="text-bold">
sans engagement de durée
</strong>,
conformément à la législation en vigueur.
</p>

</div>

</div>

<!-- Parties contractantes -->

<div class="clause">

<div class="clause-title">
ARTICLE 1 - PARTIES CONTRACTANTES
</div>

<div class="clause-content">

<table class="info-table">

<tr>

<td>
Le Prestataire :
</td>

<td>

<strong>
SV Pressing Madagascar
</strong>

<br>

Representé par La Direction

<br>

Antananarivo, Madagascar

<br>

Tél: +261 34 99 483 01

<br>

Email:
contact.sasavanda@gmail.com

</td>

</tr>

<tr>

<td>
Le Client :
</td>

<td>

<strong>
${client?.fullName || "Client"}
</strong>

<br>

${
  client?.address
    ? `Adresse: ${client.address}<br>`
    : ""
}

Tél:
${client?.phone || "Non renseigné"}

<br>

Email:
${client?.email || "Non renseigné"}

</td>

</tr>

</table>

</div>

</div>

<!-- Objet -->

<div class="clause">

<div class="clause-title">
ARTICLE 2 - OBJET DU CONTRAT
</div>

<div class="clause-content">

<p>
Le prestataire s'engage à fournir au client un service de pressing comprenant :
</p>

<ul>

<li>
La
<strong>
collecte du linge à domicile
</strong>
selon le planning convenu
</li>

<li>
Le
<strong>
nettoyage professionnel
</strong>
(lavage, séchage, repassage)
</li>

<li>
La
<strong>
livraison à domicile
</strong>
sous 24 à 48h
</li>

<li>
Le
<strong>
service client disponible 7j/7
</strong>
par téléphone et WhatsApp
</li>

</ul>

<p>

<strong>
Formule choisie :
</strong>

${plan?.name || "Formule standard"}

</p>

${
  plan?.description
    ? `<p><strong>Description de la formule :</strong> ${plan.description}</p>`
    : ""
}

${
  plan?.itemsIncluded
    ? `<p><strong>Articles inclus :</strong> ${plan.itemsIncluded} pièces par mois</p>`
    : ""
}

${
  plan?.pickupsPerWeek
    ? `<p><strong>Collectes par semaine :</strong> ${plan.pickupsPerWeek}</p>`
    : ""
}

</div>

</div>

<!-- Tarifs -->

<div class="clause">

<div class="clause-title">
ARTICLE 3 - TARIFS ET MODALITÉS DE PAIEMENT
</div>

<div class="clause-content">

<table class="pricing-table">

<thead>

<tr>

<th>
Description
</th>

<th>
Montant
</th>

<th>
Périodicité
</th>

</tr>

</thead>

<tbody>

<tr>

<td>
Abonnement mensuel -
${plan?.name || "Formule standard"}
</td>

<td class="text-right">

<strong>
${plan?.pricePerMonth || "0"} Ar
</strong>

</td>

<td>
Mensuelle
</td>

</tr>

<tr>

<td>
Frais d'activation ou de mise en service
</td>

<td class="text-right">
0 Ar
</td>

<td>
Unique
</td>

</tr>

<tr class="total-row">

<td>
<strong>
Total mensuel TTC
</strong>
</td>

<td class="text-right">

<strong>
${plan?.pricePerMonth || "0"} Ar
</strong>

</td>

<td>

<strong>
Par mois
</strong>

</td>

</tr>

</tbody>

</table>

<div class="info-box">

<p>
<strong>
Première facturation :
</strong>

${firstBillingDateStr}

</p>

<p>
<strong>
Facturation suivante :
</strong>

Le 15 de chaque mois
</p>

<p>
<strong>
Moyens de paiement acceptés :
</strong>

Espèces, Mobile Money (MVola, Airtel Money), Carte bancaire, Virement

</p>

</div>

</div>

</div>

<!-- Article 4 -->

<div class="clause">

<div class="clause-title">
ARTICLE 4 - DURÉE, RECONDUCTION ET RÉSILIATION
</div>

<div class="clause-content">

<div class="highlight-box">

<p>
<strong>
CE CONTRAT EST SANS ENGAGEMENT DE DURÉE
</strong>
</p>

<p>

Vous pouvez résilier à tout moment, sans frais ni pénalités,
sous réserve de respecter un préavis de
<strong>
2 semaines (14 jours)
</strong>.

</p>

</div>

<p>

<strong>
4.1 Date de début :
</strong>

Le présent contrat prend effet à compter du
<strong>
${startDate}
</strong>.

</p>

<p>

<strong>
4.2 Renouvellement automatique :
</strong>

Le contrat est reconduit automatiquement par tacite reconduction chaque mois,
sauf dénonciation par l'une ou l'autre des parties.

</p>

<div class="warning-box">

<p>
<strong>
CONDITIONS DE RÉSILIATION
</strong>
</p>

<ul>

<li>
<strong>
Préavis :
</strong>
2 semaines (14 jours calendaires)
</li>

<li>
<strong>
Modalité :
</strong>
Par email, WhatsApp ou lettre recommandée
</li>

<li>
<strong>
Effet :
</strong>
La résiliation prend effet à la fin du mois en cours après le préavis
</li>

<li>
<strong>
Aucun frais :
</strong>
La résiliation est gratuite et sans pénalité
</li>

</ul>

</div>

<p>

<strong>
4.3 Résiliation par le prestataire :
</strong>

SV Pressing se réserve le droit de résilier le contrat avec un préavis de 2 semaines en cas de non-paiement répété ou de violation grave des conditions d'utilisation.

</p>

<p>

<strong>
4.4 Suspension du service :
</strong>

En cas d'impayé, le service peut être suspendu après 15 jours de relance.
La réactivation nécessite le paiement des sommes dues.

</p>

</div>

</div>

<!-- Article 5 -->

<div class="clause">

<div class="clause-title">
ARTICLE 5 - ENGAGEMENTS RÉCIPROQUES
</div>

<div class="clause-content">

<p>
<strong>
Le prestataire (SV Pressing) s'engage à :
</strong>
</p>

<ul>

<li>
Assurer une qualité de nettoyage professionnelle irréprochable
</li>

<li>
Respecter les délais de livraison annoncés (24-48h)
</li>

<li>
Utiliser des produits lessiviels de qualité et respectueux de l'environnement
</li>

<li>
Assurer la responsabilité civile en cas de dommage ou perte d'articles
</li>

<li>
Garantir la confidentialité des données personnelles du client
</li>

<li>
Proposer un service client réactif (réponse sous 24h)
</li>

<li>
Informer le client de tout changement de tarif au moins 30 jours à l'avance
</li>

</ul>

<p>
<strong>
Le client s'engage à :
</strong>
</p>

<ul>

<li>
Payer les factures dans les délais impartis
</li>

<li>
Préparer le linge dans des sacs adaptés fournis par SV Pressing
</li>

<li>
Signaler tout problème (détérioration, perte) dans les 48h suivant la livraison
</li>

<li>
Informer SV Pressing de tout changement de coordonnées
</li>

<li>
Respecter les consignes de tri et de préparation du linge
</li>

<li>
Être présent lors des créneaux de collecte et de livraison convenus
</li>

</ul>

</div>

</div>

<!-- Article 6 -->

<div class="clause">

<div class="clause-title">
ARTICLE 6 - RESPONSABILITÉ ET INDEMNISATION
</div>

<div class="clause-content">

<p>
SV Pressing Madagascar est couvert par une assurance responsabilité civile professionnelle.
</p>

<p>
<strong>
Indemnisation en cas de perte ou détérioration :
</strong>
</p>

<ul>

<li>
<strong>
Vêtements standards :
</strong>
Jusqu'à 50 000 Ar par article
</li>

<li>
<strong>
Vêtements de valeur (marques, créateurs) :
</strong>
Jusqu'à 150 000 Ar après présentation de preuve d'achat
</li>

<li>
<strong>
Articles délicats (soie, laine, dentelle) :
</strong>
Traitement spécial garanti, indemnisation standard
</li>

</ul>

<p>
<strong>
Exclusions de responsabilité :
</strong>
</p>

<ul>

<li>
Objets laissés dans les poches
(argent, bijoux, téléphone, papiers)
</li>

<li>
Taches préexistantes non signalées avant le nettoyage
</li>

<li>
Usure naturelle des vêtements due à l'âge ou à une mauvaise qualité textile
</li>

<li>
Instructions de lavage non respectées si aucune étiquette n'est présente
</li>

</ul>

</div>

</div>

<!-- Article 7 -->

<div class="clause">

<div class="clause-title">
ARTICLE 7 - MODIFICATION DES TARIFS
</div>

<div class="clause-content">

<p>

Les tarifs peuvent être révisés par SV Pressing.
Toute modification tarifaire sera notifiée au client par email ou SMS au moins
<strong>
30 jours avant son entrée en vigueur
</strong>.

</p>

<p>

Le client pourra résilier sans frais dans les 15 jours suivant la notification de la modification tarifaire,
conformément aux conditions de préavis de 2 semaines.

</p>

</div>

</div>

<!-- Article 8 -->

<div class="clause">

<div class="clause-title">
ARTICLE 8 - LOI APPLICABLE ET LITIGES
</div>

<div class="clause-content">

<p>
Le présent contrat est régi par la loi malgache.
</p>

<p>

En cas de litige, une solution amiable sera recherchée en priorité.
À défaut d'accord, le litige sera soumis au tribunal compétent d'Antananarivo, Madagascar.

</p>

<p>

Pour toute réclamation, le client peut contacter SV Pressing par email à
contact.sasavanda@gmail.com
ou par téléphone au
+261 34 99 483 01.

</p>

</div>

</div>

<!-- Rappel -->

<div class="warning-box">

<p>
<strong>
RAPPEL IMPORTANT
</strong>
</p>

<p>
Vous pouvez résilier votre abonnement à tout moment :
</p>

<ul>

<li>
Par email :
<strong>
contact.sasavanda@gmail.com
</strong>
</li>

<li>
Par WhatsApp :
<strong>
+261 34 99 483 01
</strong>
</li>

</ul>

<p>
<em>
Préavis de 2 semaines requis.
La résiliation est gratuite et sans engagement.
</em>
</p>

</div>

<!-- Signatures -->

<div class="signatures">

<div class="signature-box">

<div class="signature-title">
Pour SV Pressing Madagascar
</div>

<div class="signature-line"></div>

<div class="signature-date">
Lu et approuvé, le ${currentDate}
</div>

</div>

<div class="signature-box">

<div class="signature-title">
Pour le client
</div>

<div class="signature-line"></div>

<div class="signature-date">
Lu et approuvé, le ${currentDate}
</div>

</div>

</div>

</div>

<!-- Pied de page -->

<div class="footer">

<p>
<strong>
SV Pressing Madagascar
</strong>
- Service de pressing professionnel à Antananarivo
</p>

<p>
Tél: +261 34 99 483 01 |
Email: contact.sasavanda@gmail.com
</p>

<p>
Contrat mensuel sans engagement -
Préavis 2 semaines -
Renouvellement automatique
</p>

<p>
Document généré le ${currentDate} -
Faire deux exemplaires originaux
</p>

</div>

</div>

</body>
</html>`;
  }

  /*
   * ============================================================
   * PUPPETEER / CHROME
   * ============================================================
   *
   * On utilise le Chrome déjà installé sur Windows.
   *
   * Chemin trouvé sur la machine :
   *
   * C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
   *
   * Cela évite que Puppeteer cherche uniquement son Chrome
   * dans :
   *
   * C:\Users\SITRAKA Haritsona\.cache\puppeteer
   */

  const chromePath =
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

  if (!fs.existsSync(chromePath)) {
    throw new Error(
      `Google Chrome introuvable à l'emplacement suivant : ${chromePath}`
    );
  }

  console.log("========================================");
  console.log("GENERATION DU CONTRAT PDF");
  console.log("========================================");

  console.log(
    "Client:",
    client?.fullName || "Client"
  );

  console.log(
    "Subscription:",
    subscription?.id || "Aucune"
  );

  console.log(
    "Plan:",
    plan?.name || "Aucun"
  );

  console.log(
    "Chrome:",
    chromePath
  );

  let browser:
    Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    console.log("Lancement de Google Chrome...");

    browser = await puppeteer.launch({
      headless: true,

      executablePath: chromePath,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-breakpad",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-features=Translate,BackForwardCache",
        "--disable-hang-monitor",
        "--disable-ipc-flooding-protection",
        "--disable-popup-blocking",
        "--disable-prompt-on-repost",
        "--disable-renderer-backgrounding",
        "--force-color-profile=srgb",
        "--no-first-run",
        "--no-zygote",
      ],

      ignoreDefaultArgs: [
        "--disable-extensions",
      ],
    });

    console.log(
      "Puppeteer lancé avec succès."
    );

    /*
     * Nouvelle page.
     */
    const page = await browser.newPage();

    /*
     * Taille A4 approximative en pixels.
     */
    await page.setViewport({
      width: 1240,
      height: 1754,
      deviceScaleFactor: 1,
    });

    /*
     * Active JavaScript.
     */
    await page.setJavaScriptEnabled(true);

    /*
     * Timeout.
     */
    page.setDefaultTimeout(30000);

    page.setDefaultNavigationTimeout(30000);

    /*
     * Injection du HTML.
     */
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    console.log(
      "HTML chargé dans Puppeteer."
    );

    /*
     * Attendre les polices.
     */
    await page.evaluate(async () => {
      if (
        document.fonts &&
        document.fonts.ready
      ) {
        await document.fonts.ready;
      }
    });

    /*
     * Petit délai pour terminer le rendu.
     */
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 300);
    });

    /*
     * Vérification du contenu.
     */
    const bodyExists = await page.evaluate(() => {
      return (
        !!document.body &&
        document.body.innerHTML.length > 0
      );
    });

    if (!bodyExists) {
      throw new Error(
        "Le contenu HTML du contrat est vide."
      );
    }

    console.log(
      "Contenu HTML vérifié."
    );

    /*
     * Configuration impression.
     */
    await page.emulateMediaType("print");

    /*
     * Génération PDF.
     */
    const pdfBuffer = await page.pdf({
      format: "A4",

      printBackground: true,

      preferCSSPageSize: false,

      displayHeaderFooter: false,

      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "12mm",
        right: "12mm",
      },

      scale: 1,

      timeout: 30000,
    });

    /*
     * Vérification PDF.
     */
    if (
      !pdfBuffer ||
      pdfBuffer.length === 0
    ) {
      throw new Error(
        "Puppeteer a généré un PDF vide."
      );
    }

    console.log(
      `PDF généré avec succès: ${pdfBuffer.length} octets`
    );

    console.log(
      "========================================"
    );

    return Buffer.from(pdfBuffer);

  } catch (error) {

    console.error(
      "========================================"
    );

    console.error(
      "ERREUR GENERATION CONTRAT PDF"
    );

    console.error(
      "========================================"
    );

    if (error instanceof Error) {

      console.error(
        "Message:",
        error.message
      );

      console.error(
        "Stack:",
        error.stack
      );

    } else {

      console.error(
        "Erreur inconnue:",
        error
      );

    }

    throw new Error(
      `Erreur génération PDF: ${
        error instanceof Error
          ? error.message
          : "Erreur inconnue"
      }`
    );

  } finally {

    /*
     * Toujours fermer le navigateur.
     */
    if (browser) {

      try {

        await browser.close();

        console.log(
          "Navigateur Puppeteer fermé."
        );

      } catch (closeError) {

        console.error(
          "Erreur fermeture Puppeteer:",
          closeError
        );

      }

    }

  }
}