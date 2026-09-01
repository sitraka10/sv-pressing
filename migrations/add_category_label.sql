-- ================================================================
-- MIGRATION SQL - CATÉGORIES DE DÉPENSES EN FRANÇAIS
-- VERSION AVEC IDENTIFICATION DES VALEURS EXISTANTES D'ABORD
-- ================================================================

-- ================================================================
-- ÉTAPE 1: Voir toutes les catégories existantes
-- ================================================================

SELECT DISTINCT category FROM expenses ORDER BY category;
SELECT DISTINCT category FROM category_budgets ORDER BY category;
SELECT DISTINCT category FROM budget_alerts ORDER BY category;
SELECT DISTINCT category FROM recurring_expenses ORDER BY category;

-- ================================================================
-- ÉTAPE 2: Convertir les colonnes en TEXT d'abord
-- ================================================================

ALTER TABLE expenses ALTER COLUMN category TYPE text;
ALTER TABLE category_budgets ALTER COLUMN category TYPE text;
ALTER TABLE budget_alerts ALTER COLUMN category TYPE text;
ALTER TABLE recurring_expenses ALTER COLUMN category TYPE text;

-- ================================================================
-- ÉTAPE 3: Supprimer l'ancien type ENUM
-- ================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
        DROP TYPE expense_category CASCADE;
        RAISE NOTICE 'Ancien type expense_category supprimé';
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 4: Supprimer le nouveau type s'il existe
-- ================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category_fr') THEN
        DROP TYPE expense_category_fr CASCADE;
        RAISE NOTICE 'Type expense_category_fr supprimé';
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 5: Créer le nouveau type ENUM en français
-- ================================================================

CREATE TYPE expense_category_fr AS ENUM (
  'Détergent en poudre',
  'Détergent liquide',
  'Assouplissant',
  'Eau de Javel',
  'Détachant',
  'Dégraissant professionnel',
  'Désinfectant',
  'Machine à laver',
  'Sèche-linge',
  'Fer à repasser',
  'Table à repasser',
  'Défroisseur vapeur',
  'Chaudière',
  'Extracteur',
  'Plieuse',
  'Sachet plastique',
  'Carton',
  'Cintre',
  'Housse de protection',
  'Étiquette autocollante',
  'Papier ticket',
  'Cartouche encre',
  'Fournitures bureau',
  'Équipement informatique',
  'Logiciel comptable',
  'Carburant groupe électrogène',
  'Carburant véhicule',
  'Électricité JIRAMA',
  'Eau JIRAMA',
  'Internet',
  'Téléphone',
  'Maintenance solaire',
  'Maintenance groupe électrogène',
  'Loyer local',
  'Taxe foncière',
  'Rénovation',
  'Sécurité',
  'Service de nettoyage',
  'Salaire employé',
  'Heures supplémentaires',
  'Prime',
  'Charges sociales',
  'Formation',
  'Assurance santé',
  'Uniforme',
  'Indemnité transport',
  'Livraison moto',
  'Livraison voiture',
  'Livreur',
  'Carburant livraison',
  'Entretien véhicule',
  'Assurance véhicule',
  'Flyer publicitaire',
  'Réseaux sociaux',
  'Promotion',
  'Enseigne',
  'Publicité radio/TV',
  'Site web',
  'Honoraire comptable',
  'Frais juridiques',
  'Consulting',
  'IRSA',
  'TVA',
  'IB',
  'Taxe municipale',
  'Patente',
  'Frais bancaires',
  'Transfert argent',
  'Intérêts emprunt',
  'Prime assurance',
  'Repas personnel',
  'Eau en bouteille',
  'Café-Thé',
  'Pharmacie',
  'Événement social',
  'Imprévu',
  'Vol-perte',
  'Autres'
);

-- ================================================================
-- ÉTAPE 6: Mettre à jour les valeurs en français avec toutes les variantes
-- ================================================================

