const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

const logoPath = path.resolve(__dirname, '../public/images/logo.png');
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = logoBuffer.toString('base64');
const logoExt = path.extname(logoPath).substring(1); // b.v. "png"

function formatDateToDDMMYYYY(dateInput) {
    const date = new Date(dateInput);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function formatHour(date) {
    return new Date(date).toLocaleTimeString('nl-BE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getFuelLevelText(level) {
    switch (level) {
        case "1": return "Volle tank";
        case "3/4": return "75% volle tank";
        case "1/2": return "Halfvolle tank";
        case "1/4": return "25% volle tank";
        default: return "";
    }
}

function getNotes(notes) {
    if (notes != null && notes !== "")
        return `<p>${notes}</p>`;
    return `<p>Geen opmerkingen.</p>`;
}

function getTextForCosts(cost) {
    if (cost) {
        return `${roundToTwoDigit(cost)}`;
    }
    return `0.00`;
}

function calculateCosts(costs) {
    if (costs !== null) {
        const { dayCost, days, miles, mileCost, fuelCost } = costs;
        const costsRent = (dayCost ?? 0) * (days ?? 0);
        const costsMiles = (miles ?? 0) * (mileCost ?? 0);
        return fuelCost + costsRent + costsMiles;
    }
    return null;
}

function getTotalCostWithoutVat(costs) {
    const totalCosts = calculateCosts(costs);
    if (!totalCosts) {
        return `<td>= € 0.00</td>`;
    }
    return `<td>= € ${roundToTwoDigit(totalCosts)}</td>`
}

function getTotalCostWithVat(costs) {
    const totalCosts = calculateCosts(costs);
    if (!totalCosts) {
        return `<td>= € 0.00</td>`;
    }
    return `<td>= € ${(roundToTwoDigit(totalCosts* 1.21))}</td>`
}

function getDayCosts(costs) {
    if (costs) {
        const { dayCost, days } = costs;
        return `<td>= € ${roundToTwoDigit((dayCost ?? 0) * (days ?? 0))}</td>`;
    }
    return `<td>= € 0.00</td>`;
}

function getMileageCosts(costs) {
    if (costs) {
        const { miles, mileCost } = costs;
        return `<td>= € ${roundToTwoDigit((miles ?? 0) * (mileCost ?? 0))}</td>`;
    }
    return `<td>= € 0.00</td>`;
}

function roundToTwoDigit(number) {
    return (Math.round(number * 100) / 100).toFixed(2)
}

async function generateContractPdf(reservation, customer, car) {
    const contractHtml = `
    <!DOCTYPE html>
<html lang="nl">
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 40px;
                font-size: 13px;
            }
            h1, h2, h3 {
                margin: 0;
            }
            .header, .section-title {
                background-color: #444;
                color: white;
                padding: 5px 10px;
                margin: 15px 0 5px;
                font-weight: bold;
                text-transform: uppercase;
                font-size: 15px;
            }
            .logo-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .logo {
                width: 120px;
                height: auto;
            }
            .table {
                width: 100%;
                border-collapse: collapse;
            }
            .table td {
                padding: 5px;
                vertical-align: top;
            }
            .table td:first-child {
                width: 50%;
            }
            .divider {
                border-top: 2px solid black;
                margin: 20px 0;
            }
            .small-boxes {
                display: flex;
                gap: 5px;
            }
            .box {
                width: 15px;
                height: 15px;
                border: 1px solid #000;
                display: inline-block;
            }
            .footer-note {
                font-size: 13px;
                margin-top: 10px;
                text-align: justify;
            }
            .signature-block {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
            }
            .signature-block div {
                width: 45%;
                border-top: 1px solid black;
                text-align: center;
                padding-top: 5px;
                margin-top: 20px;
            }
            .line {
                border-bottom: 1px solid black;
                display: inline-block; 
                width: 80px;
            }
            h2 {
                font-size: 14px;
                text-align: right;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>

    <div class="logo-section">
        <div>
            <strong>AUTO-SERVICE THOMAS</strong><br>
            Gentweg 26, 9940 Evergem<br>
            0479/71.04.37<br>
            tho_vw@hotmail.com
        </div>
        <div style="text-align: right;">
            <img class="logo" src="data:image/${logoExt};base64,${logoBase64}" alt="Auto logo" /><br>
            <h2>OVEREENKOMST<br>VOOR EEN VERVANGWAGEN</h2>
        </div>
    </div>

    <div class="section-title">Ontlener</div>
    <table class="table">
        <tr>
            <td><strong>Naam:</strong> ${customer.name}</td>
            <td><strong>Voornaam:</strong> ${customer.firstName}</td>
        </tr>
        <tr>
            <td><strong>Geboorteplaats:</strong> ${customer.placeOfBirth} </td>
            <td><strong>Geboortedatum:</strong> ${formatDateToDDMMYYYY(customer.dateOfBirth)}</td>
        </tr>
        <tr>
            <td><strong>Straat:</strong> ${customer.street}</td>
            <td><strong>Huisnr:</strong> ${customer.houseNumber}</td>
        </tr>
        <tr>
            <td><strong>Rijbewijsnummer:</strong> ${customer.drivingLicense}</td>
            <td><strong>Tel:</strong> ${customer.phone}</td>
        </tr>
    </table>

    <div class="section-title">Voertuig ontlener</div>
    <table class="table">
        <tr>
            <td><strong>Merk:</strong> ${reservation.car.make}</td>
            <td><strong>Type:</strong> ${reservation.car.type}</td>
        </tr>
        <tr>
            <td><strong>Kentekenplaat:</strong> ${reservation.car.licensePlate}</td>
            <td><strong>Chassisnummer:</strong> ${reservation.car.vin}</td>
        </tr>
    </table>

    <div class="section-title">Vervangwagen</div>
    <table class="table">
        <tr>
            <td><strong>Merk:</strong> ${car.make}</td>
            <td><strong>Type:</strong> ${car.type}</td>
        </tr>
        <tr>
            <td><strong>Chassisnummer:</strong> ${car.vin}</td>
            <td><strong>Inschrijving:</strong> ${formatDateToDDMMYYYY(car?.dateOfRegistration)}</td>
        </tr>
        <tr>
            <td><strong>Vertrek:</strong> ${formatDateToDDMMYYYY(reservation?.startDate)} om ${formatHour(reservation?.startDate)} uur</td>
            <td><strong>Kilometerstand vertrek:</strong> ${reservation?.mileageStart}</td>
        </tr>
        <tr>
            <td><strong>Terugkeer voorzien:</strong> <span class="line"></span> om <span class="line"></span> uur</td>
            <td><strong>Kilometerstand terug:</strong> <span class="line"></span></td>
        </tr>
        <tr>
            <td><strong>Teruggekeerd:</strong> <span class="line"></span> om <span class="line"></span> uur</td>
            <td><strong>Kilometers afgelegd:</strong> <span class="line"></span></td>
        </tr>
        <tr>
            <td><strong>Brandstofpeil vertrek:</strong> ${getFuelLevelText(reservation?.fuelLevel)}</td>
            <td><strong>Terugkomst:</strong> [1/4] [1/2] [3/4] [1]</td>
        </tr>
    </table>

    <div class="section-title">Kosten</div>
    <table class="table">
        <tr>
            <td><strong>Verzekering franchise:</strong></td>
            <td>= € ${getTextForCosts(reservation?.costs?.insurance)}</td>
        </tr>
        <tr>
            <td><strong>Kost/dag:</strong> € ${getTextForCosts(reservation?.costs?.dayCost)} /dag x ${getTextForCosts(reservation.costs.days)} dagen </td>
            ${getDayCosts(reservation?.costs)}
        </tr>
        <tr>
            <td><strong>Km's extra:</strong> ${getTextForCosts(reservation?.costs?.miles)} km's x € ${getTextForCosts(reservation.costs.mileCost)} /km</td>
            ${getMileageCosts(reservation?.costs)}
        </tr>
        <tr>
            <td><strong>Supplement brandstof:</strong></td>
            <td>= € ${getTextForCosts(reservation?.costs?.fuelCost)}</td>
        </tr>
        <tr>
            <td><strong>Subtotaal excl. BTW:</strong></td>
            ${getTotalCostWithoutVat(reservation?.costs)}
        </tr>
        <tr>
            <td><strong>Totaal incl. BTW 21%:</strong></td>
            ${getTotalCostWithVat(reservation?.costs)}
        </tr>
    </table>
    <div class="section-title">Opmerkingen</div>
    ${getNotes(reservation.notes)}
    <div class="section-title">Handtekening</div>
    <div class="footer-note">
        Ik heb kennis genomen van de staat van het voertuig, en de voorwaarden op de achterkant van deze overneenkomst.
Opgemaakt in tweevoud. Dit contract moet het voertuig vergezellen tijdens de duur van de ontlening, en kan worden voorgelegd aan bevoegde instanties zoals politie.
    </div>

    <div class="footer-note">
        Opgemaakt te 9940 Evergem op ${formatDateToDDMMYYYY(reservation.startDate)}.
    </div>

    <div class="signature-block">
        <div>${customer.name} ${customer.firstName}</div>
        <div>AUTO-SERVICE THOMAS</div>
    </div>
</body>
</html>
    `;

    const termsHtml = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            font-size: 12px;
            line-height: 1.5;
        }
        h1 {
            text-align: center;
            margin-bottom: 20px;
            text-transform: uppercase;
            font-size: 16px;
        }
        .section-title {
            background-color: #444;
            color: white;
            padding: 5px 10px;
            margin: 12.5px 0 5px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 13px;
        }
        p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <h1>Leningsvoorwaarden vervangwagen</h1>

    <div class="section-title">Artikel 1 - Doel van de overeenkomst</div>
    <p>De overeenkomst voorziet in een vervangwagen voor klanten waarvan de eigen wagen in de werkplaats blijft voor onderhoud of herstelling. De gebruiker van de wagen is in deze voorwaarden de ontlener.</p>

    <div class="section-title">Artikel 2 - Begunstigde van de vervangwagen</div>
    <p>De ontlener moet in het bezit zijn van een geldig rijbewijs. De overeenkomst en de wagen zijn niet overdraagbaar. Enkel de persoon wiens naam in de overeenkomst vermeld staat, mag het voertuig besturen.</p>

    <div class="section-title">Artikel 3 - Gebruik van het voertuig</div>
    <p>De ontlener zal zorg dragen voor het voertuig en verbindt zich ertoe:</p>
    <ul>
        <li>Het voertuig enkel te gebruiken voor persoonlijke, niet-commerciële doeleinden.</li>
        <li>Niet deel te nemen aan races, rally’s of wedstrijden.</li>
        <li>Geen personen of goederen tegen betaling te vervoeren.</li>
        <li>Geen wijzigingen aan het voertuig aan te brengen.</li>
        <li>De wagen niet te overbelasten.</li>
        <li>Geen andere voertuigen of aanhangwagens te slepen.</li>
    </ul>

    <div class="section-title">Artikel 4 - Staat van het voertuig</div>
    <p>De vervangwagen wordt in perfecte staat geleverd met het brandstofniveau zoals vermeld in de overeenkomst. De ontlener verbindt zich ertoe de wagen in dezelfde staat en met hetzelfde brandstofniveau terug te brengen. Elke inbreuk is voor rekening van de ontlener.</p>

    <div class="section-title">Artikel 5 - Onderhoud en herstellingen</div>
    <p>De ontlener verzorgt het routine-onderhoud van de wagen. Kosten door abnormale slijtage, verwaarlozing of gebrek aan toezicht zijn voor rekening van de ontlener. Alle werken worden uitgevoerd door de lener, tenzij bij overmacht en mits voorafgaande toestemming. Bij problemen stelt de ontlener alles in het werk om verdere schade te voorkomen.</p>

    <div class="section-title">Artikel 6 - Ongevallen en verzekering</div>
    <p>Het voertuig is verzekerd volgens de voorwaarden op de achterzijde van deze overeenkomst. De ontlener moet bij een ongeval binnen 24 uur aangifte doen bij de lener en het ingevulde aanrijdingsformulier of een politierapport bezorgen. Bij diefstal moet de politie en de lener binnen 24 uur verwittigd worden.</p>

    <div class="section-title">Artikel 7 - Financiële participatie</div>
    <p>Een financiële bijdrage is verschuldigd voor het gebruik van de wagen, berekend per dag van gebruik (elke begonnen dag wordt volledig aangerekend). Bij niet-betaling behoudt de lener het recht het voertuig van de ontlener bij te houden in de werkplaats.</p>

    <div class="section-title">Artikel 8 - Teruggave van het voertuig</div>
    <p>De wagen moet teruggegeven worden na het verstrijken van de overeenkomst. Bij teruggave wordt de wagen gecontroleerd op schade en naleving van de overeenkomst. Indien de ontlener hierbij niet aanwezig is, kan bezwaar worden gemaakt tegen de vaststellingen.</p>

    <div class="section-title">Artikel 9 - Schending en boetes</div>
    <p>De ontlener is volledig verantwoordelijk voor alle overtredingen en boetes conform de wegcode.</p>

    <div class="section-title">Artikel 10 - Geschillen</div>
    <p>In geval van geschillen is de rechtbank van de plaats van de ontlener bevoegd.</p>
</body>
</html>
`;

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(contractHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer1 = await page.pdf({ format: 'A4', printBackground: true });

    await page.setContent(termsHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer2 = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

    const mergedPdf = await PDFDocument.create();
    const pdf1 = await PDFDocument.load(pdfBuffer1);
    const pdf2 = await PDFDocument.load(pdfBuffer2);

    const copiedPages1 = await mergedPdf.copyPages(pdf1, pdf1.getPageIndices());
    copiedPages1.forEach(page => mergedPdf.addPage(page));

    const copiedPages2 = await mergedPdf.copyPages(pdf2, pdf2.getPageIndices());
    copiedPages2.forEach(page => mergedPdf.addPage(page));

    const finalPdf = await mergedPdf.save();

    const fileName = `reservatie-${reservation._id}.pdf`;
    const contractsPath = path.join(__dirname, '../uploads/contracts');
    fs.mkdirSync(contractsPath, { recursive: true });
    const filePath = path.join(contractsPath, fileName);
    fs.writeFileSync(filePath, finalPdf);

    return `/uploads/contracts/${fileName}`;
}

module.exports = generateContractPdf;