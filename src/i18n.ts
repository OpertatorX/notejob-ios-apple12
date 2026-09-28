import type { Language } from './types';

const copy = {
  fr: {
    home: 'Accueil', documents: 'Documents', clients: 'Clients', services: 'Prestations', more: 'Plus',
    morning: 'Bonjour', glance: 'Votre activité en un coup d’œil.',
    unpaid: 'À recevoir', paid: 'Payé', overdue: 'En retard', pending: 'En attente',
    newEstimate: 'Nouveau devis', newInvoice: 'Nouvelle facture', recent: 'Documents récents', seeAll: 'Tout voir',
    noDocs: 'Aucun document', noDocsBody: 'Créez votre premier devis ou votre première facture en moins d’une minute.',
    setupBusiness: 'Configurer mon entreprise', setupHint: 'Ajoutez vos coordonnées pour des PDF prêts à envoyer.',
    searchDocs: 'Rechercher un document…', all: 'Tous', estimates: 'Devis', invoices: 'Factures',
    createEstimate: 'Créer un devis', createInvoice: 'Créer une facture', client: 'Client', lineItems: 'Prestations',
    addItem: 'Ajouter une ligne', recentClients: 'Clients récents', recentServices: 'Prestations récentes', issueDate: 'Date d’émission', discount: 'Remise', tax: 'Taxe', deposit: 'Acompte', dueDate: 'Échéance',
    notes: 'Notes', save: 'Enregistrer', preview: 'Aperçu', total: 'Total', balance: 'Reste à payer',
    business: 'Entreprise', language: 'Langue', currency: 'Devise', defaultTax: 'Taxe par défaut', pdfStyle: 'Style PDF',
    chooseLogo: 'Choisir un logo', removeLogo: 'Supprimer le logo', pro: 'OX Invoice Pro', restore: 'Restaurer les achats',
    unlock: 'Débloquer Pro', freeLeft: 'documents gratuits restants', unlimited: 'Documents illimités',
    paywallTitle: 'Facturez simplement. Sans abonnement mensuel hors de prix.',
    paywallBody: 'Créez, exportez et partagez vos devis et factures sans limite.',
    sixMonths: '6 mois', yearly: '1 an', bestValue: 'Meilleure offre', continue: 'Continuer',
    pdfQuality: 'PDF professionnel', localFirst: 'Données locales', noAds: 'Aucune publicité',
    businessName: 'Nom de l’entreprise', email: 'E-mail', phone: 'Téléphone', address: 'Adresse', taxId: 'N° TVA / SIRET', website: 'Site web', paymentDetails: 'Coordonnées de paiement',
    clientName: 'Nom du client', itemTitle: 'Prestation', itemDetails: 'Description', quantity: 'Qté', rate: 'Prix',
    sendShare: 'Partager le PDF', markPaid: 'Marquer payé', duplicate: 'Dupliquer', delete: 'Supprimer',
    sent: 'Envoyé', draft: 'Brouillon', accepted: 'Accepté', statusPaid: 'Payé', statusOverdue: 'En retard',
    managePlan: 'Gérer mon abonnement', legal: 'Confidentialité et conditions',
  },
  en: {
    home: 'Home', documents: 'Documents', clients: 'Clients', services: 'Services', more: 'More',
    morning: 'Good morning', glance: 'Here’s your business at a glance.',
    unpaid: 'Unpaid', paid: 'Paid', overdue: 'Overdue', pending: 'Pending',
    newEstimate: 'New Estimate', newInvoice: 'New Invoice', recent: 'Recent documents', seeAll: 'View all',
    noDocs: 'No documents yet', noDocsBody: 'Create your first estimate or invoice in under a minute.',
    setupBusiness: 'Set up business', setupHint: 'Add your details for client-ready PDFs.',
    searchDocs: 'Search documents…', all: 'All', estimates: 'Estimates', invoices: 'Invoices',
    createEstimate: 'Create Estimate', createInvoice: 'Create Invoice', client: 'Client', lineItems: 'Line items',
    addItem: 'Add item', recentClients: 'Recent clients', recentServices: 'Recent services', issueDate: 'Issue date', discount: 'Discount', tax: 'Tax', deposit: 'Deposit', dueDate: 'Due date',
    notes: 'Notes', save: 'Save', preview: 'Preview', total: 'Total', balance: 'Balance due',
    business: 'Business', language: 'Language', currency: 'Currency', defaultTax: 'Default tax', pdfStyle: 'PDF style',
    chooseLogo: 'Choose logo', removeLogo: 'Remove logo', pro: 'OX Invoice Pro', restore: 'Restore purchases',
    unlock: 'Unlock Pro', freeLeft: 'free documents left', unlimited: 'Unlimited documents',
    paywallTitle: 'Professional invoices. Without the expensive monthly subscription.',
    paywallBody: 'Create, export and share unlimited estimates and invoices.',
    sixMonths: '6 months', yearly: '1 year', bestValue: 'Best value', continue: 'Continue',
    pdfQuality: 'Professional PDFs', localFirst: 'Local-first data', noAds: 'No ads',
    businessName: 'Business name', email: 'Email', phone: 'Phone', address: 'Address', taxId: 'Tax / VAT ID', website: 'Website', paymentDetails: 'Payment details',
    clientName: 'Client name', itemTitle: 'Service', itemDetails: 'Description', quantity: 'Qty', rate: 'Rate',
    sendShare: 'Share PDF', markPaid: 'Mark as paid', duplicate: 'Duplicate', delete: 'Delete',
    sent: 'Sent', draft: 'Draft', accepted: 'Accepted', statusPaid: 'Paid', statusOverdue: 'Overdue',
    managePlan: 'Manage subscription', legal: 'Privacy & terms',
  }
} as const;

export type CopyKey = keyof typeof copy.fr;
export function tr(lang: Language, key: CopyKey): string { return copy[lang][key] ?? copy.en[key]; }
export function localeFor(lang: Language): string { return lang === 'fr' ? 'fr-FR' : 'en-US'; }
