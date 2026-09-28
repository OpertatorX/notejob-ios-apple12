import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { AppData } from '../types';
import { FREE_DOCUMENT_LIMIT } from '../domain';
import { tr } from '../i18n';
import { Card, Pill, ScreenTitle } from '../ui';
import { colors } from '../theme';

const ROOT='https://operatorx-ox-invoice.vercel.app';
function Row({title,sub,onPress}:{title:string;sub?:string;onPress:()=>void}){return <Pressable onPress={onPress} style={styles.row}><View style={{flex:1}}><Text style={styles.title}>{title}</Text>{sub?<Text style={styles.sub}>{sub}</Text>:null}</View><Text style={styles.chev}>›</Text></Pressable>}
export function MoreScreen({ data, onBusiness, onPaywall, onRestore, onReset }: { data:AppData; onBusiness:()=>void; onPaywall:()=>void; onRestore:()=>void; onReset:()=>void }) {
  const lang=data.business.language;
  const left=Math.max(0,FREE_DOCUMENT_LIMIT-data.freeDocumentsCreated);
  const localePath=lang==='fr'?'fr-FR':'en-US';
  const exportData=async()=>{
    try{
      const payload=JSON.stringify({exportedAt:new Date().toISOString(),app:'OX Invoice',schemaVersion:data.schemaVersion,data},null,2);
      const stamp=new Date().toISOString().slice(0,10);
      const file=new File(Paths.cache,`OX-Invoice-backup-${stamp}.json`);
      file.write(payload);
      if(await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri,{mimeType:'application/json',UTI:'public.json',dialogTitle:'OX Invoice Data Export'});
      else Alert.alert('OX Invoice',lang==='fr'?'Export créé dans le cache de l’app.':'Export created in the app cache.');
    }catch(e){Alert.alert('OX Invoice',e instanceof Error?e.message:'Export failed');}
  };
  return <ScrollView contentContainerStyle={styles.content}>
    <ScreenTitle title={tr(lang,'more')} />
    <Card style={{marginBottom:14}}><View style={styles.proHead}><View><Text style={styles.proTitle}>{tr(lang,'pro')}</Text><Text style={styles.proSub}>{data.proEntitled?tr(lang,'unlimited'):`${left} ${tr(lang,'freeLeft')}`}</Text></View><Pill text={data.proEntitled?'PRO':'FREE'} tone={data.proEntitled?'green':'neutral'}/></View>{!data.proEntitled?<Pressable onPress={onPaywall} style={styles.unlock}><Text style={styles.unlockText}>{tr(lang,'unlock')} →</Text></Pressable>:<Pressable onPress={()=>void Linking.openURL('https://apps.apple.com/account/subscriptions')} style={styles.manage}><Text style={styles.manageText}>{tr(lang,'managePlan')} →</Text></Pressable>}</Card>
    <Card style={{padding:0}}>
      <Row title={tr(lang,'business')} sub={data.business.name||tr(lang,'setupHint')} onPress={onBusiness}/><View style={styles.border}/>
      <Row title={lang==='fr'?'Exporter mes données':'Export my data'} sub={lang==='fr'?'Partage une copie JSON de vos données locales.':'Share a JSON copy of your local data.'} onPress={()=>void exportData()}/><View style={styles.border}/>
      <Row title={tr(lang,'restore')} onPress={onRestore}/><View style={styles.border}/>
      <Row title={lang==='fr'?'Effacer les données de l’activité':'Delete business data'} sub={lang==='fr'?'Supprime entreprise, clients, prestations et documents. Votre abonnement et le compteur d’essai ne sont pas réinitialisés.':'Deletes business profile, clients, services and documents. Your subscription and free-use counter are not reset.'} onPress={()=>Alert.alert('OX Invoice',lang==='fr'?'Effacer définitivement vos données d’activité sur cet appareil ?':'Permanently delete your business data on this device?',[{text:lang==='fr'?'Annuler':'Cancel',style:'cancel'},{text:lang==='fr'?'Tout effacer':'Delete all',style:'destructive',onPress:onReset}])}/><View style={styles.border}/>
      <Row title={lang==='fr'?'Confidentialité':'Privacy'} onPress={()=>void Linking.openURL(`${ROOT}/${localePath}/privacy.html`)}/><View style={styles.border}/>
      <Row title={lang==='fr'?'Conditions d’utilisation':'Terms of use'} onPress={()=>void Linking.openURL(`${ROOT}/${localePath}/terms.html`)}/><View style={styles.border}/>
      <Row title={lang==='fr'?'Aide et support':'Help & support'} onPress={()=>void Linking.openURL(`${ROOT}/${localePath}/support.html`)}/>
    </Card>
    <Text style={styles.footer}>OX Invoice 1.0 · by OperatorX</Text>
  </ScrollView>
}
const styles=StyleSheet.create({content:{padding:20,paddingBottom:110,maxWidth:720,width:'100%',alignSelf:'center'},proHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},proTitle:{fontSize:18,fontWeight:'900',color:colors.ink},proSub:{fontSize:13,color:colors.muted,marginTop:5},unlock:{marginTop:14,backgroundColor:colors.navy,borderRadius:12,padding:13,alignItems:'center'},unlockText:{color:'#fff',fontSize:14,fontWeight:'800'},manage:{marginTop:14,borderTopWidth:1,borderTopColor:colors.line,paddingTop:12},manageText:{color:colors.blue,fontSize:13,fontWeight:'800'},row:{minHeight:64,paddingHorizontal:15,paddingVertical:12,flexDirection:'row',alignItems:'center'},title:{fontSize:14,fontWeight:'800',color:colors.ink},sub:{fontSize:11.5,color:colors.muted,marginTop:4},chev:{fontSize:24,color:colors.faint},border:{height:1,backgroundColor:colors.line,marginLeft:15},footer:{textAlign:'center',fontSize:11,color:colors.faint,marginTop:22}});