-- expenses - avec toutes les variantes possibles
UPDATE expenses SET category = 'Assouplissant' WHERE category IN ('fabric_softener', 'fabric_softeners', 'fabric_softener');
UPDATE expenses SET category = 'Détergent en poudre' WHERE category IN ('detergent_powder', 'detergent_powders');
UPDATE expenses SET category = 'Détergent liquide' WHERE category IN ('detergent_liquid', 'detergent_liquids');
UPDATE expenses SET category = 'Eau de Javel' WHERE category IN ('bleach', 'bleaches');
UPDATE expenses SET category = 'Détachant' WHERE category IN ('stain_remover', 'stain_removers');
UPDATE expenses SET category = 'Dégraissant professionnel' WHERE category IN ('degreaser', 'degreasers');
UPDATE expenses SET category = 'Désinfectant' WHERE category IN ('disinfectant', 'disinfectants');
UPDATE expenses SET category = 'Machine à laver' WHERE category IN ('washing_machine', 'washing_machines');
UPDATE expenses SET category = 'Sèche-linge' WHERE category IN ('dryer', 'dryers');
UPDATE expenses SET category = 'Fer à repasser' WHERE category IN ('iron', 'irons');
UPDATE expenses SET category = 'Table à repasser' WHERE category IN ('ironing_board', 'ironing_boards');
UPDATE expenses SET category = 'Défroisseur vapeur' WHERE category IN ('steamer', 'steamers');
UPDATE expenses SET category = 'Chaudière' WHERE category IN ('boiler', 'boilers');
UPDATE expenses SET category = 'Extracteur' WHERE category IN ('extractor', 'extractors');
UPDATE expenses SET category = 'Plieuse' WHERE category IN ('folder', 'folders');
UPDATE expenses SET category = 'Sachet plastique' WHERE category IN ('plastic_packaging', 'plastic_packagings');
UPDATE expenses SET category = 'Carton' WHERE category IN ('cardboard_box', 'cardboard_boxes');
UPDATE expenses SET category = 'Cintre' WHERE category IN ('hanger', 'hangers');
UPDATE expenses SET category = 'Housse de protection' WHERE category IN ('garment_bag', 'garment_bags');
UPDATE expenses SET category = 'Étiquette autocollante' WHERE category IN ('label_sticker', 'label_stickers');
UPDATE expenses SET category = 'Papier ticket' WHERE category IN ('receipt_paper', 'receipt_papers');
UPDATE expenses SET category = 'Cartouche encre' WHERE category IN ('ink_toner', 'ink_toners');
UPDATE expenses SET category = 'Fournitures bureau' WHERE category IN ('office_supplies', 'office_supply');
UPDATE expenses SET category = 'Équipement informatique' WHERE category IN ('computer_equipment', 'computer_equipments');
UPDATE expenses SET category = 'Logiciel comptable' WHERE category IN ('accounting_software', 'accounting_softwares');
UPDATE expenses SET category = 'Carburant groupe électrogène' WHERE category IN ('fuel_for_generator', 'fuel_for_generators');
UPDATE expenses SET category = 'Carburant véhicule' WHERE category IN ('fuel_for_vehicle', 'fuel_for_vehicles');
UPDATE expenses SET category = 'Électricité JIRAMA' WHERE category IN ('electricity', 'electricities');
UPDATE expenses SET category = 'Eau JIRAMA' WHERE category IN ('water', 'waters');
UPDATE expenses SET category = 'Internet' WHERE category IN ('internet', 'internets');
UPDATE expenses SET category = 'Téléphone' WHERE category IN ('phone', 'phones');
UPDATE expenses SET category = 'Maintenance solaire' WHERE category IN ('solar_maintenance', 'solar_maintenances');
UPDATE expenses SET category = 'Maintenance groupe électrogène' WHERE category IN ('generator_maintenance', 'generator_maintenances');
UPDATE expenses SET category = 'Loyer local' WHERE category IN ('rent', 'rents');
UPDATE expenses SET category = 'Taxe foncière' WHERE category IN ('property_tax', 'property_taxes');
UPDATE expenses SET category = 'Rénovation' WHERE category IN ('renovation', 'renovations');
UPDATE expenses SET category = 'Sécurité' WHERE category IN ('security', 'securities');
UPDATE expenses SET category = 'Service de nettoyage' WHERE category IN ('cleaning_service', 'cleaning_services');
UPDATE expenses SET category = 'Salaire employé' WHERE category IN ('salary', 'salaries');
UPDATE expenses SET category = 'Heures supplémentaires' WHERE category IN ('overtime', 'overtimes');
UPDATE expenses SET category = 'Prime' WHERE category IN ('bonus', 'bonuses');
UPDATE expenses SET category = 'Charges sociales' WHERE category IN ('social_charges', 'social_charge');
UPDATE expenses SET category = 'Formation' WHERE category IN ('training', 'trainings');
UPDATE expenses SET category = 'Assurance santé' WHERE category IN ('health_insurance', 'health_insurances');
UPDATE expenses SET category = 'Uniforme' WHERE category IN ('uniform', 'uniforms');
UPDATE expenses SET category = 'Indemnité transport' WHERE category IN ('transport_allowance', 'transport_allowances');
UPDATE expenses SET category = 'Livraison moto' WHERE category IN ('delivery_motorbike', 'delivery_motorbikes');
UPDATE expenses SET category = 'Livraison voiture' WHERE category IN ('delivery_car', 'delivery_cars');
UPDATE expenses SET category = 'Livreur' WHERE category IN ('delivery_staff', 'delivery_staffs');
UPDATE expenses SET category = 'Carburant livraison' WHERE category IN ('delivery_fuel', 'delivery_fuels');
UPDATE expenses SET category = 'Entretien véhicule' WHERE category IN ('vehicle_maintenance', 'vehicle_maintenances');
UPDATE expenses SET category = 'Assurance véhicule' WHERE category IN ('insurance_vehicle', 'insurance_vehicles');
UPDATE expenses SET category = 'Flyer publicitaire' WHERE category IN ('marketing_flyer', 'marketing_flyers');
UPDATE expenses SET category = 'Réseaux sociaux' WHERE category IN ('marketing_social', 'marketing_socials');
UPDATE expenses SET category = 'Promotion' WHERE category IN ('marketing_promo', 'marketing_promos');
UPDATE expenses SET category = 'Enseigne' WHERE category IN ('signage', 'signages');
UPDATE expenses SET category = 'Publicité radio/TV' WHERE category IN ('radio_tv', 'radio_tvs');
UPDATE expenses SET category = 'Site web' WHERE category IN ('website', 'websites');
UPDATE expenses SET category = 'Honoraire comptable' WHERE category IN ('accountant', 'accountants');
UPDATE expenses SET category = 'Frais juridiques' WHERE category IN ('legal_fees', 'legal_fee');
UPDATE expenses SET category = 'Consulting' WHERE category IN ('consulting', 'consultings');
UPDATE expenses SET category = 'IRSA' WHERE category IN ('tax_irsa', 'irsa');
UPDATE expenses SET category = 'TVA' WHERE category IN ('tax_vat', 'vat');
UPDATE expenses SET category = 'IB' WHERE category IN ('tax_ib', 'ib');
UPDATE expenses SET category = 'Taxe municipale' WHERE category IN ('municipal_tax', 'municipal_taxes');
UPDATE expenses SET category = 'Patente' WHERE category IN ('business_license', 'business_licenses');
UPDATE expenses SET category = 'Frais bancaires' WHERE category IN ('bank_fees', 'bank_fee');
UPDATE expenses SET category = 'Transfert argent' WHERE category IN ('money_transfer', 'money_transfers');
UPDATE expenses SET category = 'Intérêts emprunt' WHERE category IN ('loan_interest', 'loan_interests');
UPDATE expenses SET category = 'Prime assurance' WHERE category IN ('insurance_premium', 'insurance_premiums');
UPDATE expenses SET category = 'Repas personnel' WHERE category IN ('staff_meal', 'staff_meals');
UPDATE expenses SET category = 'Eau en bouteille' WHERE category IN ('water_bottles', 'water_bottle');
UPDATE expenses SET category = 'Café-Thé' WHERE category IN ('coffee_tea', 'coffee_teas');
UPDATE expenses SET category = 'Pharmacie' WHERE category IN ('first_aid', 'first_aids');
UPDATE expenses SET category = 'Événement social' WHERE category IN ('social_event', 'social_events');
UPDATE expenses SET category = 'Imprévu' WHERE category IN ('contingency', 'contingencies');
UPDATE expenses SET category = 'Vol-perte' WHERE category IN ('theft_loss', 'theft_losses');
UPDATE expenses SET category = 'Autres' WHERE category IN ('other', 'others', 'autre');

