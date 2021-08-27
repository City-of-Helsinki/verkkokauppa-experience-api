import { HandleBarTemplate } from "./service";
import type { OrderConfirmationEmailParameters } from "./types";

describe('Test Calculate Totals for Order', () => {
    it('Should throw error with no backend url set', async () => {

        const templateParams: OrderConfirmationEmailParameters = {
            receipt_header: "Maksutiedot",
            receipt_details: [
                {
                    description: "Kiinteähintainen tuote",
                    fieldValue: "10.50 €",
                    bold: true,
                },
                {
                    description: "Sis. alv (24%)",
                    fieldValue: "2.52 €",
                    className: "pb-1",
                },
                {
                    description: "Maksettu yhteensä",
                    fieldValue: "10.50 €",
                },
                {
                    description: "Maksutapa",
                    fieldValue: "DanskeBank",
                },
                {
                    description: "Päivämäärä",
                    fieldValue: "06.05.2021 13:55:42"
                },
            ],
            order_header: "Tilaajan tiedot",
            order_details: [
                {
                    description: "Essi esimerkki",
                },
                {
                    description: "essi.esimerkki@gmail.com",
                },
                {
                    description: "+358123456789",
                    className: "pb-1",
                },
                {
                    description: "Esimerkkiosoite 1",
                },
                {
                    description: "123456 Esimerkkitoimipaikka",
                },
            ],
            merchant_header: "Myyjän tiedot",
            merchant_details: [
                {
                    description: "Helsingin kaupunki",
                },
                {
                    description: "Kaupunkiympäristö",
                    className: "pb-1",
                },
                {
                    description: "Kaupunkiympäristön asiakaspalvelu",
                },
                {
                    description: "PL 58231 (Työpajankatu 8)",
                },
                {
                    description: "00099 HELSINGIN KAUPUNKI",
                },
                {
                    description: "Y-tunnus 0201256-6",
                },
            ],
        };

        const template = HandleBarTemplate<OrderConfirmationEmailParameters>();
        template.setFileName("orderConfirmation");
        const compiledTemplate = template.createTemplate();

        const orderConfirmationTemplate = compiledTemplate(templateParams);
        expect(orderConfirmationTemplate).toBe(null);

    })

})