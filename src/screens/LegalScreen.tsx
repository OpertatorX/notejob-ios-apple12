import React from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Language, Translations } from '../i18n/strings';

export type LegalPage = 'privacy' | 'terms' | 'support' | 'safety';

const COPY = {
  fr: {
    privacy: {
      title: 'Confidentialité',
      intro: 'NoteJob publie des évaluations structurées sans afficher l’identité réelle des salariés.',
      sections: [
        ['Données visibles', 'Les évaluations individuelles peuvent être affichées sous forme structurée, sans nom ni profil public. Les statistiques restent agrégées par établissement.'],
        ['Identité technique', 'Pour publier, l’application utilise une session Supabase anonyme. Un identifiant technique pseudonyme permet de limiter les doublons, de modérer, de masquer et de bloquer les contenus abusifs.'],
        ['Données saisies', 'Une évaluation peut contenir des notes de 1 à 5, une recommandation oui/non, le statut salarié actuel ou ancien et un intitulé de poste facultatif.'],
        ['Publicité', 'L’application peut afficher des annonces Google AdMob. Le consentement publicitaire est demandé lorsque la réglementation l’exige.'],
        ['Suppression', 'L’utilisateur peut supprimer sa propre évaluation depuis la fiche de l’entreprise.'],
      ],
    },
    terms: {
      title: 'Conditions d’utilisation',
      intro: 'NoteJob est réservé aux personnes de 18 ans et plus. La publication implique l’acceptation de ces règles.',
      sections: [
        ['Tolérance zéro', 'Aucun harcèlement, contenu haineux ou discriminatoire, menace, contenu sexuel explicite, divulgation d’informations personnelles, usurpation, spam, fraude ou comportement abusif n’est toléré.'],
        ['Expérience réelle', 'Les évaluations doivent refléter une expérience professionnelle réelle. Les critiques négatives sont autorisées lorsqu’elles restent respectueuses et ne visent pas une personne.'],
        ['Filtrage', 'Les champs publiés sont soumis à un filtre côté serveur avant leur mise en ligne. Un contenu non conforme peut être refusé automatiquement.'],
        ['Signalement et blocage', 'Chaque avis visible peut être signalé, masqué immédiatement du fil ou son auteur anonyme peut être bloqué.'],
        ['Modération sous 24 heures', 'NoteJob examine les signalements de contenu abusif sous 24 heures et peut retirer le contenu concerné et exclure son auteur.'],
      ],
    },
    support: {
      title: 'Aide & support',
      intro: 'Un problème avec une fiche, une note ou la recherche ? Voici les solutions les plus rapides.',
      sections: [
        ['Entreprise introuvable', 'Essayez le nom usuel de l’enseigne puis la ville ou le code postal.'],
        ['Donnée incorrecte', 'Depuis la fiche de l’entreprise, utilisez « Signaler une donnée incorrecte ».'],
        ['Modifier ou supprimer une note', 'Rouvrez la même entreprise sur le même appareil pour modifier ou supprimer votre évaluation.'],
        ['Contact', 'Pour toute question ou activité inappropriée : contact.operatorx@proton.me'],
      ],
    },
    safety: {
      title: 'Sécurité & contact',
      intro: 'NoteJob applique une politique de tolérance zéro envers les contenus répréhensibles et les utilisateurs abusifs.',
      sections: [
        ['Signaler un avis', 'Touchez ••• à droite d’un avis puis « Signaler cet avis ». Choisissez la raison et ajoutez, si nécessaire, une précision.'],
        ['Masquer immédiatement', 'L’action « Masquer cet avis » retire immédiatement cet avis de votre fil.'],
        ['Bloquer un utilisateur', 'L’action « Bloquer cet utilisateur » masque les avis de cet auteur pour votre session sans révéler son identité.'],
        ['Traitement sous 24 heures', 'Les signalements de contenu abusif sont examinés sous 24 heures. Le contenu peut être retiré et l’utilisateur responsable exclu.'],
        ['Contact direct', 'Vous pouvez signaler une activité inappropriée directement à contact.operatorx@proton.me.'],
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy',
      intro: 'NoteJob publishes structured workplace ratings without displaying employees’ real identities.',
      sections: [
        ['Visible data', 'Individual ratings may be displayed in structured form without a public name or profile. Statistics remain aggregated by workplace.'],
        ['Technical identity', 'Publishing uses an anonymous Supabase session. A pseudonymous technical identifier supports duplicate prevention, moderation, hiding and blocking.'],
        ['Submitted data', 'A rating may contain 1–5 scores, a yes/no recommendation, current/former employee status and an optional job title.'],
        ['Advertising', 'The app may show Google AdMob ads. Advertising consent is requested where required.'],
        ['Deletion', 'Users can delete their own rating from the company page.'],
      ],
    },
    terms: {
      title: 'Terms of use',
      intro: 'NoteJob is for people aged 18 and over. Publishing requires acceptance of these rules.',
      sections: [
        ['Zero tolerance', 'Harassment, hateful or discriminatory content, threats, explicit sexual content, disclosure of personal information, impersonation, spam, fraud and abusive behavior are not tolerated.'],
        ['Real experience', 'Ratings must reflect a real work experience. Negative criticism is allowed when it remains respectful and does not target an individual.'],
        ['Filtering', 'Published fields are filtered server-side before publication. Non-compliant content may be rejected automatically.'],
        ['Reporting and blocking', 'Each visible rating can be reported, immediately hidden from the feed, or its anonymous author can be blocked.'],
        ['Moderation within 24 hours', 'NoteJob reviews abusive-content reports within 24 hours and may remove the content and eject the responsible user.'],
      ],
    },
    support: {
      title: 'Help & support',
      intro: 'Having trouble with a workplace, rating or search? These are the fastest fixes.',
      sections: [
        ['Workplace not found', 'Try the public-facing brand name, then the city or postal code.'],
        ['Incorrect information', 'On the company page, use “Report incorrect data”.'],
        ['Edit or delete a rating', 'Open the same company on the same device to edit or delete your rating.'],
        ['Contact', 'For any question or inappropriate activity: contact.operatorx@proton.me'],
      ],
    },
    safety: {
      title: 'Safety & contact',
      intro: 'NoteJob has a zero-tolerance policy for objectionable content and abusive users.',
      sections: [
        ['Report a rating', 'Tap ••• next to a rating and choose “Report this rating”. Select a reason and optionally add details.'],
        ['Hide immediately', '“Hide this rating” immediately removes that rating from your feed.'],
        ['Block a user', '“Block this user” hides ratings from that author for your session without revealing their identity.'],
        ['Action within 24 hours', 'Abusive-content reports are reviewed within 24 hours. Content may be removed and the responsible user ejected.'],
        ['Direct contact', 'You can directly report inappropriate activity to contact.operatorx@proton.me.'],
      ],
    },
  },
} as const;

export function LegalScreen({ page, language, t, onBack }: {
  page: LegalPage;
  language: Language;
  t: Translations;
  onBack: () => void;
}) {
  const copy = COPY[language][page];
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>← {t.back}</Text></TouchableOpacity>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.intro}>{copy.intro}</Text>
        <View style={styles.rule} />
        {copy.sections.map(([heading, body]) => (
          <View key={heading} style={styles.section}>
            <Text style={styles.heading}>{heading}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        ))}
        {(page === 'support' || page === 'safety') && (
          <TouchableOpacity onPress={() => Linking.openURL('mailto:contact.operatorx@proton.me?subject=NoteJob%20-%20Safety%20Report')} style={styles.contact}>
            <Text style={styles.contactText}>{language === 'fr' ? 'Écrire à contact.operatorx@proton.me' : 'Email contact.operatorx@proton.me'}</Text>
            <Text style={styles.contactArrow}>↗</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.updated}>{language === 'fr' ? 'Dernière mise à jour : 24 septembre 2026' : 'Last updated: September 24, 2026'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7EFE4' },
  screen: { flex: 1, backgroundColor: '#F7EFE4' },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 50 },
  back: { fontSize: 14, fontWeight: '700', color: '#292826' },
  title: { marginTop: 38, fontSize: 37, lineHeight: 42, letterSpacing: -1.2, fontWeight: '800', color: '#111510' },
  intro: { marginTop: 18, fontSize: 18, lineHeight: 27, color: '#4F4A43', maxWidth: 360 },
  rule: { marginTop: 30, borderTopWidth: 2, borderColor: '#174C3D' },
  section: { paddingVertical: 24, borderBottomWidth: 1, borderColor: '#CFC9BD' },
  heading: { fontSize: 17, fontWeight: '800', color: '#111510' },
  body: { marginTop: 10, fontSize: 14, lineHeight: 22, color: '#5D574F' },
  contact: { marginTop: 28, minHeight: 58, borderRadius: 14, backgroundColor: '#174C3D', paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contactText: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  contactArrow: { color: '#FFFFFF', fontSize: 20 },
  updated: { marginTop: 24, fontSize: 11, color: '#8A847A' },
});