-- Mettre à jour les autres tables avec la même logique
-- category_budgets
UPDATE category_budgets SET category = 'Assouplissant' WHERE category IN ('fabric_softener', 'fabric_softeners');
UPDATE category_budgets SET category = 'Détergent en poudre' WHERE category IN ('detergent_powder', 'detergent_powders');
UPDATE category_budgets SET category = 'Détergent liquide' WHERE category IN ('detergent_liquid', 'detergent_liquids');
UPDATE category_budgets SET category = 'Eau de Javel' WHERE category IN ('bleach', 'bleaches');
UPDATE category_budgets SET category = 'Détachant' WHERE category IN ('stain_remover', 'stain_removers');
UPDATE category_budgets SET category = 'Dégraissant professionnel' WHERE category IN ('degreaser', 'degreasers');
UPDATE category_budgets SET category = 'Désinfectant' WHERE category IN ('disinfectant', 'disinfectants');
UPDATE category_budgets SET category = 'Machine à laver' WHERE category IN ('washing_machine', 'washing_machines');
UPDATE category_budgets SET category = 'Sèche-linge' WHERE category IN ('dryer', 'dryers');
UPDATE category_budgets SET category = 'Fer à repasser' WHERE category IN ('iron', 'irons');
UPDATE category_budgets SET category = 'Table à repasser' WHERE category IN ('ironing_board', 'ironing_boards');
UPDATE category_budgets SET category = 'Défroisseur vapeur' WHERE category IN ('steamer', 'steamers');
UPDATE category_budgets SET category = 'Chaudière' WHERE category IN ('boiler', 'boilers');
UPDATE category_budgets SET category = 'Extracteur' WHERE category IN ('extractor', 'extractors');
UPDATE category_budgets SET category = 'Plieuse' WHERE category IN ('folder', 'folders');
UPDATE category_budgets SET category = 'Sachet plastique' WHERE category IN ('plastic_packaging', 'plastic_packagings');
UPDATE category_budgets SET category = 'Carton' WHERE category IN ('cardboard_box', 'cardboard_boxes');
UPDATE category_budgets SET category = 'Cintre' WHERE category IN ('hanger', 'hangers');
UPDATE category_budgets SET category = 'Housse de protection' WHERE category IN ('garment_bag', 'garment_bags');
UPDATE category_budgets SET category = 'Étiquette autocollante' WHERE category IN ('label_sticker', 'label_stickers');
UPDATE category_budgets SET category = 'Papier ticket' WHERE category IN ('receipt_paper', 'receipt_papers');
UPDATE category_budgets SET category = 'Cartouche encre' WHERE category IN ('ink_toner', 'ink_toners');
UPDATE category_budgets SET category = 'Fournitures bureau' WHERE category IN ('office_supplies', 'office_supply');
UPDATE category_budgets SET category = 'Équipement informatique' WHERE category IN ('computer_equipment', 'computer_equipments');
UPDATE category_budgets SET category = 'Logiciel comptable' WHERE category IN ('accounting_software', 'accounting_softwares');
UPDATE category_budgets SET category = 'Carburant groupe électrogène' WHERE category IN ('fuel_for_generator', 'fuel_for_generators');
UPDATE category_budgets SET category = 'Carburant véhicule' WHERE category IN ('fuel_for_vehicle', 'fuel_for_vehicles');
UPDATE category_budgets SET category = 'Électricité JIRAMA' WHERE category IN ('electricity', 'electricities');
UPDATE category_budgets SET category = 'Eau JIRAMA' WHERE category IN ('water', 'waters');
UPDATE category_budgets SET category = 'Internet' WHERE category IN ('internet', 'internets');
UPDATE category_budgets SET category = 'Téléphone' WHERE category IN ('phone', 'phones');
UPDATE category_budgets SET category = 'Maintenance solaire' WHERE category IN ('solar_maintenance', 'solar_maintenances');
UPDATE category_budgets SET category = 'Maintenance groupe électrogène' WHERE category IN ('generator_maintenance', 'generator_maintenances');
UPDATE category_budgets SET category = 'Loyer local' WHERE category IN ('rent', 'rents');
UPDATE category_budgets SET category = 'Taxe foncière' WHERE category IN ('property_tax', 'property_taxes');
UPDATE category_budgets SET category = 'Rénovation' WHERE category IN ('renovation', 'renovations');
UPDATE category_budgets SET category = 'Sécurité' WHERE category IN ('security', 'securities');
UPDATE category_budgets SET category = 'Service de nettoyage' WHERE category IN ('cleaning_service', 'cleaning_services');
UPDATE category_budgets SET category = 'Salaire employé' WHERE category IN ('salary', 'salaries');
UPDATE category_budgets SET category = 'Heures supplémentaires' WHERE category IN ('overtime', 'overtimes');
UPDATE category_budgets SET category = 'Prime' WHERE category IN ('bonus', 'bonuses');
UPDATE category_budgets SET category = 'Charges sociales' WHERE category IN ('social_charges', 'social_charge');
UPDATE category_budgets SET category = 'Formation' WHERE category IN ('training', 'trainings');
UPDATE category_budgets SET category = 'Assurance santé' WHERE category IN ('health_insurance', 'health_insurances');
UPDATE category_budgets SET category = 'Uniforme' WHERE category IN ('uniform', 'uniforms');
UPDATE category_budgets SET category = 'Indemnité transport' WHERE category IN ('transport_allowance', 'transport_allowances');
UPDATE category_budgets SET category = 'Livraison moto' WHERE category IN ('delivery_motorbike', 'delivery_motorbikes');
UPDATE category_budgets SET category = 'Livraison voiture' WHERE category IN ('delivery_car', 'delivery_cars');
UPDATE category_budgets SET category = 'Livreur' WHERE category IN ('delivery_staff', 'delivery_staffs');
UPDATE category_budgets SET category = 'Carburant livraison' WHERE category IN ('delivery_fuel', 'delivery_fuels');
UPDATE category_budgets SET category = 'Entretien véhicule' WHERE category IN ('vehicle_maintenance', 'vehicle_maintenances');
UPDATE category_budgets SET category = 'Assurance véhicule' WHERE category IN ('insurance_vehicle', 'insurance_vehicles');
UPDATE category_budgets SET category = 'Flyer publicitaire' WHERE category IN ('marketing_flyer', 'marketing_flyers');
UPDATE category_budgets SET category = 'Réseaux sociaux' WHERE category IN ('marketing_social', 'marketing_socials');
UPDATE category_budgets SET category = 'Promotion' WHERE category IN ('marketing_promo', 'marketing_promos');
UPDATE category_budgets SET category = 'Enseigne' WHERE category IN ('signage', 'signages');
UPDATE category_budgets SET category = 'Publicité radio/TV' WHERE category IN ('radio_tv', 'radio_tvs');
UPDATE category_budgets SET category = 'Site web' WHERE category IN ('website', 'websites');
UPDATE category_budgets SET category = 'Honoraire comptable' WHERE category IN ('accountant', 'accountants');
UPDATE category_budgets SET category = 'Frais juridiques' WHERE category IN ('legal_fees', 'legal_fee');
UPDATE category_budgets SET category = 'Consulting' WHERE category IN ('consulting', 'consultings');
UPDATE category_budgets SET category = 'IRSA' WHERE category IN ('tax_irsa', 'irsa');
UPDATE category_budgets SET category = 'TVA' WHERE category IN ('tax_vat', 'vat');
UPDATE category_budgets SET category = 'IB' WHERE category IN ('tax_ib', 'ib');
UPDATE category_budgets SET category = 'Taxe municipale' WHERE category IN ('municipal_tax', 'municipal_taxes');
UPDATE category_budgets SET category = 'Patente' WHERE category IN ('business_license', 'business_licenses');
UPDATE category_budgets SET category = 'Frais bancaires' WHERE category IN ('bank_fees', 'bank_fee');
UPDATE category_budgets SET category = 'Transfert argent' WHERE category IN ('money_transfer', 'money_transfers');
UPDATE category_budgets SET category = 'Intérêts emprunt' WHERE category IN ('loan_interest', 'loan_interests');
UPDATE category_budgets SET category = 'Prime assurance' WHERE category IN ('insurance_premium', 'insurance_premiums');
UPDATE category_budgets SET category = 'Repas personnel' WHERE category IN ('staff_meal', 'staff_meals');
UPDATE category_budgets SET category = 'Eau en bouteille' WHERE category IN ('water_bottles', 'water_bottle');
UPDATE category_budgets SET category = 'Café-Thé' WHERE category IN ('coffee_tea', 'coffee_teas');
UPDATE category_budgets SET category = 'Pharmacie' WHERE category IN ('first_aid', 'first_aids');
UPDATE category_budgets SET category = 'Événement social' WHERE category IN ('social_event', 'social_events');
UPDATE category_budgets SET category = 'Imprévu' WHERE category IN ('contingency', 'contingencies');
UPDATE category_budgets SET category = 'Vol-perte' WHERE category IN ('theft_loss', 'theft_losses');
UPDATE category_budgets SET category = 'Autres' WHERE category IN ('other', 'others', 'autre');

