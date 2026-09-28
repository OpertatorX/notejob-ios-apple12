import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Language } from '../types';
import { PRODUCT_IDS, usePurchases } from '../purchases';
import { tr } from '../i18n';
import { Card, PrimaryButton, SecondaryButton, ScreenTitle } from '../ui';
import { colors } from '../theme';

const ROOT = 'https://operatorx-ox-invoice.vercel.app';

export function PaywallScreen({ lang, onBack, onRestored }: { lang:Language; onBack:()=>void; onRestored:()=>void }) {
  const {plans,busy,purchase,restore,connected,verificationConfigured}=usePurchases();
  const [selected,setSelected]=useState<string>(PRODUCT_IDS.yearly);
  const getPrice=(id:string)=>plans.find(p=>p.id===id)?.displayPrice||'—';
  const offers=useMemo(()=>[
    {id:PRODUCT_IDS.sixMonths,label:tr(lang,'sixMonths'),price:getPrice(PRODUCT_IDS.sixMonths),note:lang==='fr'?'Facturation tous les 6 mois':'Billed every 6 months'},
    {id:PRODUCT_IDS.yearly,label:tr(lang,'yearly'),price:getPrice(PRODUCT_IDS.yearly),note:tr(lang,'bestValue')},
  ],[plans,lang]);
  const selectedOffer=offers.find(o=>o.id===selected)!;
  const selectedLoaded=plans.some(p=>p.id===selected);
  const buy=async()=>{try{await purchase(selected);}catch(e){Alert.alert('OX Invoice',e instanceof Error?e.message:'Purchase error');}};
  const restoreNow=async()=>{const ok=await restore();Alert.alert('OX Invoice',ok?(lang==='fr'?'Achat restauré.':'Purchase restored.'):(lang==='fr'?'Aucun abonnement actif trouvé.':'No active subscription found.'));if(ok){onRestored();}};
  const localePath=lang==='fr'?'fr-FR':'en-US';
  return <ScrollView contentContainerStyle={styles.content}>
    <ScreenTitle eyebrow="OX Invoice Pro" title={tr(lang,'paywallTitle')} action={<SecondaryButton compact title="×" onPress={onBack}/>}/>
    <Text style={styles.body}>{tr(lang,'paywallBody')}</Text>
    <View style={styles.features}><View style={styles.feature}><Text style={styles.featureIcon}>✓</Text><Text style={styles.featureText}>{tr(lang,'unlimited')}</Text></View><View style={styles.feature}><Text style={styles.featureIcon}>✓</Text><Text style={styles.featureText}>{tr(lang,'pdfQuality')}</Text></View><View style={styles.feature}><Text style={styles.featureIcon}>✓</Text><Text style={styles.featureText}>{tr(lang,'localFirst')}</Text></View><View style={styles.feature}><Text style={styles.featureIcon}>✓</Text><Text style={styles.featureText}>{tr(lang,'noAds')}</Text></View></View>
    <View style={{gap:10}}>{offers.map(o=><Pressable key={o.id} onPress={()=>setSelected(o.id)}><Card style={[styles.offer,selected===o.id&&styles.offerActive]}><View><View style={styles.offerTitleRow}><Text style={styles.offerLabel}>{o.label}</Text>{o.id===PRODUCT_IDS.yearly?<Text style={styles.badge}>{tr(lang,'bestValue')}</Text>:null}</View><Text style={styles.offerNote}>{o.note}</Text></View><Text style={styles.price}>{o.price}</Text></Card></Pressable>)}</View>
    {!verificationConfigured?<Text style={styles.setupWarning}>{lang==='fr'?'Achats désactivés dans ce build : clé de vérification IAPKit manquante.':'Purchases are disabled in this build: IAPKit verification key is missing.'}</Text>:null}
    {verificationConfigured&&connected&&!selectedLoaded?<Text style={styles.setupWarning}>{lang==='fr'?'Chargement des prix App Store…':'Loading App Store prices…'}</Text>:null}
    <PrimaryButton title={busy?(lang==='fr'?'Connexion…':'Connecting…'):`${tr(lang,'continue')} · ${selectedOffer.price}`} disabled={busy||!connected||!verificationConfigured||!selectedLoaded} onPress={buy}/>
    <Pressable disabled={busy} onPress={restoreNow}><Text style={styles.restore}>{tr(lang,'restore')}</Text></Pressable>
    <Text style={styles.legal}>{lang==='fr'?'Abonnement auto-renouvelable. Le paiement est débité de votre compte Apple à la confirmation. Le renouvellement est automatique sauf annulation au moins 24 h avant la fin de la période. Vous pouvez gérer ou annuler votre abonnement dans les réglages de votre compte Apple. Le prix affiché par l’App Store prévaut.':'Auto-renewable subscription. Payment is charged to your Apple account at confirmation. It renews automatically unless canceled at least 24 hours before the end of the current period. Manage or cancel in your Apple account settings. The App Store displayed price always applies.'}</Text>
    <View style={styles.links}><Pressable onPress={()=>void Linking.openURL(`${ROOT}/${localePath}/terms.html`)}><Text style={styles.link}>{lang==='fr'?'Conditions':'Terms'}</Text></Pressable><Text style={styles.dot}>•</Text><Pressable onPress={()=>void Linking.openURL(`${ROOT}/${localePath}/privacy.html`)}><Text style={styles.link}>{lang==='fr'?'Confidentialité':'Privacy'}</Text></Pressable></View>
  </ScrollView>
}
const styles=StyleSheet.create({content:{padding:22,paddingBottom:50,maxWidth:560,width:'100%',alignSelf:'center'},body:{fontSize:16,lineHeight:23,color:colors.muted,marginTop:-8,marginBottom:20},features:{gap:10,marginBottom:22},feature:{flexDirection:'row',alignItems:'center',gap:9},featureIcon:{width:22,height:22,textAlign:'center',lineHeight:22,borderRadius:11,backgroundColor:colors.greenSoft,color:colors.green,fontWeight:'900'},featureText:{fontSize:14,fontWeight:'700',color:colors.ink},offer:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:18,shadowOpacity:0},offerActive:{borderColor:colors.navy,borderWidth:2},offerTitleRow:{flexDirection:'row',alignItems:'center',gap:7},offerLabel:{fontSize:17,fontWeight:'900',color:colors.ink},badge:{fontSize:9,fontWeight:'900',textTransform:'uppercase',letterSpacing:.5,color:colors.green,backgroundColor:colors.greenSoft,paddingHorizontal:7,paddingVertical:4,borderRadius:999},offerNote:{fontSize:12,color:colors.muted,marginTop:4},price:{fontSize:18,fontWeight:'900',color:colors.ink},setupWarning:{fontSize:11.5,lineHeight:17,color:colors.amber,textAlign:'center',backgroundColor:colors.amberSoft,borderRadius:10,padding:10,marginTop:12},restore:{fontSize:13,fontWeight:'800',color:colors.blue,textAlign:'center',marginTop:17},legal:{fontSize:10.5,lineHeight:15,color:colors.faint,textAlign:'center',marginTop:18},links:{flexDirection:'row',justifyContent:'center',gap:8,marginTop:10},link:{fontSize:11.5,fontWeight:'700',color:colors.blue},dot:{color:colors.faint}});
