import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AppData, DocumentKind, SavedService } from '../types';
import { formatMoney } from '../domain';
import { localeFor, tr } from '../i18n';
import { Card, ScreenTitle } from '../ui';
import { colors, radii } from '../theme';

export function ServicesScreen({ data, onCreate, onDelete }: { data:AppData; onCreate:(kind:DocumentKind,serviceId:string)=>void; onDelete:(id:string)=>void }) {
  const lang=data.business.language;
  const [query,setQuery]=useState('');
  const services=useMemo(()=>[...data.services]
    .filter(s=>`${s.title} ${s.details}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),[data.services,query]);
  const choose=(service:SavedService)=>Alert.alert('OX Invoice',lang==='fr'?`Utiliser « ${service.title} »`:`Use “${service.title}”`,[
    {text:tr(lang,'newEstimate'),onPress:()=>onCreate('estimate',service.id)},
    {text:tr(lang,'newInvoice'),onPress:()=>onCreate('invoice',service.id)},
    {text:lang==='fr'?'Annuler':'Cancel',style:'cancel'},
  ]);
  const remove=(service:SavedService)=>Alert.alert('OX Invoice',lang==='fr'?`Supprimer « ${service.title} » des prestations sauvegardées ?`:`Remove “${service.title}” from saved services?`,[
    {text:lang==='fr'?'Annuler':'Cancel',style:'cancel'},
    {text:lang==='fr'?'Supprimer':'Delete',style:'destructive',onPress:()=>onDelete(service.id)},
  ]);
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <ScreenTitle title={tr(lang,'services')} />
    <View style={styles.search}><TextInput value={query} onChangeText={setQuery} placeholder={lang==='fr'?'Rechercher une prestation…':'Search services…'} placeholderTextColor={colors.faint} style={styles.searchInput}/></View>
    {services.length===0?<Card><Text style={styles.emptyTitle}>{lang==='fr'?'Aucune prestation sauvegardée':'No saved services'}</Text><Text style={styles.emptyText}>{lang==='fr'?'Les prestations utilisées dans vos devis et factures sont enregistrées automatiquement ici.':'Line items used in estimates and invoices are saved here automatically.'}</Text></Card>:<Card style={{padding:0}}>{services.map((service,i)=><Pressable key={service.id} onPress={()=>choose(service)} onLongPress={()=>remove(service)} delayLongPress={450} style={[styles.row,i>0&&styles.border]}><View style={styles.icon}><Text style={styles.iconText}>S</Text></View><View style={{flex:1,minWidth:0}}><Text numberOfLines={1} style={styles.name}>{service.title}</Text><Text numberOfLines={1} style={styles.meta}>{service.details|| (lang==='fr'?'Touchez pour réutiliser':'Tap to reuse')}</Text></View><Text style={styles.rate}>{formatMoney(service.rate,data.business.currency,localeFor(lang))}</Text></Pressable>)}</Card>}
    {services.length>0?<Text style={styles.hint}>{lang==='fr'?'Astuce : appui long pour supprimer une prestation sauvegardée.':'Tip: long-press to remove a saved service.'}</Text>:null}
  </ScrollView>;
}

const styles=StyleSheet.create({content:{padding:20,paddingBottom:110,maxWidth:720,width:'100%',alignSelf:'center',gap:12},search:{borderWidth:1,borderColor:colors.line,borderRadius:radii.md,backgroundColor:'#fff'},searchInput:{paddingHorizontal:14,paddingVertical:12,fontSize:14,color:colors.ink},emptyTitle:{fontSize:16,fontWeight:'800',color:colors.ink},emptyText:{fontSize:14,lineHeight:20,color:colors.muted,marginTop:5},row:{minHeight:72,padding:14,flexDirection:'row',alignItems:'center',gap:11},border:{borderTopWidth:1,borderTopColor:colors.line},icon:{width:36,height:36,borderRadius:10,backgroundColor:colors.blueSoft,alignItems:'center',justifyContent:'center'},iconText:{fontSize:14,fontWeight:'900',color:colors.blue},name:{fontSize:14,fontWeight:'800',color:colors.ink},meta:{fontSize:11.5,color:colors.muted,marginTop:4},rate:{fontSize:13,fontWeight:'800',color:colors.ink},hint:{fontSize:11.5,color:colors.faint,textAlign:'center',marginTop:4}});