-- budget_alerts
UPDATE budget_alerts SET category = 'Assouplissant' WHERE category IN ('fabric_softener', 'fabric_softeners');
UPDATE budget_alerts SET category = 'Détergent en poudre' WHERE category IN ('detergent_powder', 'detergent_powders');
UPDATE budget_alerts SET category = 'Détergent liquide' WHERE category IN ('detergent_liquid', 'detergent_liquids');
UPDATE budget_alerts SET category = 'Eau de Javel' WHERE category IN ('bleach', 'bleaches');
UPDATE budget_alerts SET category = 'Détachant' WHERE category IN ('stain_remover', 'stain_removers');
UPDATE budget_alerts SET category = 'Dégraissant professionnel' WHERE category IN ('degreaser', 'degreasers');
UPDATE budget_alerts SET category = 'Désinfectant' WHERE category IN ('disinfectant', 'disinfectants');
UPDATE budget_alerts SET category = 'Machine à laver' WHERE category IN ('washing_machine', 'washing_machines');
UPDATE budget_alerts SET category = 'Sèche-linge' WHERE category IN ('dryer', 'dryers');
UPDATE budget_alerts SET category = 'Fer à repasser' WHERE category IN ('iron', 'irons');
UPDATE budget_alerts SET category = 'Table à repasser' WHERE category IN ('ironing_board', 'ironing_boards');
UPDATE budget_alerts SET category = 'Défroisseur vapeur' WHERE category IN ('steamer', 'steamers');
UPDATE budget_alerts SET category = 'Chaudière' WHERE category IN ('boiler', 'boilers');
UPDATE budget_alerts SET category = 'Extracteur' WHERE category IN ('extractor', 'extractors');
UPDATE budget_alerts SET category = 'Plieuse' WHERE category IN ('folder', 'folders');
UPDATE budget_alerts SET category = 'Sachet plastique' WHERE category IN ('plastic_packaging', 'plastic_packagings');
UPDATE budget_alerts SET category = 'Carton' WHERE category IN ('cardboard_box', 'cardboard_boxes');
UPDATE budget_alerts SET category = 'Cintre' WHERE category IN ('hanger', 'hangers');
UPDATE budget_alerts SET category = 'Housse de protection' WHERE category IN ('garment_bag', 'garment_bags');
UPDATE budget_alerts SET category = 'Étiquette autocollante' WHERE category IN ('label_sticker', 'label_stickers');
UPDATE budget_alerts SET category = 'Papier ticket' WHERE category IN ('receipt_paper', 'receipt_papers');
UPDATE budget_alerts SET category = 'Cartouche encre' WHERE category IN ('ink_toner', 'ink_toners');
UPDATE budget_alerts SET category = 'Fournitures bureau' WHERE category IN ('office_supplies', 'office_supply');
UPDATE budget_alerts SET category = 'Équipement informatique' WHERE category IN ('computer_equipment', 'computer_equipments');
UPDATE budget_alerts SET category = 'Logiciel comptable' WHERE category IN ('accounting_software', 'accounting_softwares');
UPDATE budget_alerts SET category = 'Carburant groupe électrogène' WHERE category IN ('fuel_for_generator', 'fuel_for_generators');
UPDATE budget_alerts SET category = 'Carburant véhicule' WHERE category IN ('fuel_for_vehicle', 'fuel_for_vehicles');
UPDATE budget_alerts SET category = 'Électricité JIRAMA' WHERE category IN ('electricity', 'electricities');
UPDATE budget_alerts SET category = 'Eau JIRAMA' WHERE category IN ('water', 'waters');
UPDATE budget_alerts SET category = 'Internet' WHERE category IN ('internet', 'internets');
UPDATE budget_alerts SET category = 'Téléphone' WHERE category IN ('phone', 'phones');
UPDATE budget_alerts SET category = 'Maintenance solaire' WHERE category IN ('solar_maintenance', 'solar_maintenances');
UPDATE budget_alerts SET category = 'Maintenance groupe électrogène' WHERE category IN ('generator_maintenance', 'generator_maintenances');
UPDATE budget_alerts SET category = 'Loyer local' WHERE category IN ('rent', 'rents');
UPDATE budget_alerts SET category = 'Taxe foncière' WHERE category IN ('property_tax', 'property_taxes');
UPDATE budget_alerts SET category = 'Rénovation' WHERE category IN ('renovation', 'renovations');
UPDATE budget_alerts SET category = 'Sécurité' WHERE category IN ('security', 'securities');
UPDATE budget_alerts SET category = 'Service de nettoyage' WHERE category IN ('cleaning_service', 'cleaning_services');
UPDATE budget_alerts SET category = 'Salaire employé' WHERE category IN ('salary', 'salaries');
UPDATE budget_alerts SET category = 'Heures supplémentaires' WHERE category IN ('overtime', 'overtimes');
UPDATE budget_alerts SET category = 'Prime' WHERE category IN ('bonus', 'bonuses');
UPDATE budget_alerts SET category = 'Charges sociales' WHERE category IN ('social_charges', 'social_charge');
UPDATE budget_alerts SET category = 'Formation' WHERE category IN ('training', 'trainings');
UPDATE budget_alerts SET category = 'Assurance santé' WHERE category IN ('health_insurance', 'health_insurances');
UPDATE budget_alerts SET category = 'Uniforme' WHERE category IN ('uniform', 'uniforms');
UPDATE budget_alerts SET category = 'Indemnité transport' WHERE category IN ('transport_allowance', 'transport_allowances');
UPDATE budget_alerts SET category = 'Livraison moto' WHERE category IN ('delivery_motorbike', 'delivery_motorbikes');
UPDATE budget_alerts SET category = 'Livraison voiture' WHERE category IN ('delivery_car', 'delivery_cars');
UPDATE budget_alerts SET category = 'Livreur' WHERE category IN ('delivery_staff', 'delivery_staffs');
UPDATE budget_alerts SET category = 'Carburant livraison' WHERE category IN ('delivery_fuel', 'delivery_fuels');
UPDATE budget_alerts SET category = 'Entretien véhicule' WHERE category IN ('vehicle_maintenance', 'vehicle_maintenances');
UPDATE budget_alerts SET category = 'Assurance véhicule' WHERE category IN ('insurance_vehicle', 'insurance_vehicles');
UPDATE budget_alerts SET category = 'Flyer publicitaire' WHERE category IN ('marketing_flyer', 'marketing_flyers');
UPDATE budget_alerts SET category = 'Réseaux sociaux' WHERE category IN ('marketing_social', 'marketing_socials');
UPDATE budget_alerts SET category = 'Promotion' WHERE category IN ('marketing_promo', 'marketing_promos');
UPDATE budget_alerts SET category = 'Enseigne' WHERE category IN ('signage', 'signages');
UPDATE budget_alerts SET category = 'Publicité radio/TV' WHERE category IN ('radio_tv', 'radio_tvs');
UPDATE budget_alerts SET category = 'Site web' WHERE category IN ('website', 'websites');
UPDATE budget_alerts SET category = 'Honoraire comptable' WHERE category IN ('accountant', 'accountants');
UPDATE budget_alerts SET category = 'Frais juridiques' WHERE category IN ('legal_fees', 'legal_fee');
UPDATE budget_alerts SET category = 'Consulting' WHERE category IN ('consulting', 'consultings');
UPDATE budget_alerts SET category = 'IRSA' WHERE category IN ('tax_irsa', 'irsa');
UPDATE budget_alerts SET category = 'TVA' WHERE category IN ('tax_vat', 'vat');
UPDATE budget_alerts SET category = 'IB' WHERE category IN ('tax_ib', 'ib');
UPDATE budget_alerts SET category = 'Taxe municipale' WHERE category IN ('municipal_tax', 'municipal_taxes');
UPDATE budget_alerts SET category = 'Patente' WHERE category IN ('business_license', 'business_licenses');
UPDATE budget_alerts SET category = 'Frais bancaires' WHERE category IN ('bank_fees', 'bank_fee');
UPDATE budget_alerts SET category = 'Transfert argent' WHERE category IN ('money_transfer', 'money_transfers');
UPDATE budget_alerts SET category = 'Intérêts emprunt' WHERE category IN ('loan_interest', 'loan_interests');
UPDATE budget_alerts SET category = 'Prime assurance' WHERE category IN ('insurance_premium', 'insurance_premiums');
UPDATE budget_alerts SET category = 'Repas personnel' WHERE category IN ('staff_meal', 'staff_meals');
UPDATE budget_alerts SET category = 'Eau en bouteille' WHERE category IN ('water_bottles', 'water_bottle');
UPDATE budget_alerts SET category = 'Café-Thé' WHERE category IN ('coffee_tea', 'coffee_teas');
UPDATE budget_alerts SET category = 'Pharmacie' WHERE category IN ('first_aid', 'first_aids');
UPDATE budget_alerts SET category = 'Événement social' WHERE category IN ('social_event', 'social_events');
UPDATE budget_alerts SET category = 'Imprévu' WHERE category IN ('contingency', 'contingencies');
UPDATE budget_alerts SET category = 'Vol-perte' WHERE category IN ('theft_loss', 'theft_losses');
UPDATE budget_alerts SET category = 'Autres' WHERE category IN ('other', 'others', 'autre');

-- recurring_expenses
UPDATE recurring_expenses SET category = 'Assouplissant' WHERE category IN ('fabric_softener', 'fabric_softeners');
UPDATE recurring_expenses SET category = 'Détergent en poudre' WHERE category IN ('detergent_powder', 'detergent_powders');
UPDATE recurring_expenses SET category = 'Détergent liquide' WHERE category IN ('detergent_liquid', 'detergent_liquids');
UPDATE recurring_expenses SET category = 'Eau de Javel' WHERE category IN ('bleach', 'bleaches');
UPDATE recurring_expenses SET category = 'Détachant' WHERE category IN ('stain_remover', 'stain_removers');
UPDATE recurring_expenses SET category = 'Dégraissant professionnel' WHERE category IN ('degreaser', 'degreasers');
UPDATE recurring_expenses SET category = 'Désinfectant' WHERE category IN ('disinfectant', 'disinfectants');
UPDATE recurring_expenses SET category = 'Machine à laver' WHERE category IN ('washing_machine', 'washing_machines');
UPDATE recurring_expenses SET category = 'Sèche-linge' WHERE category IN ('dryer', 'dryers');
UPDATE recurring_expenses SET category = 'Fer à repasser' WHERE category IN ('iron', 'irons');
UPDATE recurring_expenses SET category = 'Table à repasser' WHERE category IN ('ironing_board', 'ironing_boards');
UPDATE recurring_expenses SET category = 'Défroisseur vapeur' WHERE category IN ('steamer', 'steamers');
UPDATE recurring_expenses SET category = 'Chaudière' WHERE category IN ('boiler', 'boilers');
UPDATE recurring_expenses SET category = 'Extracteur' WHERE category IN ('extractor', 'extractors');
UPDATE recurring_expenses SET category = 'Plieuse' WHERE category IN ('folder', 'folders');
UPDATE recurring_expenses SET category = 'Sachet plastique' WHERE category IN ('plastic_packaging', 'plastic_packagings');
UPDATE recurring_expenses SET category = 'Carton' WHERE category IN ('cardboard_box', 'cardboard_boxes');
UPDATE recurring_expenses SET category = 'Cintre' WHERE category IN ('hanger', 'hangers');
UPDATE recurring_expenses SET category = 'Housse de protection' WHERE category IN ('garment_bag', 'garment_bags');
UPDATE recurring_expenses SET category = 'Étiquette autocollante' WHERE category IN ('label_sticker', 'label_stickers');
UPDATE recurring_expenses SET category = 'Papier ticket' WHERE category IN ('receipt_paper', 'receipt_papers');
UPDATE recurring_expenses SET category = 'Cartouche encre' WHERE category IN ('ink_toner', 'ink_toners');
UPDATE recurring_expenses SET category = 'Fournitures bureau' WHERE category IN ('office_supplies', 'office_supply');
UPDATE recurring_expenses SET category = 'Équipement informatique' WHERE category IN ('computer_equipment', 'computer_equipments');
UPDATE recurring_expenses SET category = 'Logiciel comptable' WHERE category IN ('accounting_software', 'accounting_softwares');
UPDATE recurring_expenses SET category = 'Carburant groupe électrogène' WHERE category IN ('fuel_for_generator', 'fuel_for_generators');
UPDATE recurring_expenses SET category = 'Carburant véhicule' WHERE category IN ('fuel_for_vehicle', 'fuel_for_vehicles');
UPDATE recurring_expenses SET category = 'Électricité JIRAMA' WHERE category IN ('electricity', 'electricities');
UPDATE recurring_expenses SET category = 'Eau JIRAMA' WHERE category IN ('water', 'waters');
UPDATE recurring_expenses SET category = 'Internet' WHERE category IN ('internet', 'internets');
UPDATE recurring_expenses SET category = 'Téléphone' WHERE category IN ('phone', 'phones');
UPDATE recurring_expenses SET category = 'Maintenance solaire' WHERE category IN ('solar_maintenance', 'solar_maintenances');
UPDATE recurring_expenses SET category = 'Maintenance groupe électrogène' WHERE category IN ('generator_maintenance', 'generator_maintenances');
UPDATE recurring_expenses SET category = 'Loyer local' WHERE category IN ('rent', 'rents');
UPDATE recurring_expenses SET category = 'Taxe foncière' WHERE category IN ('property_tax', 'property_taxes');
UPDATE recurring_expenses SET category = 'Rénovation' WHERE category IN ('renovation', 'renovations');
UPDATE recurring_expenses SET category = 'Sécurité' WHERE category IN ('security', 'securities');
UPDATE recurring_expenses SET category = 'Service de nettoyage' WHERE category IN ('cleaning_service', 'cleaning_services');
UPDATE recurring_expenses SET category = 'Salaire employé' WHERE category IN ('salary', 'salaries');
UPDATE recurring_expenses SET category = 'Heures supplémentaires' WHERE category IN ('overtime', 'overtimes');
UPDATE recurring_expenses SET category = 'Prime' WHERE category IN ('bonus', 'bonuses');
UPDATE recurring_expenses SET category = 'Charges sociales' WHERE category IN ('social_charges', 'social_charge');
UPDATE recurring_expenses SET category = 'Formation' WHERE category IN ('training', 'trainings');
UPDATE recurring_expenses SET category = 'Assurance santé' WHERE category IN ('health_insurance', 'health_insurances');
UPDATE recurring_expenses SET category = 'Uniforme' WHERE category IN ('uniform', 'uniforms');
UPDATE recurring_expenses SET category = 'Indemnité transport' WHERE category IN ('transport_allowance', 'transport_allowances');
UPDATE recurring_expenses SET category = 'Livraison moto' WHERE category IN ('delivery_motorbike', 'delivery_motorbikes');
UPDATE recurring_expenses SET category = 'Livraison voiture' WHERE category IN ('delivery_car', 'delivery_cars');
UPDATE recurring_expenses SET category = 'Livreur' WHERE category IN ('delivery_staff', 'delivery_staffs');
UPDATE recurring_expenses SET category = 'Carburant livraison' WHERE category IN ('delivery_fuel', 'delivery_fuels');
UPDATE recurring_expenses SET category = 'Entretien véhicule' WHERE category IN ('vehicle_maintenance', 'vehicle_maintenances');
UPDATE recurring_expenses SET category = 'Assurance véhicule' WHERE category IN ('insurance_vehicle', 'insurance_vehicles');
UPDATE recurring_expenses SET category = 'Flyer publicitaire' WHERE category IN ('marketing_flyer', 'marketing_flyers');
UPDATE recurring_expenses SET category = 'Réseaux sociaux' WHERE category IN ('marketing_social', 'marketing_socials');
UPDATE recurring_expenses SET category = 'Promotion' WHERE category IN ('marketing_promo', 'marketing_promos');
UPDATE recurring_expenses SET category = 'Enseigne' WHERE category IN ('signage', 'signages');
UPDATE recurring_expenses SET category = 'Publicité radio/TV' WHERE category IN ('radio_tv', 'radio_tvs');
UPDATE recurring_expenses SET category = 'Site web' WHERE category IN ('website', 'websites');
UPDATE recurring_expenses SET category = 'Honoraire comptable' WHERE category IN ('accountant', 'accountants');
UPDATE recurring_expenses SET category = 'Frais juridiques' WHERE category IN ('legal_fees', 'legal_fee');
UPDATE recurring_expenses SET category = 'Consulting' WHERE category IN ('consulting', 'consultings');
UPDATE recurring_expenses SET category = 'IRSA' WHERE category IN ('tax_irsa', 'irsa');
UPDATE recurring_expenses SET category = 'TVA' WHERE category IN ('tax_vat', 'vat');
UPDATE recurring_expenses SET category = 'IB' WHERE category IN ('tax_ib', 'ib');
UPDATE recurring_expenses SET category = 'Taxe municipale' WHERE category IN ('municipal_tax', 'municipal_taxes');
UPDATE recurring_expenses SET category = 'Patente' WHERE category IN ('business_license', 'business_licenses');
UPDATE recurring_expenses SET category = 'Frais bancaires' WHERE category IN ('bank_fees', 'bank_fee');
UPDATE recurring_expenses SET category = 'Transfert argent' WHERE category IN ('money_transfer', 'money_transfers');
UPDATE recurring_expenses SET category = 'Intérêts emprunt' WHERE category IN ('loan_interest', 'loan_interests');
UPDATE recurring_expenses SET category = 'Prime assurance' WHERE category IN ('insurance_premium', 'insurance_premiums');
UPDATE recurring_expenses SET category = 'Repas personnel' WHERE category IN ('staff_meal', 'staff_meals');
UPDATE recurring_expenses SET category = 'Eau en bouteille' WHERE category IN ('water_bottles', 'water_bottle');
UPDATE recurring_expenses SET category = 'Café-Thé' WHERE category IN ('coffee_tea', 'coffee_teas');
UPDATE recurring_expenses SET category = 'Pharmacie' WHERE category IN ('first_aid', 'first_aids');
UPDATE recurring_expenses SET category = 'Événement social' WHERE category IN ('social_event', 'social_events');
UPDATE recurring_expenses SET category = 'Imprévu' WHERE category IN ('contingency', 'contingencies');
UPDATE recurring_expenses SET category = 'Vol-perte' WHERE category IN ('theft_loss', 'theft_losses');
UPDATE recurring_expenses SET category = 'Autres' WHERE category IN ('other', 'others', 'autre');

-- ================================================================
-- ÉTAPE 7: Vérifier s'il reste des valeurs non converties
-- ================================================================

SELECT DISTINCT category FROM expenses WHERE category NOT IN (
  'Détergent en poudre', 'Détergent liquide', 'Assouplissant', 'Eau de Javel', 
  'Détachant', 'Dégraissant professionnel', 'Désinfectant', 'Machine à laver', 
  'Sèche-linge', 'Fer à repasser', 'Table à repasser', 'Défroisseur vapeur', 
  'Chaudière', 'Extracteur', 'Plieuse', 'Sachet plastique', 'Carton', 'Cintre', 
  'Housse de protection', 'Étiquette autocollante', 'Papier ticket', 
  'Cartouche encre', 'Fournitures bureau', 'Équipement informatique', 
  'Logiciel comptable', 'Carburant groupe électrogène', 'Carburant véhicule', 
  'Électricité JIRAMA', 'Eau JIRAMA', 'Internet', 'Téléphone', 
  'Maintenance solaire', 'Maintenance groupe électrogène', 'Loyer local', 
  'Taxe foncière', 'Rénovation', 'Sécurité', 'Service de nettoyage', 
  'Salaire employé', 'Heures supplémentaires', 'Prime', 'Charges sociales', 
  'Formation', 'Assurance santé', 'Uniforme', 'Indemnité transport', 
  'Livraison moto', 'Livraison voiture', 'Livreur', 'Carburant livraison', 
  'Entretien véhicule', 'Assurance véhicule', 'Flyer publicitaire', 
  'Réseaux sociaux', 'Promotion', 'Enseigne', 'Publicité radio/TV', 'Site web', 
  'Honoraire comptable', 'Frais juridiques', 'Consulting', 'IRSA', 'TVA', 'IB', 
  'Taxe municipale', 'Patente', 'Frais bancaires', 'Transfert argent', 
  'Intérêts emprunt', 'Prime assurance', 'Repas personnel', 'Eau en bouteille', 
  'Café-Thé', 'Pharmacie', 'Événement social', 'Imprévu', 'Vol-perte', 'Autres'
);

-- ================================================================
-- ÉTAPE 8: Si des valeurs restent, les mettre à jour manuellement
-- ================================================================

-- Par exemple, si 'fabric_softeners' n'a pas été converti:
-- UPDATE expenses SET category = 'Assouplissant' WHERE category = 'fabric_softeners';
-- Faites de même pour les autres tables si nécessaire

-- ================================================================
-- ÉTAPE 9: Convertir les colonnes vers le nouveau type ENUM
-- ================================================================

ALTER TABLE expenses ALTER COLUMN category TYPE expense_category_fr USING category::expense_category_fr;
ALTER TABLE category_budgets ALTER COLUMN category TYPE expense_category_fr USING category::expense_category_fr;
ALTER TABLE budget_alerts ALTER COLUMN category TYPE expense_category_fr USING category::expense_category_fr;
ALTER TABLE recurring_expenses ALTER COLUMN category TYPE expense_category_fr USING category::expense_category_fr;

-- ================================================================
-- ÉTAPE 10: Supprimer la colonne category_label (optionnel)
-- ================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'category_label'
    ) THEN
        ALTER TABLE expenses DROP COLUMN category_label;
        RAISE NOTICE 'Colonne category_label supprimée avec succès';
    ELSE
        RAISE NOTICE 'La colonne category_label n''existe pas';
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 11: Vérifications finales
-- ================================================================

SELECT DISTINCT category FROM expenses ORDER BY category;
SELECT DISTINCT category FROM category_budgets ORDER BY category;
SELECT COUNT(*) FROM expenses WHERE category IS NULL;

SELECT category, COUNT(*) as count, SUM(amount::numeric) as total
FROM expenses 
GROUP BY category 
ORDER BY total DESC;

-- ================================================================
-- FIN DE LA MIGRATION
-- ================================================================